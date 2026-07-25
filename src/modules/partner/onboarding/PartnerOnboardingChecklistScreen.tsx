// Screen: V-25 · Primitives: Identity, Provider
// Route: /partner/onboarding

import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Rocket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useMarkOnboardingStep,
  useOnboardingProgress,
} from "./hooks";
import type { OnboardingStep } from "./types";

const PartnerOnboardingChecklistScreen = () => {
  const navigate = useNavigate();
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: progress, isLoading, isError } = useOnboardingProgress(partnerId);
  const markStep = useMarkOnboardingStep();

  const handleCTA = async (step: OnboardingStep) => {
    if (step.status === "done") return;
    if (step.status === "in_progress") {
      // Simulate finishing the step so demo can move forward
      await markStep.mutateAsync({ partnerId, id: step.id });
    }
    navigate(step.route);
  };

  return (
    <PartnerScreenLayout title="Get started" icon={Rocket}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError || !progress ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load onboarding
        </p>
      ) : (
        <>
          {/* Progress hero */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-bold text-primary uppercase tracking-wider">
                  Your progress
                </p>
                <p className="text-heading-md font-bold text-foreground mt-1">
                  {progress.completedCount} of {progress.totalCount} done
                </p>
              </div>
              <div className="text-right">
                <p className="text-heading-md font-bold text-primary">
                  {progress.progressPct}%
                </p>
                {progress.progressPct === 100 && (
                  <p className="text-caption text-success font-semibold">
                    Live! 🚀
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.progressPct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Steps */}
          {progress.steps.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl border bg-card ${
                s.status === "in_progress"
                  ? "border-primary/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {s.status === "done" ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : s.status === "in_progress" ? (
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-body-sm font-bold ${
                      s.status === "done"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    {s.helper}
                  </p>
                  {s.status === "done" && s.completedAt && (
                    <p className="text-[10px] text-success mt-1">
                      Completed{" "}
                      {new Date(s.completedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
              </div>
              {s.status !== "done" && (
                <MobileButton
                  size="sm"
                  fullWidth
                  variant={s.status === "in_progress" ? "primary" : "outline"}
                  className="mt-3 gap-1.5"
                  onClick={() => handleCTA(s)}
                  loading={markStep.isPending}
                >
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </MobileButton>
              )}
            </motion.div>
          ))}
        </>
      )}
    </PartnerScreenLayout>
  );
};

export default PartnerOnboardingChecklistScreen;
