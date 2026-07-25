// Screen: G-06 (modal variant) · Primitives: Review, Notification
//
// Reusable NPS prompt. Renders 0-10 chooser + comment field. Persists both
// submissions and dismissals to localStorage so it doesn't keep re-prompting.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";

const LS_KEY = "growthNpsResponses";
const LS_DISMISS_KEY = "growthNpsDismissedAt";

export interface NpsResponse {
  score: number;
  reason: string;
  submittedAt: string;
  context?: string;
}

/** Was the modal recently dismissed OR already answered? */
export function hasNpsResponded(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw && JSON.parse(raw).length > 0) return true;
    const d = localStorage.getItem(LS_DISMISS_KEY);
    if (d) {
      const age = Date.now() - Number(d);
      return age < 1000 * 60 * 60 * 24 * 14;
    }
  } catch {
    /* noop */
  }
  return false;
}

export function recordNps(response: NpsResponse) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as NpsResponse[]) : [];
    arr.unshift(response);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

export function loadNpsResponses(): NpsResponse[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as NpsResponse[]) : [];
  } catch {
    return [];
  }
}

export interface NpsModalProps {
  open: boolean;
  /** e.g. "after-first-booking", surfaced back on the response */
  context?: string;
  onDismiss?: () => void;
  onSubmit?: (r: NpsResponse) => void;
}

export const NpsModal = ({
  open,
  context = "post-first-booking",
  onDismiss,
  onSubmit,
}: NpsModalProps) => {
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const close = () => {
    try {
      localStorage.setItem(LS_DISMISS_KEY, String(Date.now()));
    } catch {
      /* */
    }
    onDismiss?.();
  };

  const submit = () => {
    if (score == null) return;
    const response: NpsResponse = {
      score,
      reason: reason.trim(),
      submittedAt: new Date().toISOString(),
      context,
    };
    recordNps(response);
    setSubmitted(true);
    onSubmit?.(response);
    setTimeout(close, 900);
  };

  const label =
    score == null
      ? ""
      : score >= 9
        ? "Promoter — great to hear."
        : score >= 7
          ? "Passive — what could push you to a 9?"
          : "Detractor — thanks, we take this seriously.";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-5 border-b border-border">
              <button
                onClick={close}
                className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                Quick feedback
              </div>
              <h2 className="text-body-lg font-bold mt-1">
                How likely are you to recommend SmartPark to a friend?
              </h2>
              <p className="text-[12px] text-muted-foreground mt-1">
                From 0 (not at all) to 10 (definitely).
              </p>
            </div>

            {submitted ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-body font-semibold">Thanks!</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  Your feedback is on its way to the team.
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }).map((_, i) => {
                    const selected = score === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setScore(i)}
                        className={`h-9 rounded-md text-[13px] font-semibold border transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
                {label ? (
                  <div className="text-[12px] text-muted-foreground">
                    {label}
                  </div>
                ) : null}
                <textarea
                  className="w-full rounded border border-border bg-background p-2 text-[13px] outline-none focus:border-primary min-h-[80px]"
                  placeholder="What's the main reason for your score? (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2 pb-safe">
                  <button
                    onClick={close}
                    className="rounded-full px-4 py-2 text-[13px] text-muted-foreground"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submit}
                    disabled={score == null}
                    className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-[13px] font-semibold disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default NpsModal;
