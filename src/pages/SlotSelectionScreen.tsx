import { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  List,
  Loader2,
  CalendarIcon,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isBefore } from "date-fns";
import { useParkingSlots, useParkingDetail } from "@/api/parking";
import { useVehicles } from "@/api/vehicles";

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
  }
}

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const nextHalfHour = () => {
  const now = new Date();
  const m = now.getMinutes() < 30 ? 30 : 0;
  const h = now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
  return `${(h % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

type SlotStatus = "available" | "occupied" | "blocked" | "selected";

const statusStyles: Record<SlotStatus, string> = {
  available: "border-success bg-success/10 text-success",
  occupied:
    "border-destructive/30 bg-destructive/5 text-destructive/50 opacity-50",
  blocked:
    "border-muted-foreground/30 bg-muted text-muted-foreground/40 opacity-50",
  selected:
    "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 scale-105",
};

const TimeSelector = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const idx = TIME_OPTIONS.indexOf(value);
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() =>
          onChange(
            TIME_OPTIONS[(idx - 1 + TIME_OPTIONS.length) % TIME_OPTIONS.length],
          )
        }
        className="touch-target flex items-center justify-center"
      >
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      </button>
      <div className="bg-secondary rounded-xl px-4 py-2 min-w-[100px] text-center">
        <span className="text-body font-bold text-foreground">
          {fmt12(value)}
        </span>
      </div>
      <button
        onClick={() => onChange(TIME_OPTIONS[(idx + 1) % TIME_OPTIONS.length])}
        className="touch-target flex items-center justify-center"
      >
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
};

const SlotSelectionScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const routeState = location.state as any;

  const [step, setStep] = useState<"time" | "slots">("time");
  const now = new Date();
  const [startDate, setStartDate] = useState<Date>(now);
  const [endDate, setEndDate] = useState<Date>(() => {
    // If start + 2hrs crosses midnight, end date is tomorrow
    const [h] = nextHalfHour().split(":").map(Number);
    if (h + 2 >= 24) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return now;
  });
  const [startTime, setStartTime] = useState(nextHalfHour);
  const [endTime, setEndTime] = useState(() => {
    const [h, m] = nextHalfHour().split(":").map(Number);
    return `${((h + 2) % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slotDetail, setSlotDetail] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const { data: facility } = useParkingDetail(id!);
  const { data: vehicles } = useVehicles();
  const defaultVehicle = vehicles?.find((v) => v.is_default) ?? vehicles?.[0];

  // Use vehicle passed from HomeScreen if available, otherwise fall back to default
  const activeVehicle = routeState?.vehicleId
    ? {
        id: routeState.vehicleId,
        registration_number: routeState.vehicleRegistration,
        vehicle_type: routeState.vehicleType,
      }
    : defaultVehicle;

  const startDt = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    const d = new Date(startDate);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [startDate, startTime]);

  const endDt = useMemo(() => {
    const [h, m] = endTime.split(":").map(Number);
    const d = new Date(endDate);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [endDate, endTime]);

  const durationText = useMemo(() => {
    const mins = Math.round(
      (new Date(endDt).getTime() - new Date(startDt).getTime()) / 60000,
    );
    if (mins <= 0) return "Invalid";
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return [hrs > 0 && `${hrs}h`, rem > 0 && `${rem}m`]
      .filter(Boolean)
      .join(" ");
  }, [startDt, endDt]);

  const isValidTime = new Date(endDt) > new Date(startDt);

  const { data: slotsData, isLoading } = useParkingSlots(id!, {
    vehicle_type: activeVehicle?.vehicle_type ?? undefined,
    start_time: step === "slots" ? startDt : undefined,
    end_time: step === "slots" ? endDt : undefined,
  });

  const slots = (slotsData ?? []).map((s) => ({
    id: s.id,
    number: s.slot_number,
    floor: s.floor,
    status: s.status as SlotStatus,
    type: s.slot_type,
    vehicleType: s.vehicle_type,
    price: s.price,
  }));

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const detailSlot = slots.find((s) => s.id === slotDetail);
  const floors = [...new Set(slots.map((s) => s.floor))].sort();
  const availableCount = slots.filter((s) => s.status === "available").length;

  const handleSlotTap = (s: (typeof slots)[0]) => {
    if (s.status === "occupied" || s.status === "blocked") return;
    setSelectedSlotId(s.id === selectedSlotId ? null : s.id);
  };

  if (step === "time") {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center -ml-2"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="flex-1 text-body font-bold text-foreground text-center">
            {facility?.name ?? "Select Time"}
          </h1>
          <div className="w-[44px]" />
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-hide">
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <p className="text-body-sm text-foreground">
              Choose your parking time window — we will show which slots are
              available.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Start Date & Time
            </p>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-xl">
                    <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-body-sm font-semibold text-foreground">
                      {format(startDate, "dd MMM yyyy")}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      if (!d) return;
                      setStartDate(d);
                      if (isBefore(endDate, d)) setEndDate(d);
                    }}
                    disabled={(d) =>
                      isBefore(
                        d,
                        new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate(),
                        ),
                      )
                    }
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <TimeSelector
                value={startTime}
                onChange={(t) => {
                  setStartTime(t);
                  // Auto-advance end time to start + 2hrs, crossing midnight if needed
                  const [h, m] = t.split(":").map(Number);
                  const endH = h + 2;
                  setEndTime(
                    `${(endH % 24).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
                  );
                  if (endH >= 24) {
                    // End date is next day
                    const next = new Date(startDate);
                    next.setDate(next.getDate() + 1);
                    setEndDate(next);
                  } else {
                    setEndDate(new Date(startDate));
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              End Date & Time
            </p>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 flex items-center gap-2 p-3 bg-secondary rounded-xl">
                    <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-body-sm font-semibold text-foreground">
                      {format(endDate, "dd MMM yyyy")}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    disabled={(d) => isBefore(d, startDate)}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <TimeSelector value={endTime} onChange={setEndTime} />
            </div>
            {isValidTime ? (
              <p className="mt-3 text-caption text-primary font-semibold text-center">
                Duration: {durationText}
              </p>
            ) : (
              <p className="mt-3 text-caption text-destructive text-center">
                End time must be after start time
              </p>
            )}
          </div>
          {isValidTime && facility && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-body-sm text-muted-foreground">
                Estimated cost
              </span>
              <span className="text-body font-bold text-primary">
                Rs.
                {Math.ceil(
                  (new Date(endDt).getTime() - new Date(startDt).getTime()) /
                    3_600_000,
                ) * Number(facility.hourly_rate)}
              </span>
            </div>
          )}
        </div>
        <div className="px-4 pb-6 pb-safe">
          <MobileButton
            fullWidth
            disabled={!isValidTime}
            onClick={() => setStep("slots")}
          >
            Show Available Slots
          </MobileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border z-10">
        <button
          onClick={() => {
            setStep("time");
            setSelectedSlotId(null);
          }}
          className="touch-target flex items-center justify-center -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">
          {facility?.name ?? "Select Slot"}
        </h1>
        <div className="w-[44px]" />
      </header>
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-caption font-semibold text-primary">
            {fmt12(startTime)} to {fmt12(endTime)} · {durationText}
          </span>
        </div>
        <button
          onClick={() => {
            setStep("time");
            setSelectedSlotId(null);
          }}
          className="text-caption text-primary font-semibold"
        >
          Change
        </button>
      </div>
      <div className="px-4 py-2.5 bg-card border-b border-border flex items-center justify-between">
        <span className="text-caption text-muted-foreground">
          For:{" "}
          <span className="font-bold text-foreground">
            {activeVehicle?.registration_number ?? "No vehicle"}
          </span>
        </span>
        {!isLoading && (
          <span
            className={`text-caption font-semibold ${availableCount > 0 ? "text-success" : "text-destructive"}`}
          >
            {availableCount} available
          </span>
        )}
      </div>
      <div className="px-4 py-2.5 flex items-center gap-3">
        <div className="inline-flex bg-secondary rounded-xl p-1">
          {[
            { key: "grid" as const, icon: LayoutGrid, label: "Grid" },
            { key: "list" as const, icon: List, label: "List" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-caption font-semibold transition-all ${view === key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-body-sm text-muted-foreground">
              Checking availability...
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="px-4 pb-4">
            {floors.map((floor) => (
              <div key={floor} className="mb-6">
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider text-center mb-4">
                  Floor {floor}
                </p>
                <div className="flex justify-center mb-3">
                  <div className="px-4 py-1.5 rounded-lg bg-success/10 text-caption font-semibold text-success">
                    Entry Gate
                  </div>
                </div>
                <div
                  className="grid grid-cols-5 sm:grid-cols-6 gap-2 transition-transform origin-center"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {slots
                    .filter((s) => s.floor === floor)
                    .map((s) => {
                      const isSelected = s.id === selectedSlotId;
                      const st = isSelected ? "selected" : s.status;
                      return (
                        <motion.button
                          key={s.id}
                          whileTap={
                            s.status === "available"
                              ? { scale: 1.1 }
                              : undefined
                          }
                          onClick={() => handleSlotTap(s)}
                          onDoubleClick={() => {
                            if (s.status === "available") setSlotDetail(s.id);
                          }}
                          disabled={
                            s.status === "occupied" || s.status === "blocked"
                          }
                          className={`aspect-square rounded-lg border-2 flex items-center justify-center text-caption font-bold transition-all ${statusStyles[st]}`}
                        >
                          {s.number}
                        </motion.button>
                      );
                    })}
                </div>
                <div className="flex justify-center mt-3">
                  <div className="px-4 py-1.5 rounded-lg bg-primary/10 text-caption font-semibold text-primary">
                    Exit Gate
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2 p-3 bg-card rounded-xl border border-border">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Available", color: "bg-success" },
                  { label: "Occupied", color: "bg-destructive" },
                  { label: "Selected", color: "bg-primary" },
                  { label: "Blocked", color: "bg-muted-foreground" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${color}`} />
                    <span className="text-caption text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {floors.map((floor) => (
              <div key={floor}>
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2">
                  Floor {floor}
                </p>
                {slots
                  .filter((s) => s.floor === floor)
                  .map((s) => {
                    const isSelected = s.id === selectedSlotId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSlotTap(s)}
                        disabled={
                          s.status === "occupied" || s.status === "blocked"
                        }
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 mb-2 transition-all ${isSelected ? "border-primary bg-primary/5" : s.status === "available" ? "border-border bg-card" : "border-border/50 bg-muted/50 opacity-50"}`}
                      >
                        <span
                          className={`text-heading-sm w-12 ${isSelected ? "text-primary" : "text-foreground"}`}
                        >
                          {s.number}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="text-caption text-muted-foreground">
                            {s.type === "covered" ? "Covered" : "Regular"} · Rs.
                            {s.price}/hr
                          </p>
                        </div>
                        <span
                          className={`text-caption font-semibold ${isSelected ? "text-primary" : s.status === "available" ? "text-success" : s.status === "occupied" ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {isSelected
                            ? "Selected"
                            : s.status === "available"
                              ? "Available"
                              : s.status === "occupied"
                                ? "Occupied"
                                : "Blocked"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        )}
      </div>
      {view === "grid" && (
        <div className="absolute bottom-32 right-6 flex flex-col gap-2 z-10">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 1.5))}
            className="w-11 h-11 rounded-full bg-card shadow-lg border border-border flex items-center justify-center"
          >
            <ZoomIn className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.7))}
            className="w-11 h-11 rounded-full bg-card shadow-lg border border-border flex items-center justify-center"
          >
            <ZoomOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="border-t border-border bg-card px-4 py-4 pb-safe"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-body font-bold text-foreground">
                  Slot {selectedSlot.number}
                </p>
                <p className="text-caption text-muted-foreground">
                  {selectedSlot.type === "covered" ? "Covered" : "Regular"} ·
                  Rs.{selectedSlot.price}/hr · {durationText}
                </p>
              </div>
              <button
                onClick={() => setSelectedSlotId(null)}
                className="text-caption text-primary font-semibold"
              >
                Change
              </button>
            </div>
            <MobileButton
              fullWidth
              onClick={() =>
                navigate("/booking-summary", {
                  state: {
                    parkingId: id,
                    facilityName: facility?.name ?? "Parking",
                    facilityLat: facility?.latitude ?? null,
                    facilityLng: facility?.longitude ?? null,
                    facilityAddress: facility?.address ?? null,
                    slotId: selectedSlot.id,
                    slotNumber: selectedSlot.number,
                    slotType: selectedSlot.type,
                    price: selectedSlot.price,
                    vehicleId: activeVehicle?.id,
                    vehicleRegistration: activeVehicle?.registration_number,
                    vehicleType: activeVehicle?.vehicle_type,
                    startTime: startDt,
                    endTime: endDt,
                  },
                })
              }
            >
              Proceed to Book
            </MobileButton>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomSheet
        open={!!slotDetail}
        onClose={() => setSlotDetail(null)}
        snapPoints={[0.4]}
      >
        {detailSlot && (
          <div className="flex flex-col items-center">
            <p className="text-heading-lg text-primary">{detailSlot.number}</p>
            <div className="mt-4 space-y-2 w-full">
              <p className="text-body-sm text-foreground">
                checkmark{" "}
                {detailSlot.type === "covered"
                  ? "Covered parking"
                  : "Open parking"}
              </p>
              <p className="text-body-sm text-foreground">CCTV coverage</p>
            </div>
            <div className="mt-4 w-full p-4 bg-secondary rounded-xl">
              <p className="text-heading-sm text-primary text-center">
                Rs.{detailSlot.price} per hour
              </p>
            </div>
            <MobileButton
              fullWidth
              className="mt-4"
              onClick={() => {
                setSelectedSlotId(detailSlot.id);
                setSlotDetail(null);
              }}
            >
              Select This Slot
            </MobileButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default SlotSelectionScreen;
