import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Banknote,
  Shield,
  CreditCard,
  XCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  loadRazorpayScript,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay";
import {
  useCreateOrder,
  useVerifyPayment,
  useConfirmCash,
} from "@/api/payments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Browser } from "@capacitor/browser";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useConfirmEvReservation } from "@/modules/ev/hooks";

const UpiPaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state || {
    slot: "A-12",
    price: 40,
    duration: "2 hrs",
    parking: "Phoenix Mall Parking",
  };

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash" | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentDetails, setPaymentDetails] =
    useState<RazorpaySuccessResponse | null>(null);

  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();
  const confirmCash = useConfirmCash();
  const qc = useQueryClient();

  const purchasePass = useMutation({
    mutationFn: (payload: {
      facility_id: string;
      vehicle_id: string;
      duration_months: number;
      payment_id: string;
    }) => api.post("/passes/monthly", payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["active-pass"] }),
  });

  const isPass = !!booking.isPass;
  const isEv = booking.kind === "ev-charging" && !!booking.evReservationId;
  const isNative = Capacitor.isNativePlatform();

  const confirmEvReservation = useConfirmEvReservation();

  const navigateAfterPayment = (paymentId?: string, method?: string) => {
    if (isPass) {
      navigate("/monthly-pass/active", { replace: true });
    } else if (isEv) {
      navigate(`/ev/reservation/${booking.evReservationId}/qr`, {
        replace: true,
      });
    } else {
      navigate("/booking-qr", {
        replace: true,
        state: {
          bookingId: booking.bookingReference || booking.bookingId,
          slot: booking.slot,
          parking: booking.parking,
          facilityLat: booking.facilityLat ?? null,
          facilityLng: booking.facilityLng ?? null,
          facilityAddress: booking.facilityAddress ?? null,
          vehicle: "Vehicle",
          duration: booking.duration,
          price: booking.price,
          paidAt: new Date().toISOString(),
          paymentMethod: method || "online",
          paymentId,
        },
      });
    }
  };

  /**
   * Mock UPI flow used by the EV charging wedge — Razorpay is not wired to the
   * mock reservation store, so we simulate a successful auth-capture, mark the
   * reservation confirmed in the ev store, and route to the QR screen.
   */
  const handleMockEvUpiPayment = async () => {
    if (!isEv || !booking.evReservationId) return;
    setPaying(true);
    setPaymentFailed(false);
    try {
      const paymentId = `upi_mock_${Date.now().toString(36)}`;
      await confirmEvReservation.mutateAsync({
        id: booking.evReservationId,
        paymentId,
      });
      setPaid(true);
      setTimeout(() => navigateAfterPayment(paymentId, "upi"), 1200);
    } catch {
      setPaymentFailed(true);
      setPaying(false);
    }
  };

  // Listen for deep link callback from Razorpay (APK only)
  useEffect(() => {
    if (!isNative) return;
    const handler = CapacitorApp.addListener("appUrlOpen", async (data) => {
      const url = new URL(data.url);
      const status = url.searchParams.get("status");
      const paymentId = url.searchParams.get("payment_id");
      const orderId = url.searchParams.get("order_id");
      const signature = url.searchParams.get("signature");

      await Browser.close().catch(() => {});

      if (status === "success" && paymentId && orderId && signature) {
        setPaying(true);
        try {
          await verifyPayment.mutateAsync({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            booking_id: isPass ? null : (booking.bookingId ?? null),
          });
          if (isPass && booking.passData) {
            await purchasePass.mutateAsync({
              facility_id: booking.passData.facility_id,
              vehicle_id: booking.passData.vehicle_id,
              duration_months: booking.passData.duration_months,
              payment_id: paymentId,
            });
          }
          setPaid(true);
          setTimeout(() => navigateAfterPayment(paymentId, "online"), 1500);
        } catch {
          setPaymentFailed(true);
        } finally {
          setPaying(false);
        }
      } else {
        setPaymentFailed(true);
        setPaying(false);
      }
    });
    return () => {
      handler.then((h) => h.remove());
    };
  }, [isNative, booking.bookingId, isPass]);

  const handleOnlinePayment = async () => {
    setPaying(true);
    setPaymentFailed(false);
    try {
      const order = await createOrder.mutateAsync({
        amount: booking.price * 100,
        booking_id: booking.bookingId ?? null,
      });

      // Use Razorpay JS SDK for both web and APK (opens inline checkout)
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay");

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
          amount: order.amount,
          currency: order.currency,
          order_id: order.razorpay_order_id,
          name: "Smart Park",
          description: `Parking: ${booking.parking} · Slot ${booking.slot}`,
          theme: { color: "#FFC700" },
          webview_intent: true,
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
          },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              await verifyPayment.mutateAsync({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: isPass ? null : (booking.bookingId ?? null),
              });
              if (isPass && booking.passData) {
                await purchasePass.mutateAsync({
                  facility_id: booking.passData.facility_id,
                  vehicle_id: booking.passData.vehicle_id,
                  duration_months: booking.passData.duration_months,
                  payment_id: response.razorpay_payment_id,
                });
              }
              setPaymentDetails(response);
              setPaid(true);
              setTimeout(
                () =>
                  navigateAfterPayment(response.razorpay_payment_id, "online"),
                1500,
              );
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.on("payment.failed", (r: any) => reject(r.error));
        rzp.open();
      });
    } catch {
      setPaymentFailed(true);
      setPaying(false);
    }
  };

  const handleCashBooking = async () => {
    setPaying(true);
    try {
      if (isPass && booking.passData) {
        await purchasePass.mutateAsync({
          facility_id: booking.passData.facility_id,
          vehicle_id: booking.passData.vehicle_id,
          duration_months: booking.passData.duration_months,
          payment_id: "cash",
        });
      } else if (booking.bookingId) {
        await confirmCash.mutateAsync({
          booking_id: booking.bookingId,
          amount: booking.price,
        });
      }
      setPaid(true);
      setTimeout(() => navigateAfterPayment(undefined, "cash"), 1200);
    } catch {
      setPaymentFailed(true);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Payment
        </h1>
      </header>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-card border border-border rounded-2xl text-center"
        >
          <p className="text-caption text-muted-foreground uppercase tracking-wider font-semibold">
            Total Amount
          </p>
          <p className="mt-2 text-[40px] font-extrabold text-foreground leading-none">
            ₹{booking.price}
          </p>
          <p className="mt-2 text-body-sm text-muted-foreground">
            {isEv ? (
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                {booking.parking} · {booking.slot}
              </span>
            ) : (
              <>
                {booking.parking} · Slot {booking.slot}
              </>
            )}
          </p>
        </motion.div>

        {isEv && !paid ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-body-sm text-muted-foreground text-center mb-4">
                Confirm your UPI payment to lock in this charger for the next
                30 minutes.
              </p>
              {paymentFailed && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-body-sm text-destructive">
                    Payment failed. Please try again.
                  </p>
                </div>
              )}
              <MobileButton
                fullWidth
                onClick={handleMockEvUpiPayment}
                loading={paying || confirmEvReservation.isPending}
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Confirming UPI…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Pay ₹{booking.price} via
                    UPI
                  </>
                )}
              </MobileButton>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-caption text-muted-foreground">
                Secured · UPI intent · No card required
              </span>
            </div>
          </motion.div>
        ) : paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 flex flex-col items-center"
          >
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">
              {paymentMethod === "cash"
                ? "Booking Confirmed!"
                : "Payment Successful!"}
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Generating your QR code…
            </p>
            {paymentDetails && (
              <p className="mt-2 text-caption text-muted-foreground">
                ID: {paymentDetails.razorpay_payment_id}
              </p>
            )}
          </motion.div>
        ) : !paymentMethod ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Choose Payment Method
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("online")}
                className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border-2 border-border rounded-2xl active:border-primary transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-bold text-foreground">
                    Pay Online
                  </p>
                  <p className="text-caption text-muted-foreground">
                    UPI, Cards, Wallets
                  </p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod("cash")}
                className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border-2 border-border rounded-2xl active:border-success transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-7 h-7 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-bold text-foreground">Cash</p>
                  <p className="text-caption text-muted-foreground">
                    Pay at parking
                  </p>
                </div>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-caption text-muted-foreground">
                Secured by Razorpay
              </span>
            </div>
          </motion.div>
        ) : paymentMethod === "cash" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-body font-bold text-foreground">
                    Pay Cash at Parking
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Show QR & pay ₹{booking.price} to attendant
                  </p>
                </div>
              </div>
              <p className="text-body-sm text-muted-foreground mb-4">
                Your booking will be confirmed instantly. Pay the amount in cash
                when you arrive.
              </p>
              <div className="flex gap-2">
                <MobileButton
                  variant="outline"
                  onClick={() => setPaymentMethod(null)}
                  className="flex-1"
                >
                  Back
                </MobileButton>
                <MobileButton
                  variant="success"
                  onClick={handleCashBooking}
                  loading={paying}
                  className="flex-1"
                >
                  Confirm Booking
                </MobileButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => {
                setPaymentMethod(null);
                setPaymentFailed(false);
              }}
              className="mt-4 text-body-sm text-primary font-semibold"
            >
              ← Change payment method
            </button>
            {paymentFailed && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-body-sm text-destructive">
                  Payment failed. Please try again.
                </p>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <div className="p-4 bg-card border border-border rounded-2xl">
                <p className="text-body-sm text-muted-foreground text-center mb-4">
                  You'll be redirected to Razorpay to complete payment via UPI,
                  Card, or Wallet
                </p>
                <MobileButton
                  fullWidth
                  onClick={handleOnlinePayment}
                  loading={paying}
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Opening
                      Razorpay…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" /> Pay ₹{booking.price}{" "}
                      via Razorpay
                    </>
                  )}
                </MobileButton>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-caption text-muted-foreground">
                  Secured by Razorpay · UPI · Cards · Wallets
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
