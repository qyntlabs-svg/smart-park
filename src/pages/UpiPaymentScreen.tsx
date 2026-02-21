import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, CheckCircle2, CreditCard } from "lucide-react";
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

  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      // Generate a mock booking ID
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
          },
        });
      }, 1200);
    }, 2000);
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-card border border-border rounded-2xl text-center"
        >
          <p className="text-caption text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
          <p className="mt-2 text-[40px] font-extrabold text-foreground leading-none">₹{booking.price}</p>
          <p className="mt-2 text-body-sm text-muted-foreground">{booking.parking} · Slot {booking.slot}</p>
        </motion.div>

        {paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 flex flex-col items-center"
          >
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">Payment Successful!</p>
            <p className="mt-1 text-body-sm text-muted-foreground">Generating your QR code…</p>
          </motion.div>
        ) : (
          <>
            {/* UPI Apps */}
            <div className="mt-6">
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
                <Input
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="flex-1 h-14 rounded-xl"
                />
                <MobileButton size="sm" onClick={handlePay} disabled={paying || upiId.length < 5} loading={paying}>
                  Pay
                </MobileButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
