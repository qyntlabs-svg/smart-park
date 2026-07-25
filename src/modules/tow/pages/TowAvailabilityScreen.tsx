// Screen: T-06 · Primitives: Availability, Identity
// Route: /tow/availability

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Coffee, Power, Truck } from "lucide-react";
import { toast } from "sonner";
import TowLayout from "@/modules/tow/components/TowLayout";
import {
  getCurrentOperator,
  TOW_STATUS_LABEL,
  updateOperator,
  type TowOperator,
  type TowOperatorStatus,
} from "@/modules/tow/lib/tow";

const OPTIONS: {
  key: TowOperatorStatus;
  icon: typeof Truck;
  tone: string;
  hint: string;
}[] = [
  {
    key: "on_duty",
    icon: CheckCircle2,
    tone: "success",
    hint: "You'll receive live SOS requests within range.",
  },
  {
    key: "on_break",
    icon: Coffee,
    tone: "warning",
    hint: "Paused for a short break — no new jobs pushed.",
  },
  {
    key: "off_duty",
    icon: Power,
    tone: "muted",
    hint: "Logged in, but the queue is silent.",
  },
];

const TowAvailabilityScreen = () => {
  const navigate = useNavigate();
  const [op, setOp] = useState<TowOperator | null>(getCurrentOperator());

  useEffect(() => {
    if (!op) navigate("/tow/login", { replace: true });
  }, [op, navigate]);

  const set = (next: TowOperatorStatus) => {
    if (!op) return;
    const updated = updateOperator(op.id, { status: next });
    if (updated) {
      setOp(updated);
      toast.success(`You are now ${TOW_STATUS_LABEL[next]}`);
    }
  };

  if (!op) return null;

  return (
    <TowLayout title="Availability" showBack>
      <div className="px-4 py-4 space-y-3">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-caption text-muted-foreground">Current status</p>
          <p className="text-body font-bold text-foreground mt-1">
            {TOW_STATUS_LABEL[op.status]}
          </p>
        </div>

        {OPTIONS.map((opt) => {
          const active = op.status === opt.key;
          const Icon = opt.icon;
          const toneClass =
            opt.tone === "success"
              ? "text-success"
              : opt.tone === "warning"
                ? "text-warning"
                : "text-muted-foreground";
          return (
            <button
              key={opt.key}
              onClick={() => set(opt.key)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${toneClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-bold text-foreground">
                  {TOW_STATUS_LABEL[opt.key]}
                </p>
                <p className="text-caption text-muted-foreground">{opt.hint}</p>
              </div>
              {active && (
                <span className="text-caption font-semibold text-primary">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </TowLayout>
  );
};

export default TowAvailabilityScreen;
