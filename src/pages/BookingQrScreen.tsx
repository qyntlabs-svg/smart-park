import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Share2, CheckCircle2, WifiOff } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";

const BOOKINGS_STORAGE_KEY = "parkit_saved_bookings";

type SavedBooking = {
  bookingId: string;
  slot: string;
  parking: string;
  vehicle: string;
  duration: string;
  price: number;
  paidAt: string;
  paymentMethod?: string;
  qrData: string;
};

/** Save booking + QR data to localStorage for offline access */
const saveBookingLocally = (booking: SavedBooking) => {
  try {
    const existing: SavedBooking[] = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || "[]");
    const alreadySaved = existing.some((b) => b.bookingId === booking.bookingId);
    if (!alreadySaved) {
      existing.unshift(booking);
      // Keep last 20 bookings
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
    }
  } catch {
    // Silently fail
  }
};

const BookingQrScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef<HTMLDivElement>(null);

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

  // Auto-save booking locally on mount
  useEffect(() => {
    saveBookingLocally({
      bookingId: booking.bookingId,
      slot: booking.slot,
      parking: booking.parking,
      vehicle: booking.vehicle,
      duration: booking.duration,
      price: booking.price,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentMethod,
      qrData,
    });
  }, [booking.bookingId]);

  const handleDownload = useCallback(() => {
    try {
      const svgEl = qrRef.current?.querySelector("svg");
      if (!svgEl) return;

      const canvas = document.createElement("canvas");
      const size = 600;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const link = document.createElement("a");
        link.download = `ParkIt-${booking.bookingId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("QR saved to device!");
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      toast.error("Could not download QR");
    }
  }, [booking.bookingId]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Parking Booking ${booking.bookingId}`,
          text: `Booking: ${booking.bookingId}\nParking: ${booking.parking}\nSlot: ${booking.slot}\nVehicle: ${booking.vehicle}`,
        });
      } else {
        await navigator.clipboard.writeText(
          `Booking: ${booking.bookingId}\nParking: ${booking.parking}\nSlot: ${booking.slot}\nVehicle: ${booking.vehicle}`
        );
        toast.success("Booking details copied!");
      }
    } catch {
      // User cancelled share
    }
  }, [booking]);

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

        {/* Offline badge */}
        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-full">
          <WifiOff className="w-3.5 h-3.5 text-success" />
          <span className="text-caption font-semibold text-success">Saved offline</span>
        </div>

        {/* QR Code */}
        <motion.div
          ref={qrRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-6 bg-card border border-border rounded-3xl shadow-sm"
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
            ["Amount", `₹${booking.price}`],
            ...(booking.paymentMethod ? [["Payment", booking.paymentMethod === "cash" ? "Cash (at parking)" : "UPI"]] : [["Amount Paid", `₹${booking.price}`]]),
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-body-sm text-muted-foreground">{label}</span>
              <span className="text-body-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 w-full">
          <MobileButton variant="outline" fullWidth size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Save QR
          </MobileButton>
          <MobileButton variant="outline" fullWidth size="sm" onClick={handleShare}>
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
