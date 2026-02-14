import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ZoomIn, ZoomOut, Car, Bike, LayoutGrid, List } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type SlotStatus = "available" | "occupied" | "blocked" | "selected";

interface Slot {
  id: string;
  number: string;
  floor: number;
  status: SlotStatus;
  type: string;
  vehicleType: string;
  distance: number;
  price: number;
}

// Generate mock slots
const generateSlots = (): Slot[] => {
  const slots: Slot[] = [];
  const rows = ["A", "B", "C", "D", "E"];
  const statuses: SlotStatus[] = ["available", "occupied", "available", "available", "occupied", "blocked", "available", "available", "occupied", "available"];

  for (let floor = 1; floor <= 2; floor++) {
    rows.forEach((row, ri) => {
      for (let col = 1; col <= 6; col++) {
        const idx = (ri * 6 + col) % statuses.length;
        slots.push({
          id: `${floor}-${row}${col}`,
          number: `${row}${col}`,
          floor,
          status: statuses[idx],
          type: Math.random() > 0.8 ? "covered" : "regular",
          vehicleType: Math.random() > 0.6 ? "two_wheeler" : "four_wheeler",
          distance: Math.round(10 + Math.random() * 90),
          price: 40,
        });
      }
    });
  }
  return slots;
};

const SLOTS = generateSlots();

const statusStyles: Record<SlotStatus, string> = {
  available: "border-success bg-success/10 text-success",
  occupied: "border-destructive/30 bg-destructive/5 text-destructive/50 opacity-50",
  blocked: "border-muted-foreground/30 bg-muted text-muted-foreground/40 opacity-50",
  selected: "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 scale-105",
};

const SlotSelectionScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotDetail, setSlotDetail] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const slot = SLOTS.find((s) => s.id === selectedSlot);
  const detailSlot = SLOTS.find((s) => s.id === slotDetail);

  const handleSlotTap = (s: Slot) => {
    if (s.status === "occupied" || s.status === "blocked") return;
    setSelectedSlot(s.id === selectedSlot ? null : s.id);
  };

  const floors = [...new Set(SLOTS.map((s) => s.floor))].sort();

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border z-10">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Select Slot</h1>
        <div className="w-[44px]" />
      </header>

      {/* Vehicle banner */}
      <div className="px-4 py-3 bg-card border-b border-border flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Car className="w-4 h-4 text-primary" />
          <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Booking For</span>
          <span className="text-body-sm font-bold text-foreground ml-1">TN 01 AB 1234</span>
        </div>
        <button className="text-caption text-primary font-semibold">Change</button>
      </div>

      {/* View toggle */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="inline-flex bg-secondary rounded-xl p-1">
          {[
            { key: "grid" as const, icon: LayoutGrid, label: "Grid" },
            { key: "list" as const, icon: List, label: "List" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-caption font-semibold transition-all ${
                view === key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Slot content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {view === "grid" ? (
          <div className="px-4 pb-4">
            {floors.map((floor) => (
              <div key={floor} className="mb-6">
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider text-center mb-4">
                  Floor {floor} — Parking Layout
                </p>

                {/* Entry indicator */}
                <div className="flex justify-center mb-3">
                  <div className="px-4 py-1.5 rounded-lg bg-success/10 text-caption font-semibold text-success">
                    ↓ Entry Gate
                  </div>
                </div>

                <div
                  className="grid grid-cols-6 gap-2 transition-transform origin-center"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {SLOTS.filter((s) => s.floor === floor).map((s) => {
                    const isSelected = s.id === selectedSlot;
                    const st = isSelected ? "selected" : s.status;
                    return (
                      <motion.button
                        key={s.id}
                        whileTap={s.status === "available" ? { scale: 1.1 } : undefined}
                        onClick={() => handleSlotTap(s)}
                        onDoubleClick={() => { if (s.status === "available") setSlotDetail(s.id); }}
                        disabled={s.status === "occupied" || s.status === "blocked"}
                        className={`aspect-square rounded-lg border-2 flex items-center justify-center text-caption font-bold transition-all ${statusStyles[st]}`}
                      >
                        {s.number}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Exit indicator */}
                <div className="flex justify-center mt-3">
                  <div className="px-4 py-1.5 rounded-lg bg-primary/10 text-caption font-semibold text-primary">
                    ↑ Exit Gate
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
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
                    <span className="text-caption text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {floors.map((floor) => (
              <div key={floor}>
                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2 z-5">
                  Floor {floor}
                </p>
                {SLOTS.filter((s) => s.floor === floor).map((s) => {
                  const isSelected = s.id === selectedSlot;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSlotTap(s)}
                      disabled={s.status === "occupied" || s.status === "blocked"}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 mb-2 transition-all ${
                        isSelected ? "border-primary bg-primary/5" :
                        s.status === "available" ? "border-border bg-card" :
                        "border-border/50 bg-muted/50 opacity-50"
                      }`}
                    >
                      <span className={`text-heading-sm w-12 ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {s.number}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-caption text-muted-foreground">
                          {s.type === "covered" ? "Covered" : "Regular"} • {s.distance}m from entry
                        </p>
                      </div>
                      {s.status === "available" && !isSelected && (
                        <span className="text-caption font-semibold text-success">Available</span>
                      )}
                      {s.status === "occupied" && (
                        <span className="text-caption font-semibold text-destructive">Occupied</span>
                      )}
                      {isSelected && (
                        <span className="text-caption font-semibold text-primary">Selected ✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls (grid only) */}
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

      {/* Selected slot footer */}
      <AnimatePresence>
        {slot && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="border-t border-border bg-card px-4 py-4 pb-safe"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-body font-bold text-foreground">Slot {slot.number} Selected</p>
                <p className="text-caption text-muted-foreground">
                  {slot.type === "covered" ? "Covered" : "Regular"} • {slot.distance}m from entry
                </p>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="text-caption text-primary font-semibold">
                Change
              </button>
            </div>
            <MobileButton
              fullWidth
              onClick={() => navigate("/booking-summary", {
                state: { parkingId: id, slotId: slot.id, slotNumber: slot.number, slotType: slot.type, price: slot.price }
              })}
            >
              Proceed to Book
            </MobileButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot detail sheet */}
      <BottomSheet open={!!slotDetail} onClose={() => setSlotDetail(null)} snapPoints={[0.4]}>
        {detailSlot && (
          <div className="flex flex-col items-center">
            <p className="text-heading-lg text-primary">{detailSlot.number}</p>
            <div className="mt-4 space-y-2 w-full">
              {[
                "✓ " + (detailSlot.type === "covered" ? "Covered parking" : "Open parking"),
                `📏 ${detailSlot.distance}m from entry gate`,
                "📹 CCTV coverage",
                "✓ Suitable for your vehicle",
              ].map((text, i) => (
                <p key={i} className="text-body-sm text-foreground">{text}</p>
              ))}
            </div>
            <div className="mt-4 w-full p-4 bg-secondary rounded-xl">
              <p className="text-heading-sm text-primary text-center">₹{detailSlot.price} per hour</p>
            </div>
            <MobileButton fullWidth className="mt-4" onClick={() => { setSelectedSlot(detailSlot.id); setSlotDetail(null); }}>
              Select This Slot
            </MobileButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default SlotSelectionScreen;
