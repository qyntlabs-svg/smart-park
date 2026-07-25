// Screen: T-07 · Primitives: Provider, Identity
// Route: /tow/profile

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, Truck, User } from "lucide-react";
import { toast } from "sonner";
import TowLayout from "@/modules/tow/components/TowLayout";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import {
  getCurrentOperator,
  setTowAuth,
  TRUCK_TYPE_LABEL,
  updateOperator,
  type TowOperator,
  type TruckType,
} from "@/modules/tow/lib/tow";

const TRUCK_TYPES: TruckType[] = [
  "flatbed",
  "wheel_lift",
  "hook_chain",
  "ev_safe",
];

const CAP_KEYS = [
  { key: "flatbed", label: "Flatbed transport" },
  { key: "wheelLift", label: "Wheel-lift towing" },
  { key: "evSafe", label: "EV-safe (insulated)" },
  { key: "heavyDuty", label: "Heavy-duty (>5T)" },
  { key: "accidentRecovery", label: "Accident recovery" },
] as const;

const TowProfileScreen = () => {
  const navigate = useNavigate();
  const [op, setOp] = useState<TowOperator | null>(getCurrentOperator());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!op) navigate("/tow/login", { replace: true });
  }, [op, navigate]);

  if (!op) return null;

  const patch = <K extends keyof TowOperator>(k: K, v: TowOperator[K]) => {
    setOp((prev) => (prev ? { ...prev, [k]: v } : prev));
    setDirty(true);
  };

  const patchCap = (k: keyof TowOperator["capabilities"], v: boolean) => {
    setOp((prev) =>
      prev ? { ...prev, capabilities: { ...prev.capabilities, [k]: v } } : prev,
    );
    setDirty(true);
  };

  const save = () => {
    if (!op) return;
    updateOperator(op.id, op);
    setDirty(false);
    toast.success("Profile saved");
  };

  const logout = () => {
    if (!confirm("Log out of your Tow operator account?")) return;
    setTowAuth(null);
    navigate("/tow/login", { replace: true });
  };

  return (
    <TowLayout title="Operator profile" showBack>
      <div className="px-5 py-4 space-y-5">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-bold text-foreground truncate">
              {op.name}
            </p>
            <p className="text-caption text-muted-foreground truncate">
              {op.phone} · {op.city}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <p className="text-body-sm font-bold text-foreground">Driver</p>
          <Field label="Full name">
            <Input
              value={op.name}
              onChange={(e) => patch("name", e.target.value)}
              className="h-12 rounded-xl"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={op.phone}
              onChange={(e) => patch("phone", e.target.value)}
              inputMode="tel"
              className="h-12 rounded-xl"
            />
          </Field>
          <Field label="Base city">
            <Input
              value={op.city}
              onChange={(e) => patch("city", e.target.value)}
              className="h-12 rounded-xl"
            />
          </Field>
        </section>

        <section className="space-y-3">
          <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" /> Truck
          </p>
          <Field label="Plate">
            <Input
              value={op.truckPlate}
              onChange={(e) =>
                patch("truckPlate", e.target.value.toUpperCase())
              }
              className="h-12 rounded-xl uppercase"
            />
          </Field>
          <Field label="Truck type">
            <div className="grid grid-cols-2 gap-2">
              {TRUCK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => patch("truckType", t)}
                  className={`p-3 rounded-xl border text-body-sm font-semibold ${
                    op.truckType === t
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {TRUCK_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </Field>
        </section>

        <section className="space-y-2">
          <p className="text-body-sm font-bold text-foreground">Capabilities</p>
          {CAP_KEYS.map((c) => (
            <label
              key={c.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <input
                type="checkbox"
                checked={op.capabilities[c.key]}
                onChange={(e) => patchCap(c.key, e.target.checked)}
                className="w-5 h-5 accent-primary"
              />
              <span className="text-body-sm text-foreground flex-1">
                {c.label}
              </span>
            </label>
          ))}
        </section>

        <div className="flex gap-2">
          <MobileButton
            fullWidth
            disabled={!dirty}
            onClick={save}
          >
            <Save className="w-4 h-4" /> Save changes
          </MobileButton>
        </div>

        <button
          onClick={logout}
          className="w-full h-11 rounded-xl border border-destructive/40 text-destructive font-semibold text-body-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </TowLayout>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="text-caption text-muted-foreground">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

export default TowProfileScreen;
