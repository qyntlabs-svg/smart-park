// Screen: C-50 · Primitives: Identity, Review
//
// Duolingo-style consecutive weeks + unlocked badges.
//
// Route: /streaks

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Flame, Lock } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { useStreakState } from "@/modules/consumer/insights/hooks";

const StreaksScreen = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useStreakState();

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
          Streaks & badges
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !data ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load your streaks
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
          {/* Streak hero */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-orange-500/20 via-primary/10 to-emerald-500/10 border-2 border-orange-500/25 p-5 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center"
            >
              <Flame className="w-8 h-8 text-orange-500" />
            </motion.div>
            <p className="mt-3 text-[46px] font-extrabold text-foreground leading-none">
              {data.weeksActive}
            </p>
            <p className="text-body-sm font-bold text-foreground">
              week{data.weeksActive === 1 ? "" : "s"} in a row
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              {data.currentWeekActive
                ? "This week is locked in — nice work!"
                : "Reserve a charger this week to keep the streak alive"}
            </p>
          </motion.div>

          {/* Week strip */}
          <div className="mx-4 mt-4">
            <p className="text-body-sm font-bold text-foreground">
              Recent weeks
            </p>
            <div className="mt-2 flex items-end gap-1.5 h-16">
              {Array.from({ length: 8 }).map((_, i) => {
                const active = i < Math.min(8, data.weeksActive);
                const height = active ? `${40 + (i % 3) * 12}px` : "14px";
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md transition-colors ${
                      active ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ height }}
                  />
                );
              })}
            </div>
          </div>

          {/* Badges grid */}
          <div className="mx-4 mt-6">
            <p className="text-body-sm font-bold text-foreground">Badges</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {data.badges.map((b, i) => {
                const unlocked = !!b.unlockedAt;
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`p-3 rounded-2xl text-center relative border ${
                      unlocked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card opacity-70"
                    }`}
                  >
                    <div className={`text-3xl ${unlocked ? "" : "grayscale opacity-60"}`}>
                      {b.emoji}
                    </div>
                    <p className="mt-1 text-caption font-bold text-foreground leading-tight">
                      {b.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {b.description}
                    </p>
                    {!unlocked && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mx-4 mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-body-sm font-bold text-foreground">
              Keep it going
            </p>
            <p className="text-caption text-muted-foreground mt-1">
              One reserved session per week keeps the streak alive.
            </p>
            <MobileButton
              variant="outline"
              className="mt-3"
              onClick={() => navigate("/ev")}
            >
              Reserve a charger
            </MobileButton>
          </div>
        </>
      )}
    </div>
  );
};

export default StreaksScreen;
