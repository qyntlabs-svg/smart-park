// Screen: C-46 · Primitives: Reservation, Payment, Vehicle
//
// List of recent journeys. Tap → re-books identical journey with new datetime.
//
// Route: /journey/one-tap

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Route as RouteIcon,
  Zap,
  ParkingCircle,
  Car,
  Clock,
  Sparkles,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  useJourneys,
  useRebookJourney,
} from "@/modules/consumer/journey/hooks";
import type { Journey } from "@/modules/consumer/journey/types";

const OneTapJourneyScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";
  const { data: journeys = [], isLoading, isError, refetch } = useJourneys(userId);
  const rebook = useRebookJourney();

  const handleRebook = async (j: Journey) => {
    try {
      await rebook.mutateAsync(j.id);
      toast.success("Rebooked — all stops reserved");
    } catch {
      toast.error("Could not rebook journey");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-24">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          One-tap journeys
        </h1>
      </header>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/25 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-bold text-foreground">
              Amazon-1-click, for mobility
            </p>
            <p className="text-caption text-muted-foreground">
              Tap any journey to reserve every stop again for today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* List */}
      <div className="mx-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : journeys.length === 0 ? (
          <EmptyState onPlan={() => navigate("/journey")} />
        ) : (
          journeys.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl border border-border bg-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <RouteIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {j.from} → {j.to}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {new Date(j.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {j.legs.length} stops
                  </p>
                </div>
                <p className="text-body-sm font-bold text-foreground shrink-0">
                  ₹{j.totalCost}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {j.legs.map((l, k) => {
                  const Icon =
                    l.kind === "charge"
                      ? Zap
                      : l.kind === "park"
                        ? ParkingCircle
                        : Car;
                  return (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-caption text-muted-foreground"
                    >
                      <Icon className="w-3 h-3" />
                      {l.kind}
                    </span>
                  );
                })}
                <span className="ml-auto inline-flex items-center gap-1 text-caption text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatMinutes(j.totalMinutes)}
                </span>
              </div>

              <MobileButton
                fullWidth
                className="mt-3"
                onClick={() => handleRebook(j)}
                loading={rebook.isPending}
              >
                Rebook now — ₹{j.totalCost}
              </MobileButton>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ onPlan }: { onPlan: () => void }) => (
  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <RouteIcon className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-3 text-body font-bold text-foreground">
      No journeys yet
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      Plan one and it'll show up here for one-tap rebooking.
    </p>
    <MobileButton className="mt-4" onClick={onPlan}>
      Plan a journey
    </MobileButton>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
    <p className="text-body-sm font-semibold text-destructive">
      Couldn't load journeys
    </p>
    <MobileButton variant="outline" size="sm" className="mt-3" onClick={onRetry}>
      Retry
    </MobileButton>
  </div>
);

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (h === 0) return `${min}m`;
  return `${h}h ${min}m`;
}

export default OneTapJourneyScreen;
