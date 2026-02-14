import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Car, Clock, Pencil, CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { format, differenceInHours, differenceInMinutes, isBefore, isEqual } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/PageTransition";

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const BookingSummaryScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const slotNumber = state?.slotNumber || "A3";
  const slotType = state?.slotType || "covered";
  const price = state?.price || 40;

  const now = new Date();
  const [date, setDate] = useState<Date>(now);
  const [startTime, setStartTime] = useState(() => {
    const h = now.getHours();
    const m = now.getMinutes() < 30 ? 30 : 0;
    const hAdj = now.getMinutes() >= 30 ? h + 1 : h;
    return `${(hAdj % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const [h, m] = startTime.split(":").map(Number);
    return `${((h + 2) % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);

  const durationText = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let totalMin = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMin <= 0) totalMin += 24 * 60;
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} min`;
  }, [startTime, endTime]);

  const totalPrice = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let totalMin = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMin <= 0) totalMin += 24 * 60;
    return Math.ceil(totalMin / 60) * price;
  }, [startTime, endTime, price]);

  const durationHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let totalMin = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMin <= 0) totalMin += 24 * 60;
    return Math.ceil(totalMin / 60);
  }, [startTime, endTime]);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/selection-success", {
        replace: true,
        state: {
          slotNumber,
          date: format(date, "PPP"),
          startTime: formatTime12(startTime),
          endTime: formatTime12(endTime),
          duration: durationText,
          totalPrice,
        },
      });
    }, 800);
  };

  const TimeSelector = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
    const currentIndex = TIME_OPTIONS.indexOf(value);
    const scrollUp = () => {
      const prev = (currentIndex - 1 + TIME_OPTIONS.length) % TIME_OPTIONS.length;
      onChange(TIME_OPTIONS[prev]);
    };
    const scrollDown = () => {
      const next = (currentIndex + 1) % TIME_OPTIONS.length;
      onChange(TIME_OPTIONS[next]);
    };
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-caption text-muted-foreground font-semibold">{label}</span>
        <div className="flex flex-col items-center">
          <button onClick={scrollUp} className="touch-target flex items-center justify-center">
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="bg-secondary rounded-xl px-4 py-2 min-w-[100px] text-center">
            <span className="text-body font-bold text-foreground">{formatTime12(value)}</span>
          </div>
          <button onClick={scrollDown} className="touch-target flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
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
    <PageTransition>
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

          {/* Date picker */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Parking Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span className="text-body font-semibold text-foreground">{format(date, "EEE, dd MMM yyyy")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => isBefore(d, new Date(now.getFullYear(), now.getMonth(), now.getDate()))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </motion.div>

          {/* Time pickers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">Parking Time</p>
            <div className="flex items-center justify-center gap-6">
              <TimeSelector label="START" value={startTime} onChange={setStartTime} />
              <div className="flex flex-col items-center gap-1 pt-5">
                <span className="text-muted-foreground font-bold">→</span>
                <span className="text-caption text-primary font-semibold">{durationText}</span>
              </div>
              <TimeSelector label="END" value={endTime} onChange={setEndTime} />
            </div>
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
              <span className="text-body-sm text-foreground">₹{price} × {durationHours} hr{durationHours > 1 ? "s" : ""}</span>
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
    </PageTransition>
  );
};

export default BookingSummaryScreen;
