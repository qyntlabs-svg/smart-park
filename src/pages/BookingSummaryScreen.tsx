import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Car, Clock, Minus, Plus, Pencil } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const BookingSummaryScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const slotNumber = state?.slotNumber || "A3";
  const slotType = state?.slotType || "covered";
  const price = state?.price || 40;

  const [duration, setDuration] = useState(2);
  const [loading, setLoading] = useState(false);

  const totalPrice = price * duration;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

  const handleConfirm = () => {
    setLoading(true);
    // TODO: Create booking in Supabase
    setTimeout(() => {
      setLoading(false);
      navigate("/selection-success", {
        replace: true,
        state: { slotNumber, duration, totalPrice },
      });
    }, 800);
  };

  const cards = [
    {
      label: "PARKING LOCATION",
      content: (
        <>
          <p className="text-body font-bold text-foreground">Phoenix Mall Parking</p>
          <p className="mt-1 text-body-sm text-muted-foreground">123, Mount Road, Tambaram, Chennai</p>
        </>
      ),
    },
    {
      label: "SELECTED SLOT",
      content: (
        <>
          <p className="text-heading-md text-primary">{slotNumber}</p>
          <p className="mt-1 text-body-sm text-muted-foreground capitalize">{slotType} • Near Entry</p>
        </>
      ),
    },
    {
      label: "VEHICLE",
      content: (
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-primary" />
          <div>
            <p className="text-body-sm font-bold text-foreground">TN 01 AB 1234</p>
            <p className="text-caption text-muted-foreground">My Car</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Booking Summary</h1>
        <div className="w-[44px]" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </div>
            {card.content}
          </motion.div>
        ))}

        {/* Duration picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Estimated Duration</p>
          <div className="flex items-center justify-center gap-6 py-2">
            <button
              onClick={() => setDuration((d) => Math.max(1, d - 1))}
              disabled={duration <= 1}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30"
            >
              <Minus className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-heading-md text-foreground min-w-[100px] text-center">
              {duration} {duration === 1 ? "Hour" : "Hours"}
            </span>
            <button
              onClick={() => setDuration((d) => Math.min(24, d + 1))}
              disabled={duration >= 24}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center disabled:opacity-30"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Entry time */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Entry Time</p>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-body font-semibold text-foreground">Now ({timeStr})</p>
          </div>
          <p className="mt-1 ml-7 text-body-sm text-muted-foreground">{dateStr}</p>
        </motion.div>

        {/* Price breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5"
        >
          <p className="text-caption font-semibold text-primary uppercase tracking-wider mb-3">Estimated Price</p>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-foreground">₹{price} × {duration} {duration === 1 ? "hour" : "hours"}</span>
            <span className="text-body-sm font-semibold text-foreground">₹{totalPrice}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
            <span className="text-body font-bold text-foreground">Total</span>
            <span className="text-heading-md text-primary">₹{totalPrice}</span>
          </div>
        </motion.div>
      </div>

      {/* Confirm button */}
      <div className="px-4 pb-4 pb-safe bg-background">
        <MobileButton fullWidth loading={loading} onClick={handleConfirm}>
          Confirm Selection
        </MobileButton>
        <p className="mt-2 text-caption text-muted-foreground text-center italic">
          → Ready for Phase 2: Payment
        </p>
      </div>
    </div>
  );
};

export default BookingSummaryScreen;
