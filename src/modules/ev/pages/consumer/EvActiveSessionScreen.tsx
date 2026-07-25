// Screen: C-20 · Primitives: Reservation, Availability, Pricing, Notification
//
// The wedge demo screen. Auto-polls mock telemetry via ev/store.tickTelemetry
// every 3 seconds while the session is active. Shows an animated ring
// (SOC or kWh delivered), live tiles for kW / kWh / cost / ETA, and a
// Duolingo-style "you saved ₹X vs petrol" habit anchor.
//
// Route: /ev/session/:id

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Loader2,
  Timer,
  Gauge,
  IndianRupee,
  AlertTriangle,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useEndEvSession,
  useEvSession,
  useEvStation,
  useTickTelemetry,
} from "@/modules/ev/hooks";
import { CONNECTOR_LABEL } from "@/modules/ev/types";

const TICK_INTERVAL_MS = 3_000;
/** Petrol baseline for "you saved" tile — ₹6/km @ ~15 kmpl → ~₹6.5 per kWh equivalent. */
const PETROL_COST_PER_KWH_EQUIVALENT = 12;

const EvActiveSessionScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useEvSession(id);
  const { data: station } = useEvStation(session?.stationId);
  const tick = useTickTelemetry();
  const endSession = useEndEvSession();

  const [confirmStop, setConfirmStop] = useState(false);

  // Poll telemetry while active.
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!id || !session || session.status !== "active") return;
    const iv = window.setInterval(() => {
      tickRef.current.mutate(id);
    }, TICK_INTERVAL_MS);
    // Kick one immediately so numbers move right after mount.
    tickRef.current.mutate(id);
    return () => window.clearInterval(iv);
  }, [id, session?.status]);

  // Once completed, auto-forward to receipt.
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (session.status === "completed" && !navigatedRef.current) {
      navigatedRef.current = true;
      const t = window.setTimeout(
        () => navigate(`/ev/session/${session.id}/receipt`, { replace: true }),
        1500,
      );
      return () => window.clearTimeout(t);
    }
  }, [session?.status, session?.id, navigate]);

  const elapsedMinutes = useMemo(() => {
    if (!session?.startedAt) return 0;
    const end = session.endedAt
      ? new Date(session.endedAt)
      : new Date();
    return Math.max(
      0,
      (end.getTime() - new Date(session.startedAt).getTime()) / 60_000,
    );
  }, [session?.startedAt, session?.endedAt, session?.kwhDelivered]);

  const etaMinutes = useMemo(() => {
    if (!session || !session.currentKw || session.currentKw < 0.1) return null;
    const remaining = Math.max(0, session.targetKwh - session.kwhDelivered);
    return (remaining / session.currentKw) * 60;
  }, [session?.currentKw, session?.targetKwh, session?.kwhDelivered]);

  const progressPct = useMemo(() => {
    if (!session) return 0;
    if (session.targetSocPct != null && session.currentSocPct != null) {
      const start = session.startSocPct ?? 0;
      const gained = session.currentSocPct - start;
      const wanted = session.targetSocPct - start;
      if (wanted <= 0) return 100;
      return Math.max(0, Math.min(100, (gained / wanted) * 100));
    }
    if (session.targetKwh <= 0) return 100;
    return Math.max(
      0,
      Math.min(100, (session.kwhDelivered / session.targetKwh) * 100),
    );
  }, [session?.currentSocPct, session?.startSocPct, session?.targetSocPct, session?.kwhDelivered, session?.targetKwh]);

  const savings = useMemo(() => {
    if (!session) return 0;
    const petrolEquivalent =
      session.kwhDelivered * PETROL_COST_PER_KWH_EQUIVALENT;
    return Math.max(0, Math.round(petrolEquivalent - session.cost));
  }, [session?.kwhDelivered, session?.cost]);

  if (isLoading || !session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const handleStop = async () => {
    try {
      await endSession.mutateAsync(session.id);
      setConfirmStop(false);
      toast.success("Session stopped");
      navigate(`/ev/session/${session.id}/receipt`, { replace: true });
    } catch {
      toast.error("Could not stop session");
    }
  };

  const ringDisplay =
    session.currentSocPct != null
      ? { value: Math.round(session.currentSocPct), unit: "%" }
      : {
          value: Math.round(session.kwhDelivered * 10) / 10,
          unit: "kWh",
        };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      {/* Header */}
      <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate("/home")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Zap className="w-5 h-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground truncate">
            Charging
          </p>
          <p className="text-caption text-muted-foreground truncate">
            {station?.name ?? "EV station"}
          </p>
        </div>
        <StatusPill status={session.status} />
      </header>

      {/* Ring */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-center">
        <ChargingRing
          progressPct={progressPct}
          primaryLabel={`${ringDisplay.value}`}
          primaryUnit={ringDisplay.unit}
          secondaryLabel={
            session.targetSocPct != null
              ? `Target ${session.targetSocPct}%`
              : `Target ${session.targetKwh.toFixed(1)} kWh`
          }
          pulsing={session.status === "active" && !session.powerDip}
        />
      </div>

      {/* Power dip banner */}
      <AnimatePresence>
        {session.powerDip && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mb-3 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-caption text-foreground">
              Grid dip detected — power will resume in a moment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live tiles */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <Tile
          icon={Gauge}
          label="Draw"
          value={session.currentKw.toFixed(1)}
          unit="kW"
          highlight={session.status === "active" && !session.powerDip}
        />
        <Tile
          icon={Zap}
          label="Delivered"
          value={session.kwhDelivered.toFixed(2)}
          unit="kWh"
        />
        <Tile
          icon={IndianRupee}
          label="Cost so far"
          value={`₹${session.cost}`}
          unit=""
        />
        <Tile
          icon={Timer}
          label="Elapsed"
          value={formatMinutes(elapsedMinutes)}
          unit=""
        />
      </div>

      {/* Progress bar to target */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-body-sm font-bold text-foreground">
            Progress to target
          </p>
          <p className="text-body-sm font-bold text-primary">
            {Math.round(progressPct)}%
          </p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-caption text-muted-foreground text-right">
          {etaMinutes != null && session.status === "active"
            ? `ETA ${formatMinutes(etaMinutes)}`
            : session.status === "completed"
              ? "Complete"
              : "Warming up…"}
        </p>
      </div>

      {/* Savings anchor */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              You're saving ₹{savings} vs petrol
            </p>
            <p className="text-caption text-muted-foreground">
              Based on avg fuel cost per equivalent kWh
            </p>
          </div>
        </div>
      </motion.div>

      {/* Session meta */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4 space-y-2">
        <MetaRow
          label="Connector"
          value={`${CONNECTOR_LABEL[session.connectorType]} · ${session.ratedKw} kW`}
        />
        <MetaRow
          label="Rate"
          value={`₹${session.pricePerKwh.toFixed(1)}/kWh`}
        />
        <MetaRow
          label="Peak draw"
          value={`${session.peakKw.toFixed(1)} kW`}
          muted
        />
      </div>

      {/* Sticky stop */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        {session.status === "active" ? (
          <MobileButton
            fullWidth
            variant="destructive"
            onClick={() => setConfirmStop(true)}
            className="gap-1.5"
          >
            <StopCircle className="w-4 h-4" />
            Stop charging
          </MobileButton>
        ) : (
          <MobileButton
            fullWidth
            onClick={() =>
              navigate(`/ev/session/${session.id}/receipt`, { replace: true })
            }
          >
            View receipt
          </MobileButton>
        )}
      </div>

      {/* Confirm stop dialog */}
      <Dialog open={confirmStop} onOpenChange={setConfirmStop}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Stop charging now?</DialogTitle>
            <DialogDescription>
              You'll be charged for the {session.kwhDelivered.toFixed(1)} kWh
              already delivered. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmStop(false)}
            >
              Keep going
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              onClick={handleStop}
              loading={endSession.isPending}
            >
              Stop
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Sub-components ----------

const ChargingRing = ({
  progressPct,
  primaryLabel,
  primaryUnit,
  secondaryLabel,
  pulsing,
}: {
  progressPct: number;
  primaryLabel: string;
  primaryUnit: string;
  secondaryLabel: string;
  pulsing: boolean;
}) => {
  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, progressPct)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="text-muted"
          stroke="currentColor"
          opacity={0.15}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary"
          stroke="currentColor"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={
            pulsing
              ? { scale: [1, 1.03, 1], opacity: [1, 0.9, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-baseline gap-1"
        >
          <span className="text-[42px] font-extrabold text-foreground leading-none">
            {primaryLabel}
          </span>
          <span className="text-body-sm font-bold text-muted-foreground">
            {primaryUnit}
          </span>
        </motion.div>
        <p className="mt-2 text-caption text-muted-foreground">
          {secondaryLabel}
        </p>
      </div>
    </div>
  );
};

const Tile = ({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-3 ${
      highlight
        ? "border-primary/40 bg-primary/5"
        : "border-border bg-card"
    }`}
  >
    <div className="flex items-center gap-1.5">
      <Icon
        className={`w-3.5 h-3.5 ${highlight ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p className="mt-1 flex items-baseline gap-1">
      <span
        className={`text-heading-sm ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </span>
      {unit && (
        <span className="text-body-sm text-muted-foreground">{unit}</span>
      )}
    </p>
  </div>
);

const MetaRow = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between">
    <span className="text-body-sm text-muted-foreground">{label}</span>
    <span
      className={`text-body-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {value}
    </span>
  </div>
);

const StatusPill = ({ status }: { status: "scheduled" | "active" | "completed" | "cancelled" }) => {
  const map = {
    scheduled: "bg-muted text-muted-foreground",
    active: "bg-emerald-500/10 text-emerald-600",
    completed: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  } as const;
  const label = {
    scheduled: "Scheduled",
    active: "Live",
    completed: "Complete",
    cancelled: "Cancelled",
  } as const;
  return (
    <span className={`text-caption font-bold px-2 py-1 rounded-lg ${map[status]}`}>
      {label[status]}
    </span>
  );
};

function formatMinutes(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default EvActiveSessionScreen;
