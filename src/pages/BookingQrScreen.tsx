import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  WifiOff,
  Navigation,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Browser } from "@capacitor/browser";
import { generateQrPayload } from "@/lib/qr-payload";

const BOOKINGS_STORAGE_KEY = "parkit_saved_bookings";

type SavedBooking = {
  bookingId: string;
  qrToken: string;
  slot: string;
  parking: string;
  vehicle: string;
  duration: string;
  price: number;
  paidAt: string;
  paymentMethod?: string;
  qrData: string;
};

const saveBookingLocally = (booking: SavedBooking) => {
  try {
    const existing: SavedBooking[] = JSON.parse(
      localStorage.getItem(BOOKINGS_STORAGE_KEY) || "[]",
    );
    if (!existing.some((b) => b.bookingId === booking.bookingId)) {
      existing.unshift(booking);
      localStorage.setItem(
        BOOKINGS_STORAGE_KEY,
        JSON.stringify(existing.slice(0, 20)),
      );
    }
  } catch {
    // silently fail
  }
};

const BookingQrScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef<HTMLDivElement>(null);

  const booking = location.state || {
    bookingId: "BKDEMO123",
    qrToken: "demo_token_abc123def456",
    slot: "A-12",
    parking: "Phoenix Mall Parking",
    vehicle: "TN 01 AB 1234",
    duration: "2 hrs",
    price: 40,
    paidAt: new Date().toISOString(),
    facilityLat: null,
    facilityLng: null,
    facilityAddress: null,
  };

  const qrData = generateQrPayload(booking.bookingId, booking.qrToken);

  useEffect(() => {
    saveBookingLocally({
      bookingId: booking.bookingId,
      qrToken: booking.qrToken,
      slot: booking.slot,
      parking: booking.parking,
      vehicle: booking.vehicle,
      duration: booking.duration,
      price: booking.price,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentMethod,
      qrData,
    });
  }, [booking.bookingId, booking.qrToken, qrData]);

  // ── Navigate to parking ──────────────────────────────────────────────────
  const hasLocation =
    (booking.facilityLat != null && booking.facilityLng != null) ||
    !!booking.facilityAddress;

  const openNavigation = useCallback(async () => {
    const lat = booking.facilityLat;
    const lng = booking.facilityLng;
    const address = booking.facilityAddress;

    let url: string;
    if (lat != null && lng != null) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    } else {
      toast.error("Location not available for this booking");
      return;
    }

    try {
      await Browser.open({ url });
    } catch {
      window.open(url, "_blank");
    }
  }, [booking.facilityLat, booking.facilityLng, booking.facilityAddress]);

  // ── Download QR ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
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
      const base64Svg = btoa(unescape(encodeURIComponent(svgData)));

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.split(",")[1];
          try {
            await Filesystem.writeFile({
              path: `SmartPark-${booking.bookingId}.png`,
              data: base64Data,
              directory: Directory.Documents,
            });
            toast.success("QR saved to Documents folder!");
            resolve();
          } catch {
            const link = document.createElement("a");
            link.download = `SmartPark-${booking.bookingId}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("QR saved!");
            resolve();
          }
        };
        img.onerror = reject;
        img.src = `data:image/svg+xml;base64,${base64Svg}`;
      });
    } catch {
      toast.error("Could not save QR");
    }
  }, [booking.bookingId]);

  // ── Share QR ─────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
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
      const base64Svg = btoa(unescape(encodeURIComponent(svgData)));

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const base64Data = canvas.toDataURL("image/png").split(",")[1];
          const fileName = `SmartPark-QR-${booking.bookingId}.png`;
          try {
            const saved = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
            });
            await Share.share({
              title: `Smart Park Booking - ${booking.bookingId}`,
              text: `📍 ${booking.parking}\n🚗 Slot: ${booking.slot}\n🚘 Vehicle: ${booking.vehicle}\n💰 Amount: ₹${booking.price}\n🎫 Booking ID: ${booking.bookingId}`,
              url: saved.uri,
              dialogTitle: "Share Booking QR",
            });
            resolve();
          } catch {
            try {
              await Share.share({
                title: `Smart Park Booking - ${booking.bookingId}`,
                text: `📍 ${booking.parking}\n🚗 Slot: ${booking.slot}\n🚘 Vehicle: ${booking.vehicle}\n💰 Amount: ₹${booking.price}\n🎫 Booking ID: ${booking.bookingId}`,
                dialogTitle: "Share Booking",
              });
            } catch {
              /* user cancelled */
            }
            resolve();
          }
        };
        img.onerror = reject;
        img.src = `data:image/svg+xml;base64,${base64Svg}`;
      });
    } catch {
      toast.error("Could not share booking");
    }
  }, [booking]);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate("/home")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Booking Confirmed
        </h1>
      </header>

      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col items-center overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>

        <p className="text-heading-sm text-foreground">Booking Confirmed!</p>
        <p className="text-body-sm text-muted-foreground mt-1">
          Show this QR code at the parking entry
        </p>

        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-full">
          <WifiOff className="w-3.5 h-3.5 text-success" />
          <span className="text-caption font-semibold text-success">
            Saved offline
          </span>
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
            [
              "Payment",
              booking.paymentMethod === "cash" ? "Cash (at parking)" : "UPI",
            ],
            ["Amount", `₹${booking.price}`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-body-sm text-muted-foreground">
                {label}
              </span>
              <span className="text-body-sm font-semibold text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Save / Share */}
        <div className="mt-6 flex gap-3 w-full">
          <MobileButton
            variant="outline"
            fullWidth
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" /> Save QR
          </MobileButton>
          <MobileButton
            variant="outline"
            fullWidth
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" /> Share
          </MobileButton>
        </div>

        {/* Navigate to parking */}
        <div className="mt-3 w-full">
          <MobileButton
            fullWidth
            disabled={!hasLocation}
            onClick={openNavigation}
          >
            <Navigation className="w-4 h-4" />
            Navigate to Parking
          </MobileButton>
          <p className="mt-1.5 text-center text-caption text-muted-foreground">
            Opens in Google Maps
          </p>
        </div>

        {/* Go home */}
        <div className="mt-4 w-full pb-safe">
          <MobileButton
            fullWidth
            variant="outline"
            onClick={() => navigate("/home", { replace: true })}
          >
            Go to Home
          </MobileButton>
        </div>
      </div>
    </div>
  );
};

export default BookingQrScreen;
