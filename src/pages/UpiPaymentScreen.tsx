import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, CheckCircle2, Banknote, Wallet, Shield, CreditCard, XCircle } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { mockRazorpayPayment, calculateCommission, type RazorpaySuccessResponse } from "@/lib/razorpay";

const UPI_APPS = [
  { name: "Google Pay", color: "bg-primary" },
  { name: "PhonePe", color: "bg-[hsl(270,70%,55%)]" },
  { name: "Paytm", color: "bg-[hsl(200,90%,50%)]" },
];

const UpiPaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state || { slot: "A-12", price: 40, duration: "2 hrs", parking: "Phoenix Mall Parking" };

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash" | null>(null);
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<RazorpaySuccessResponse | null>(null);

  const commission = calculateCommission(booking.price);

  const navigateToQr = (paymentId?: string, method?: string) => {
    const bookingId = `BK${Date.now().toString(36).toUpperCase()}`;
    navigate("/booking-qr", {
      replace: true,
      state: {
        bookingId,
        slot: booking.slot,
        parking: booking.parking,
        vehicle: "TN 01 AB 1234",
        duration: booking.duration,
        price: booking.price,
        paidAt: new Date().toISOString(),
        paymentMethod: method || "online",
        paymentId,
      },
    });
  };

  const handleOnlinePayment = async () => {
    setPaying(true);
    setPaymentFailed(false);
    try {
      // Using mock for now — will use real Razorpay once Cloud + key are configured
      const response = await mockRazorpayPayment({
        amount: booking.price * 100, // paise
        bookingId: `BK${Date.now().toString(36).toUpperCase()}`,
        description: `Parking: ${booking.parking} · Slot ${booking.slot}`,
        onSuccess: () => {},
        onFailure: () => {},
      });
      setPaymentDetails(response);
      setPaid(true);
      setTimeout(() => navigateToQr(response.razorpay_payment_id, "online"), 1500);
    } catch {
      setPaymentFailed(true);
    } finally {
      setPaying(false);
    }
  };

  const handleCashBooking = () => {
    setPaying(true);
    setTimeout(() => {
      setPaid(true);
      setTimeout(() => navigateToQr(undefined, "cash"), 1200);
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Payment</h1>
      </header>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Amount card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-card border border-border rounded-2xl text-center">
          <p className="text-caption text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
          <p className="mt-2 text-[40px] font-extrabold text-foreground leading-none">₹{booking.price}</p>
          <p className="mt-2 text-body-sm text-muted-foreground">{booking.parking} · Slot {booking.slot}</p>
        </motion.div>

        {/* Payment success */}
        {paid ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 flex flex-col items-center">
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">
              {paymentMethod === "cash" ? "Booking Confirmed!" : "Payment Successful!"}
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">Generating your QR code…</p>
            {paymentDetails && (
              <p className="mt-2 text-caption text-muted-foreground">ID: {paymentDetails.razorpay_payment_id}</p>
            )}
          </motion.div>
        ) : !paymentMethod ? (
          /* Method selection */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose Payment Method</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("online")}
                className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border-2 border-border rounded-2xl active:border-primary transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-bold text-foreground">Pay Online</p>
                  <p className="text-caption text-muted-foreground">UPI, Cards, Wallets</p>
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
                  <p className="text-caption text-muted-foreground">Pay at parking</p>
                </div>
              </button>
            </div>

            {/* Secure badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-caption text-muted-foreground">Secured by Razorpay</span>
            </div>
          </motion.div>
        ) : paymentMethod === "cash" ? (
          /* Cash flow */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-body font-bold text-foreground">Pay Cash at Parking</p>
                  <p className="text-caption text-muted-foreground">Show QR & pay ₹{booking.price} to attendant</p>
                </div>
              </div>
              <p className="text-body-sm text-muted-foreground mb-4">
                Your booking will be confirmed instantly. Pay the amount in cash when you arrive at the parking.
              </p>
              <div className="flex gap-2">
                <MobileButton variant="outline" onClick={() => setPaymentMethod(null)} className="flex-1">Back</MobileButton>
                <MobileButton variant="success" onClick={handleCashBooking} loading={paying} className="flex-1">
                  Confirm Booking
                </MobileButton>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Online payment flow */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => { setPaymentMethod(null); setPaymentFailed(false); }} className="mt-4 text-body-sm text-primary font-semibold">
              ← Change payment method
            </button>

            {/* Payment failed banner */}
            {paymentFailed && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-body-sm text-destructive">Payment failed. Please try again.</p>
              </div>
            )}

            {/* UPI Apps */}
            <div className="mt-4">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pay Using UPI App</p>
              <div className="flex gap-3">
                {UPI_APPS.map((app) => (
                  <button key={app.name} onClick={handleOnlinePayment} disabled={paying}
                    className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center`}>
                      <Smartphone className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-caption font-semibold text-foreground">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID input */}
            <div className="mt-6">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Or Enter UPI ID</p>
              <div className="flex gap-2">
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="flex-1 h-14 rounded-xl" />
                <MobileButton size="sm" onClick={handleOnlinePayment} disabled={paying || upiId.length < 5} loading={paying}>Pay</MobileButton>
              </div>
            </div>

            {/* Razorpay Checkout button */}
            <div className="mt-6">
              <MobileButton fullWidth onClick={handleOnlinePayment} loading={paying}>
                <CreditCard className="w-5 h-5" />
                {paying ? "Processing…" : `Pay ₹${booking.price} via Razorpay`}
              </MobileButton>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-caption text-muted-foreground">Secured by Razorpay</span>
              </div>
            </div>

            {/* Commission info (transparent to user) */}
            <div className="mt-6 p-3 bg-muted/50 rounded-xl">
              <p className="text-caption text-muted-foreground text-center">
                ₹{booking.price} includes parking fee. Platform fee included.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
