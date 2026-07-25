// Screen: C-34 · Primitives: Pricing, Payment, Reservation
//
// Netflix-style tier picker for EV membership. Basic / Plus / Pro.
// Manage / upgrade / cancel current subscription (mock).
//
// Route: /ev/subscription

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Check,
  Loader2,
  Sparkles,
  Crown,
  ShieldOff,
  RotateCcw,
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
  useCancelSubscription,
  useResumeSubscription,
  useSubscribe,
  useSubscription,
  useUpgradeSubscription,
} from "@/modules/consumer/subscription/hooks";
import {
  TIERS,
  type SubscriptionTierId,
} from "@/modules/consumer/subscription/types";

const EvSubscriptionScreen = () => {
  const navigate = useNavigate();
  const { data: sub, isLoading, isError, refetch } = useSubscription();
  const subscribe = useSubscribe();
  const upgrade = useUpgradeSubscription();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();

  const [selected, setSelected] = useState<SubscriptionTierId>("plus");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentTier = sub?.tierId
    ? TIERS.find((t) => t.id === sub.tierId)
    : null;

  const handleAction = async () => {
    try {
      if (!sub?.active) {
        await subscribe.mutateAsync(selected);
        toast.success(`Welcome to ${labelFor(selected)}!`);
      } else if (sub.tierId !== selected) {
        await upgrade.mutateAsync(selected);
        toast.success(`Switched to ${labelFor(selected)}`);
      }
    } catch {
      toast.error("Could not update subscription");
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      setConfirmCancel(false);
      toast.success("Subscription will end at period end");
    } catch {
      toast.error("Could not cancel");
    }
  };

  const handleResume = async () => {
    try {
      await resume.mutateAsync();
      toast.success("Subscription reactivated");
    } catch {
      toast.error("Could not reactivate");
    }
  };

  const ctaLabel = !sub?.active
    ? `Start ${labelFor(selected)} membership`
    : sub.tierId === selected
      ? "You're on this plan"
      : `Switch to ${labelFor(selected)}`;

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
          EV Membership
        </h1>
      </header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/15 border border-primary/30 p-5"
      >
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <p className="text-caption font-bold text-primary uppercase tracking-wider">
            {sub?.active ? "You're a member" : "Save on every kWh"}
          </p>
        </div>
        <p className="mt-2 text-heading-md text-foreground leading-tight">
          {sub?.active && currentTier
            ? `${currentTier.name} · ${currentTier.includedKwh} kWh/mo`
            : "Netflix-style EV pass, priced right."}
        </p>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {sub?.active
            ? sub.cancelAtPeriodEnd
              ? `Ends ${sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "soon"}`
              : `Renews ${sub.renewsAt ? new Date(sub.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "monthly"}`
            : "Cancel anytime. Unused kWh don't roll over."}
        </p>
      </motion.div>

      {/* Loading / error */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}
      {isError && (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load subscription
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
      )}

      {/* Tier cards */}
      {!isLoading && !isError && (
        <div className="mx-4 mt-4 space-y-3">
          {TIERS.map((tier) => {
            const isSelected = selected === tier.id;
            const isCurrent = sub?.active && sub.tierId === tier.id;
            return (
              <motion.button
                key={tier.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(tier.id)}
                className={`w-full text-left p-5 rounded-2xl border-2 bg-card transition-all ${
                  isSelected ? "border-primary shadow-md" : tier.accentClass
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-heading-sm text-foreground">
                      {tier.name}
                    </span>
                    {tier.recommended && (
                      <span className="text-caption font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-caption font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-500/10">
                        Current
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[32px] font-extrabold text-foreground leading-none">
                    ₹{tier.monthlyPrice}
                  </span>
                  <span className="text-body-sm text-muted-foreground">
                    /month
                  </span>
                </div>
                <p className="mt-1 text-caption text-primary font-bold">
                  {tier.includedKwh} kWh included
                </p>

                <ul className="mt-4 space-y-1.5">
                  {tier.perksLines.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-body-sm text-foreground"
                    >
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Manage panel */}
      <AnimatePresence>
        {sub?.active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-6 rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-body-sm font-bold text-foreground">
              Manage subscription
            </p>
            <p className="text-caption text-muted-foreground mt-1">
              {sub.cancelAtPeriodEnd
                ? "Cancellation scheduled. You can resume before period ends."
                : "You can pause anytime — no early-exit fees."}
            </p>
            {sub.cancelAtPeriodEnd ? (
              <MobileButton
                variant="outline"
                fullWidth
                className="mt-3 gap-1.5"
                onClick={handleResume}
              >
                <RotateCcw className="w-4 h-4" />
                Reactivate subscription
              </MobileButton>
            ) : (
              <MobileButton
                variant="outline"
                fullWidth
                className="mt-3 gap-1.5"
                onClick={() => setConfirmCancel(true)}
              >
                <ShieldOff className="w-4 h-4" />
                Cancel at period end
              </MobileButton>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          onClick={handleAction}
          loading={subscribe.isPending || upgrade.isPending}
          disabled={sub?.active && sub.tierId === selected}
          className="gap-1.5"
        >
          <Zap className="w-4 h-4" />
          {ctaLabel}
        </MobileButton>
      </div>

      {/* Cancel dialog */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel at period end?</DialogTitle>
            <DialogDescription>
              You'll keep member benefits until{" "}
              {sub?.renewsAt
                ? new Date(sub.renewsAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "period end"}
              . After that we'll drop you back to pay-as-you-go.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmCancel(false)}
            >
              Keep
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              loading={cancel.isPending}
              onClick={handleCancel}
            >
              Cancel plan
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function labelFor(id: SubscriptionTierId): string {
  return TIERS.find((t) => t.id === id)?.name ?? id;
}

export default EvSubscriptionScreen;
