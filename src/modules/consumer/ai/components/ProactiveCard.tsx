// Shared component: renders one AI proactive suggestion as a horizontal card.
// Used by:
//   - HomeScreen top carousel (compact variant)
//   - C-44 AiProactiveFeedScreen (default variant)

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, ChevronRight } from "lucide-react";
import type { ProactiveSuggestion } from "@/modules/consumer/ai/types";

interface ProactiveCardProps {
  suggestion: ProactiveSuggestion;
  variant?: "compact" | "default";
  onDismiss?: (id: string) => void;
  onAction?: (s: ProactiveSuggestion) => void;
  className?: string;
}

export const ProactiveCard = ({
  suggestion: s,
  variant = "default",
  onDismiss,
  onAction,
  className,
}: ProactiveCardProps) => {
  const navigate = useNavigate();

  const handleCta = () => {
    onAction?.(s);
    navigate(s.ctaRoute);
  };

  const isCompact = variant === "compact";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`relative rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-500/10 p-4 ${
        isCompact ? "min-w-[280px]" : ""
      } ${className ?? ""}`}
    >
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(s.id);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-card/60 backdrop-blur flex items-center justify-center active:scale-90"
          aria-label="Dismiss suggestion"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-lg">
          <span>{s.emoji}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <p className="text-caption font-bold text-primary uppercase tracking-wider">
              AI suggests
            </p>
          </div>
          <p className="mt-1 text-body-sm font-bold text-foreground">
            {s.title}
          </p>
          <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">
            {s.body}
          </p>
        </div>
      </div>

      <div className={`mt-3 flex ${isCompact ? "" : "gap-2"}`}>
        <button
          onClick={handleCta}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97]"
        >
          {s.ctaLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
        {!isCompact && s.secondaryLabel && onDismiss && (
          <button
            onClick={() => onDismiss(s.id)}
            className="h-10 px-3 rounded-xl border border-border text-body-sm font-semibold text-muted-foreground active:bg-secondary"
          >
            {s.secondaryLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProactiveCard;
