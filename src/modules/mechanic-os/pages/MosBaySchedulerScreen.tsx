// Screen: MOS-07 · Primitives: Availability, Reservation, Identity
// Route: /mechanic-os/scheduler

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, User } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  listBays,
  listBaySlots,
  type BaySlot,
} from "@/modules/mechanic-os/lib/mos-store";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 → 17:00

const MosBaySchedulerScreen = () => {
  const bays = listBays();
  const [offset, setOffset] = useState(0); // day offset from today
  const day = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [offset]);

  const allSlots = useMemo(() => listBaySlots(), []);
  const daySlots = useMemo(
    () =>
      allSlots.filter((s) => {
        const d = new Date(s.startISO);
        return (
          d.getFullYear() === day.getFullYear() &&
          d.getMonth() === day.getMonth() &&
          d.getDate() === day.getDate()
        );
      }),
    [allSlots, day],
  );

  return (
    <MechanicOsLayout
      title="Bay scheduler"
      subtitle="Visual calendar: bays × time × technicians"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-[120px]">
            <p className="text-body-sm font-bold text-foreground">
              {day.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `120px repeat(${HOURS.length}, minmax(80px, 1fr))`,
            }}
          >
            {/* Header row */}
            <div className="p-2 text-caption font-semibold text-muted-foreground border-b border-r border-border bg-secondary/40">
              Bay / hour
            </div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="p-2 text-caption font-semibold text-muted-foreground border-b border-r border-border bg-secondary/40 text-center"
              >
                {h.toString().padStart(2, "0")}:00
              </div>
            ))}

            {/* Rows */}
            {bays.map((bay) => (
              <BayRow key={bay.id} bay={bay} slots={daySlots} day={day} />
            ))}
          </div>
        </div>
      </div>

      {daySlots.length === 0 && (
        <div className="mt-4 p-6 rounded-2xl border border-dashed border-border text-center">
          <CalendarClock className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="text-body-sm text-muted-foreground mt-2">
            No bookings on this day.
          </p>
        </div>
      )}
    </MechanicOsLayout>
  );
};

const BayRow = ({
  bay,
  slots,
  day,
}: {
  bay: { id: string; label: string };
  slots: BaySlot[];
  day: Date;
}) => {
  const rowSlots = slots.filter((s) => s.bayId === bay.id);
  return (
    <>
      <div className="p-2 text-body-sm font-semibold text-foreground border-b border-r border-border bg-secondary/20">
        {bay.label}
      </div>
      {HOURS.map((h) => {
        // Find slots that start at this hour (rounded down)
        const cellStart = new Date(day);
        cellStart.setHours(h, 0, 0, 0);
        const slot = rowSlots.find((s) => {
          const st = new Date(s.startISO);
          return st.getHours() === h;
        });
        return (
          <div
            key={h}
            className="min-h-16 p-1 border-b border-r border-border relative"
          >
            {slot && (
              <div
                className="absolute inset-1 rounded-lg bg-primary/15 border border-primary/40 p-2 overflow-hidden"
                style={{
                  width: `calc(${Math.max(1, slot.durationMin / 60)} * (100% - 4px) + ${
                    Math.max(0, Math.ceil(slot.durationMin / 60) - 1) * 1
                  }px)`,
                }}
                title={`${slot.customerName} · ${slot.service}`}
              >
                <p className="text-caption font-bold text-foreground truncate">
                  {slot.service}
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {slot.customerName} · {slot.vehicleLabel}
                </p>
                {slot.technicianName && (
                  <p className="text-caption text-primary font-semibold truncate flex items-center gap-1">
                    <User className="w-3 h-3" /> {slot.technicianName}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default MosBaySchedulerScreen;
