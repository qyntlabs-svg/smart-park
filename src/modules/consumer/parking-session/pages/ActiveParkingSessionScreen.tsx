// Screen: C-21 · Primitives: Reservation, Pricing, Notification
//
// Live view of an ongoing parking session. Mirrors the shape of the wedge
// EvActiveSessionScreen but for a parking bay: elapsed timer, running cost,
// extend +30m, and an exit-QR trigger sheet.
//
// Route: /parking/session/:id

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Car,
  Clock,
  IndianRupee,
  Plus,
  QrCode,
  StopCircle,
  ParkingCircle,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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
  useEndParkingSession,
  useExtendParkingSession,
  useParkingSession,
  useTickParkingSession,
} from "@/modules/consumer/parking-session/hooks";

const TICK_INTERVAL_MS = 5_000;

const ActiveParkingSessionScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useParkingSession(id);
  const tick = useTickParkingSession();
  const extend = useExtendParkingSession();
  const end = useEndParkingSession();

  const [showQr, setShowQr] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Live tick while active
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!id || !session || session.status !== "active") return;
    const iv = window.setInterval(() => tickRef.current.mutate(id), TICK_INTERVAL_MS);
    tickRef.current.mutate(id);
    return () => window.clearInterval(iv);
  }, [id, session?.status]);

  const elapsedMinutes = useMemo(() => {
    if (!session) return 0;
    const end = session.endedAt ? new Date(session.endedAt) : new Date();
    return Math.max(0, (end.getTime() - new Date(session.startedAt).getTime()) / 60_000);
  }, [session?.startedAt, session?.endedAt, session?.runningCost]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <Header title="Parking session" onBack={() => navigate("/home")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <ParkingCircle className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-body font-bold text-foreground">Session not found</p>
          <p className="text-body-sm text-muted-foreground">
            This parking session may have ended already.
          </p>
          <MobileButton
            variant="outline"
            onClick={() => navigate("/booking-history")}
          >
            View history
          </MobileButton>
        </div>
      </div>
    );
  }

  const handleExtend = async () => {
    try {
      await extend.mutateAsync({ sessionId: session.id, addMinutes: 30 });
      toast.success("Extended by 30 minutes");
    } catch {
      toast.error("Could not extend session");
    }
  };

  const handleEnd = async () => {
    try {
      await end.mutateAsync(session.id);
      setConfirmEnd(false);
      toast.success("Session ended. Please exit within 10 minutes.");
      navigate("/booking-history");
    } catch {
      toast.error("Could not end session");
    }
  };

  const isActive = session.status === "active";

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      <Header
        title={session.facilityName}
        subtitle={`Slot ${session.slotNumber}`}
        onBack={() => navigate("/home")}
        badge={isActive ? "Live" : session.status}
        badgeTone={isActive ? "success" : "muted"}
      />

      {/* Elapsed hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-emerald-500/10 border-2 border-primary/20 p-5"
      >
        <p className="text-caption font-bold uppercase tracking-wider text-primary">
          Elapsed
        </p>
        <p className="mt-1 text-[46px] font-extrabold text-foreground leading-none">
          {formatDuration(elapsedMinutes)}
        </p>
        <div className="mt-3 flex items-center gap-2 text-body-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Started {new Date(session.startedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </motion.div>

      {/* Tiles */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <Tile
          icon={IndianRupee}
          label="Running cost"
          value={`₹${session.runningCost}`}
          highlight={isActive}
        />
        <Tile
          icon={Clock}
          label="Rate"
          value={`₹${session.hourlyRate}/hr`}
        />
        <Tile
          icon={Car}
          label="Vehicle"
          value={session.vehicleRegistration ?? "—"}
        />
        <Tile
          icon={ParkingCircle}
          label="Extensions"
          value={`${session.extensions}× +30m`}
        />
      </div>

      {/* Facility card */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-foreground">
              {session.facilityName}
            </p>
            <p className="text-caption text-muted-foreground">
              {session.facilityAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <MobileButton
          variant="outline"
          onClick={handleExtend}
          loading={extend.isPending}
          disabled={!isActive}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Extend +30m
        </MobileButton>
        <MobileButton
          variant="secondary"
          onClick={() => setShowQr(true)}
          className="gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          Exit QR
        </MobileButton>
      </div>

      {/* Sticky end */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        {isActive ? (
          <MobileButton
            fullWidth
            variant="destructive"
            className="gap-1.5"
            onClick={() => setConfirmEnd(true)}
          >
            <StopCircle className="w-4 h-4" />
            End session
          </MobileButton>
        ) : (
          <MobileButton fullWidth onClick={() => navigate("/booking-history")}>
            View receipt
          </MobileButton>
        )}
      </div>

      {/* Exit QR bottom sheet */}
      <BottomSheet
        open={showQr}
        onClose={() => setShowQr(false)}
        snapPoints={[0.7]}
      >
        <div className="pt-2 flex flex-col items-center text-center">
          <p className="text-heading-sm text-foreground">Show this at the gate</p>
          <p className="mt-1 text-caption text-muted-foreground">
            Attendant scans to close your session
          </p>
          <div className="mt-4 p-4 bg-card rounded-2xl border border-border">
            <QRCodeSVG
              value={session.exitQrToken}
              size={200}
              bgColor="transparent"
            />
          </div>
          <p className="mt-3 font-mono text-caption text-muted-foreground">
            {session.exitQrToken}
          </p>
          <MobileButton
            fullWidth
            variant="outline"
            className="mt-6"
            onClick={() => setShowQr(false)}
          >
            Done
          </MobileButton>
        </div>
      </BottomSheet>

      {/* End confirmation dialog */}
      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>End parking session?</DialogTitle>
            <DialogDescription>
              You'll be charged ₹{session.runningCost}. Please exit within
              10 minutes to avoid overstay fees.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmEnd(false)}
            >
              Keep parked
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              loading={end.isPending}
              onClick={handleEnd}
            >
              End session
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Sub-components ----------

const Header = ({
  title,
  subtitle,
  onBack,
  badge,
  badgeTone = "muted",
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  badge?: string;
  badgeTone?: "success" | "muted";
}) => (
  <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
    <button
      onClick={onBack}
      className="touch-target flex items-center justify-center"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
    <ParkingCircle className="w-5 h-5 text-primary" />
    <div className="min-w-0 flex-1">
      <p className="text-body font-bold text-foreground truncate">{title}</p>
      {subtitle && (
        <p className="text-caption text-muted-foreground truncate">
          {subtitle}
        </p>
      )}
    </div>
    {badge && (
      <span
        className={`text-caption font-bold px-2 py-1 rounded-lg ${
          badgeTone === "success"
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {badge}
      </span>
    )}
  </header>
);

const Tile = ({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-3 ${
      highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
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
    <p
      className={`mt-1 text-heading-sm ${highlight ? "text-primary" : "text-foreground"}`}
    >
      {value}
    </p>
  </div>
);

function formatDuration(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default ActiveParkingSessionScreen;
