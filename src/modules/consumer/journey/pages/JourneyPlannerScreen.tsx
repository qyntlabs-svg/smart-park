// Screen: C-45 · Primitives: Location, Availability, Reservation, Pricing
//
// From → To. Auto-inserts charging + parking stops (mock). Shows a timeline of
// legs + costs. "Confirm all" reserves everything in one tap.
//
// Route: /journey

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Zap,
  ParkingCircle,
  Car,
  Clock,
  Route as RouteIcon,
  Sparkles,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  useConfirmJourney,
  useSaveJourney,
} from "@/modules/consumer/journey/hooks";
import { buildJourneyPreview } from "@/modules/consumer/journey/store";
import type { Journey, JourneyLeg } from "@/modules/consumer/journey/types";

const JourneyPlannerScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";

  const [from, setFrom] = useState("Home · T Nagar");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<Journey | null>(null);
  const [busy, setBusy] = useState(false);

  const save = useSaveJourney();
  const confirm = useConfirmJourney();

  const canPlan = to.trim().length >= 3;

  const plan = async () => {
    if (!canPlan) return;
    setBusy(true);
    try {
      const j = buildJourneyPreview(from.trim() || "Current location", to.trim());
      const withUser: Journey = { ...j, userId };
      await save.mutateAsync(withUser);
      setPreview(withUser);
    } finally {
      setBusy(false);
    }
  };

  const confirmAll = async () => {
    if (!preview) return;
    try {
      await confirm.mutateAsync(preview.id);
      toast.success("All stops reserved");
      navigate(`/journey/one-tap`);
    } catch {
      toast.error("Could not reserve journey");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Plan a journey
        </h1>
      </header>

      {/* Inputs */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-3 space-y-2">
        <LocationField
          icon={<MapPin className="w-4 h-4 text-primary" />}
          label="From"
          value={from}
          onChange={setFrom}
          placeholder="Current location"
        />
        <div className="border-t border-border pt-2">
          <LocationField
            icon={<MapPin className="w-4 h-4 text-destructive" />}
            label="To"
            value={to}
            onChange={setTo}
            placeholder="Where are you headed?"
          />
        </div>
      </div>

      <div className="mx-4 mt-3">
        <MobileButton
          fullWidth
          onClick={plan}
          disabled={!canPlan || busy}
          className="gap-1.5"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Plan with AI
        </MobileButton>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-4"
          >
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/25 p-4">
              <p className="text-caption font-bold uppercase tracking-wider text-primary">
                Optimised route
              </p>
              <p className="mt-1 text-body font-bold text-foreground truncate">
                {preview.from} → {preview.to}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-body-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatMinutes(preview.totalMinutes)}
                </div>
                <p className="text-heading-sm text-primary">
                  ₹{preview.totalCost}
                </p>
              </div>
            </div>

            {/* Legs */}
            <div className="mt-4">
              <p className="text-body-sm font-bold text-foreground">
                Timeline
              </p>
              <div className="mt-2 space-y-2">
                {preview.legs.map((leg, i) => (
                  <LegRow key={leg.id} leg={leg} isLast={i === preview.legs.length - 1} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!preview && !busy && (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <RouteIcon className="w-7 h-7 text-primary" />
          </div>
          <p className="mt-3 text-body font-bold text-foreground">
            Multi-hop, one plan
          </p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            We'll auto-insert charging and parking stops so you never scramble
            mid-trip.
          </p>
        </div>
      )}

      {/* Recent journeys link */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate("/journey/one-tap")}
          className="w-full flex items-center justify-between p-3 rounded-2xl border border-border bg-card active:bg-secondary"
        >
          <div className="text-left">
            <p className="text-body-sm font-bold text-foreground">
              Recent journeys
            </p>
            <p className="text-caption text-muted-foreground">
              Rebook with one tap
            </p>
          </div>
          <span className="text-caption font-bold text-primary">Open →</span>
        </button>
      </div>

      {/* Sticky confirm */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          disabled={!preview}
          loading={confirm.isPending}
          onClick={confirmAll}
        >
          {preview ? `Confirm all — ₹${preview.totalCost}` : "Plan first"}
        </MobileButton>
      </div>
    </div>
  );
};

// ---------- Sub-components ----------

const LocationField = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-body-sm text-foreground placeholder-muted-foreground outline-none"
      />
    </div>
    <ChevronDown className="w-4 h-4 text-muted-foreground" />
  </div>
);

const LegRow = ({ leg, isLast }: { leg: JourneyLeg; isLast: boolean }) => {
  const meta =
    leg.kind === "drive"
      ? { icon: Car, tone: "bg-secondary text-foreground", label: "Drive" }
      : leg.kind === "charge"
        ? { icon: Zap, tone: "bg-primary/10 text-primary", label: "Charge" }
        : { icon: ParkingCircle, tone: "bg-emerald-500/10 text-emerald-600", label: "Park" };
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.tone}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-body-sm font-bold text-foreground truncate">
            {leg.title}
          </p>
          <p className="text-body-sm font-bold text-foreground shrink-0">
            {leg.cost > 0 ? `₹${leg.cost}` : "—"}
          </p>
        </div>
        <p className="text-caption text-muted-foreground">
          {leg.subtitle}
          {leg.km ? ` · ${leg.km} km` : ""}
          {leg.kwh ? ` · ${leg.kwh} kWh` : ""}
          {leg.minutes ? ` · ${formatMinutes(leg.minutes)}` : ""}
        </p>
      </div>
    </div>
  );
};

function formatMinutes(m: number) {
  if (!isFinite(m)) return "—";
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h === 0) return `${min}m`;
  return `${h}h ${min}m`;
}

export default JourneyPlannerScreen;
