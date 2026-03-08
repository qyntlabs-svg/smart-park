import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, CheckCircle2, Banknote, Wallet } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";

const UPI_APPS = [
  { name: "Google Pay", color: "bg-primary" },
  { name: "PhonePe", color: "bg-[hsl(270,70%,55%)]" },
  { name: "Paytm", color: "bg-[hsl(200,90%,50%)]" },
];

const UpiPaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state || { slot: "A-12", price: 40, duration: "2 hrs", parking: "Phoenix Mall Parking" };

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(null);
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      const bookingId = `BK${Date.now().toString(36).toUpperCase()}`;
      setTimeout(() => {
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
            paymentMethod: paymentMethod,
          },
        });
      }, 1200);
    }, 2000);
  };

  const handleCashPay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      const bookingId = `BK${Date.now().toString(36).toUpperCase()}`;
      setTimeout(() => {
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
            paymentMethod: "cash",
          },
        });
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Payment</h1>
      </header>

      <div className="flex-1 px-6 pt-6">
        {/* Amount card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-card border border-border rounded-2xl text-center">
          <p className="text-caption text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
          <p className="mt-2 text-[40px] font-extrabold text-foreground leading-none">₹{booking.price}</p>
          <p className="mt-2 text-body-sm text-muted-foreground">{booking.parking} · Slot {booking.slot}</p>
        </motion.div>

        {paid ? (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-12 flex flex-col items-center">
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">Payment Successful!</p>
            <p className="mt-1 text-body-sm text-muted-foreground">Generating your QR code…</p>
          </motion.div>
        ) : !paymentMethod ? (
          /* Payment method selection */
          <div className="mt-6">
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose Payment Method</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod("upi")}
                className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border-2 border-border rounded-2xl hover:border-primary transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-body-sm font-bold text-foreground">UPI</p>
                  <p className="text-caption text-muted-foreground">Pay digitally</p>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod("cash")}
                className="flex-1 flex flex-col items-center gap-3 p-5 bg-card border-2 border-border rounded-2xl hover:border-success transition-all"
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
          </div>
        ) : paymentMethod === "cash" ? (
          /* Cash payment */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-body font-bold text-foreground">Pay Cash at Parking</p>
                  <p className="text-caption text-muted-foreground">Show QR to vendor & pay ₹{booking.price}</p>
                </div>
              </div>
              <p className="text-body-sm text-muted-foreground mb-4">
                Your booking will be confirmed. Please pay the amount in cash to the parking attendant when you arrive.
              </p>
              <div className="flex gap-2">
                <MobileButton variant="outline" onClick={() => setPaymentMethod(null)} className="flex-1">
                  Back
                </MobileButton>
                <MobileButton variant="success" onClick={handleCashPay} loading={paying} className="flex-1">
                  Confirm Booking
                </MobileButton>
              </div>
            </div>
          </motion.div>
        ) : (
          /* UPI payment */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button onClick={() => setPaymentMethod(null)} className="mt-4 text-body-sm text-primary font-semibold">
              ← Change payment method
            </button>

            {/* UPI Apps */}
            <div className="mt-4">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pay Using UPI App</p>
              <div className="flex gap-3">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.name}
                    onClick={handlePay}
                    disabled={paying}
                    className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl"
                  >
                    <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center`}>
                      <Smartphone className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-caption font-semibold text-foreground">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID */}
            <div className="mt-6">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Or Enter UPI ID</p>
              <div className="flex gap-2">
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="flex-1 h-14 rounded-xl" />
                <MobileButton size="sm" onClick={handlePay} disabled={paying || upiId.length < 5} loading={paying}>
                  Pay
                </MobileButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
