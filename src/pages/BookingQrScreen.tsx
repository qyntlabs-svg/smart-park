import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Share2, CheckCircle2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const BookingQrScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state || {
    bookingId: "BKDEMO123",
    slot: "A-12",
    parking: "Phoenix Mall Parking",
    vehicle: "TN 01 AB 1234",
    duration: "2 hrs",
    price: 40,
    paidAt: new Date().toISOString(),
  };

  const qrData = JSON.stringify({
    id: booking.bookingId,
    slot: booking.slot,
    vehicle: booking.vehicle,
    parking: booking.parking,
    duration: booking.duration,
    price: booking.price,
    paidAt: booking.paidAt,
  });

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/home")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Booking Confirmed</h1>
      </header>

      <div className="flex-1 px-6 pt-8 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>

        <p className="text-heading-sm text-foreground">Booking Confirmed!</p>
        <p className="text-body-sm text-muted-foreground mt-1">Show this QR code at the parking entry</p>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 bg-card border border-border rounded-3xl shadow-sm"
        >
          <QRCodeSVG value={qrData} size={200} level="H" includeMargin />
        </motion.div>

        {/* Booking details */}
        <div className="mt-6 w-full space-y-3">
          {[
            ["Booking ID", booking.bookingId],
            ["Parking", booking.parking],
            ["Slot", booking.slot],
            ["Vehicle", booking.vehicle],
            ["Duration", booking.duration],
            ["Amount Paid", `₹${booking.price}`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-body-sm text-muted-foreground">{label}</span>
              <span className="text-body-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 w-full">
          <MobileButton variant="outline" fullWidth size="sm">
            <Download className="w-4 h-4" /> Save
          </MobileButton>
          <MobileButton variant="outline" fullWidth size="sm">
            <Share2 className="w-4 h-4" /> Share
          </MobileButton>
        </div>
      </div>

      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth onClick={() => navigate("/home", { replace: true })}>
          Go to Home
        </MobileButton>
      </div>
    </div>
  );
};

export default BookingQrScreen;
