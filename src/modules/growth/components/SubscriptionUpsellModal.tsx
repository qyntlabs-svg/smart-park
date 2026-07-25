// Screen: G-05 (modal variant) · Primitives: Pricing, Payment
//
// Reusable Netflix-pattern subscription upsell dialog. Consumers can import
// this and render it in any surface — it self-manages open/close and dispatches
// the "upgrade" CTA to Subagent A's C-34 (`/ev-subscription`) as the
// destination if that route exists, else falls back to /growth/subscribe.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Check } from "lucide-react";

const LS_DISMISSED_KEY = "growthSubscribeDismissedAt";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export interface SubscriptionUpsellModalProps {
  /** Force-show regardless of dismissal cooldown */
  forceOpen?: boolean;
  /** Called when user closes (X, backdrop, or Not now) */
  onDismiss?: () => void;
  /** Called after user picks a plan. If not provided, navigates to C-34. */
  onUpgrade?: (planId: PlanId) => void;
  /** Called on mount if the user is in cooldown and the modal isn't shown */
  onSuppressed?: () => void;
}

type PlanId = "starter" | "commuter" | "unlimited";

interface Plan {
  id: PlanId;
  name: string;
  price: number; // ₹ per month
  kwh: number;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    kwh: 30,
    features: ["30 kWh / month", "Any AC charger", "Rollover unused kWh"],
  },
  {
    id: "commuter",
    name: "Commuter",
    price: 799,
    kwh: 100,
    features: [
      "100 kWh / month",
      "AC + DC up to 60 kW",
      "10% off overage",
      "Priority queue",
    ],
    highlight: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 2499,
    kwh: 9999,
    features: [
      "Unlimited AC + DC",
      "150 kW fast chargers",
      "No blackout dates",
      "Concierge support",
    ],
  },
];

/**
 * Utility: has the user recently dismissed this modal?
 * (Callers may consult this before rendering.)
 */
export function isSubscribeUpsellSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(LS_DISMISSED_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export const SubscriptionUpsellModal = ({
  forceOpen = true,
  onDismiss,
  onUpgrade,
  onSuppressed,
}: SubscriptionUpsellModalProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<PlanId>("commuter");

  useEffect(() => {
    if (!forceOpen) {
      setOpen(false);
      return;
    }
    if (isSubscribeUpsellSuppressed()) {
      onSuppressed?.();
      return;
    }
    setOpen(true);
  }, [forceOpen, onSuppressed]);

  const close = () => {
    try {
      localStorage.setItem(LS_DISMISSED_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setOpen(false);
    onDismiss?.();
  };

  const upgrade = () => {
    setOpen(false);
    if (onUpgrade) {
      onUpgrade(selected);
    } else {
      // Best-effort navigate: subagent A owns C-34 (/ev/subscription).
      navigate(`/ev/subscription?plan=${selected}`);
    }
  };

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
            {/* Hero band */}
            <div className="relative bg-gradient-to-br from-emerald-500/25 to-cyan-500/25 p-5">
              <button
                onClick={close}
                className="absolute right-3 top-3 rounded-full p-1 bg-black/20 hover:bg-black/30 text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-emerald-100 text-[12px] uppercase tracking-wider font-semibold">
                <Zap className="w-4 h-4" />
                Membership
              </div>
              <h2 className="mt-2 text-2xl font-bold text-foreground leading-tight">
                Charge more, pay less.
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                A monthly kWh bundle across every partner. Rollover, priority
                queueing, one bill.
              </p>
            </div>

            {/* Plans */}
            <div className="p-4 space-y-2">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selected === p.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-body font-semibold flex items-center gap-2">
                        {p.name}
                        {p.highlight ? (
                          <span className="rounded-full bg-emerald-500 text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.kwh >= 9999
                          ? "Unlimited kWh"
                          : `${p.kwh} kWh included`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums">
                        ₹{p.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        per month
                      </div>
                    </div>
                  </div>
                  <ul className="mt-2 grid grid-cols-1 gap-1">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="text-[12px] text-muted-foreground flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="p-4 pt-0 pb-safe flex flex-col gap-2">
              <button
                onClick={upgrade}
                className="w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold text-[15px]"
              >
                Continue with {PLANS.find((p) => p.id === selected)?.name}
              </button>
              <button
                onClick={close}
                className="w-full py-2 text-[13px] text-muted-foreground"
              >
                Not now
              </button>
              <p className="text-[10px] text-center text-muted-foreground">
                Cancel anytime · No lock-in · GST inclusive
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SubscriptionUpsellModal;
