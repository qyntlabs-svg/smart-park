// Screen: C-44 · Primitives: Reservation, Location, Availability, Notification
//
// Feed of proactive AI suggestions. Each card routes into an existing screen.
// The HomeScreen carousel and this screen share the same ProactiveCard.
//
// Route: /ai/feed

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import {
  useDismissProactiveSuggestion,
  useProactiveSuggestions,
  useResetProactiveDismissals,
} from "@/modules/consumer/ai/hooks";
import { ProactiveCard } from "@/modules/consumer/ai/components/ProactiveCard";

const AiProactiveFeedScreen = () => {
  const navigate = useNavigate();
  const { data: items = [], isLoading, isError, refetch } = useProactiveSuggestions();
  const dismiss = useDismissProactiveSuggestion();
  const reset = useResetProactiveDismissals();

  const handleDismiss = (id: string) => {
    dismiss.mutate(id);
  };

  const handleReset = async () => {
    await reset.mutateAsync();
    toast.success("All suggestions restored");
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
        <div className="flex-1 flex items-center gap-1.5 justify-center pr-11">
          <Sparkles className="w-4 h-4 text-primary" />
          <h1 className="text-body font-bold text-foreground">
            Smart suggestions
          </h1>
        </div>
      </header>

      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate("/ai/chat")}
          className="w-full rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 p-4 text-left"
        >
          <p className="text-body-sm font-bold text-foreground">
            Prefer to ask? Chat with the concierge →
          </p>
          <p className="text-caption text-muted-foreground mt-0.5">
            "Cheapest charger before airport"
          </p>
        </button>
      </div>

      {/* Feed */}
      <div className="mx-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-body-sm font-semibold text-destructive">
              Couldn't load suggestions
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
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-border p-6 text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <p className="mt-3 text-body font-bold text-foreground">
              All caught up
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Suggestions refresh through the day based on your activity.
            </p>
            <MobileButton
              variant="outline"
              className="mt-4 gap-1.5"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4" />
              Restore dismissed
            </MobileButton>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((s) => (
              <ProactiveCard
                key={s.id}
                suggestion={s}
                onDismiss={handleDismiss}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AiProactiveFeedScreen;
