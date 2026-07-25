// Screen: C-47 · Primitives: Vehicle, Identity, Review
//
// 0-100 score per vehicle based on mock service history + telematics.
// Category breakdown + actionable recommendations.
//
// Route: /health-score  (optional vehicleId query param)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Heart,
  ChevronDown,
  Car,
  ChevronRight,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useVehicles } from "@/api/vehicles";
import { useHealthScore } from "@/modules/consumer/insights/hooks";
import type { HealthScore } from "@/modules/consumer/insights/types";

const bandColor = (band: HealthScore["band"]) =>
  band === "excellent"
    ? { fg: "text-emerald-600", bg: "bg-emerald-500/10", ring: "text-emerald-500" }
    : band === "good"
      ? { fg: "text-primary", bg: "bg-primary/10", ring: "text-primary" }
      : band === "fair"
        ? { fg: "text-warning", bg: "bg-warning/10", ring: "text-warning" }
        : { fg: "text-destructive", bg: "bg-destructive/10", ring: "text-destructive" };

const VehicleHealthScoreScreen = () => {
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading: vLoading } = useVehicles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected =
    vehicles.find((v) => v.id === selectedId) ??
    vehicles.find((v) => v.is_default) ??
    vehicles[0];

  const { data: score, isLoading, isError, refetch } = useHealthScore(selected?.id);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-16">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Health score
        </h1>
      </header>

      {/* Vehicle picker */}
      <button
        onClick={() => setPickerOpen(true)}
        className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-2xl border border-border bg-card"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-caption text-muted-foreground">Vehicle</p>
          <p className="text-body-sm font-bold text-foreground truncate">
            {vLoading
              ? "Loading…"
              : selected?.registration_number ?? "No vehicles"}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {isLoading || vLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !score ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't compute score
          </p>
          <MobileButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </MobileButton>
        </div>
      ) : (
        <>
          {/* Score ring */}
          <div className="px-4 pt-6 flex justify-center">
            <ScoreRing score={score.score} band={score.band} />
          </div>

          <p className="text-center mt-2 text-body-sm text-muted-foreground">
            Updated{" "}
            {new Date(score.updatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>

          {/* Category breakdown */}
          <div className="mx-4 mt-6">
            <p className="text-body-sm font-bold text-foreground">
              Category breakdown
            </p>
            <div className="mt-2 space-y-2">
              {score.categories.map((c) => (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-body-sm font-bold text-foreground">
                      {c.label}
                    </p>
                    <p className="text-body-sm font-bold text-primary">
                      {c.score}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  {c.note && (
                    <p className="text-caption text-muted-foreground mt-1">
                      {c.note}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mx-4 mt-6">
            <p className="text-body-sm font-bold text-foreground">
              Recommendations
            </p>
            <div className="mt-2 space-y-2">
              {score.recommendations.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border border-border bg-card"
                >
                  <p className="text-body-sm font-bold text-foreground">
                    {r.title}
                  </p>
                  <p className="text-caption text-muted-foreground mt-1">
                    {r.body}
                  </p>
                  {r.cta && (
                    <button
                      onClick={() => navigate(r.cta!.route)}
                      className="mt-3 flex items-center gap-1 text-body-sm font-semibold text-primary"
                    >
                      {r.cta.label}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Vehicle picker sheet */}
      <BottomSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        snapPoints={[0.6]}
      >
        <p className="text-heading-sm text-foreground">Choose vehicle</p>
        <div className="mt-4 space-y-2">
          {(vehicles ?? []).map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setSelectedId(v.id);
                setPickerOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl ${
                (selected?.id ?? "") === v.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <Car className="w-4 h-4 text-primary" />
              <div className="text-left flex-1">
                <p className="text-body-sm font-bold text-foreground">
                  {v.registration_number}
                </p>
                <p className="text-caption text-muted-foreground">
                  {v.nickname || v.model || "Vehicle"}
                </p>
              </div>
            </button>
          ))}
          {vehicles.length === 0 && (
            <p className="text-body-sm text-muted-foreground text-center py-6">
              No vehicles yet
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

// ---------- Score ring ----------

const ScoreRing = ({
  score,
  band,
}: {
  score: number;
  band: HealthScore["band"];
}) => {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const colors = bandColor(band);

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
          className={colors.ring}
          stroke="currentColor"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Heart className={`w-4 h-4 ${colors.fg} mb-1`} />
        <span className="text-[46px] font-extrabold text-foreground leading-none">
          {score}
        </span>
        <span
          className={`mt-1 text-caption font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.fg}`}
        >
          {band}
        </span>
      </div>
    </div>
  );
};

export default VehicleHealthScoreScreen;
