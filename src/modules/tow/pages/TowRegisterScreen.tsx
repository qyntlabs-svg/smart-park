// Screen: T-01 (register half) · Primitives: Identity, Provider
// Route: /tow/register

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Truck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  setTowAuth,
  upsertOperator,
  TRUCK_TYPE_LABEL,
  type TruckType,
} from "@/modules/tow/lib/tow";

const TRUCK_TYPES: TruckType[] = [
  "flatbed",
  "wheel_lift",
  "hook_chain",
  "ev_safe",
];

const TowRegisterScreen = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [step, setStep] = useState<"driver" | "truck" | "done">("driver");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState(sp.get("phone") ?? "");
  const [city, setCity] = useState("Chennai");

  const [truckPlate, setTruckPlate] = useState("");
  const [truckType, setTruckType] = useState<TruckType>("flatbed");
  const [caps, setCaps] = useState({
    flatbed: true,
    wheelLift: false,
    evSafe: false,
    heavyDuty: false,
    accidentRecovery: false,
  });

  const submit = () => {
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      return toast.error("Enter your name and a valid phone number");
    }
    if (!truckPlate.trim()) return toast.error("Enter your truck plate");
    setSaving(true);
    const op = upsertOperator({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim() || "Chennai",
      truckPlate: truckPlate.trim().toUpperCase(),
      truckType,
      capabilities: caps,
      status: "off_duty",
    });
    setTowAuth({ operatorId: op.id });
    setSaving(false);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">You're in!</h1>
        <p className="mt-2 text-body-sm text-muted-foreground max-w-xs">
          Your truck has been added to the SmartPark rescue network. Flip your
          status to <span className="font-semibold">On duty</span> to start
          receiving jobs.
        </p>
        <MobileButton
          fullWidth
          onClick={() => navigate("/tow/dispatch", { replace: true })}
          className="mt-8 max-w-xs"
        >
          Go to dispatch
        </MobileButton>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pt-safe pb-safe">
      <header className="flex items-center h-[60px] px-4 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Truck registration
        </h1>
      </header>

      <div className="px-5 py-4 flex-1 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-bold text-foreground">
              Step {step === "driver" ? "1" : "2"} of 2
            </p>
            <p className="text-caption text-muted-foreground">
              {step === "driver"
                ? "Tell us who's driving"
                : "Configure your truck & capabilities"}
            </p>
          </div>
        </div>

        {step === "driver" && (
          <div className="space-y-4">
            <Field label="Full name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="h-12 rounded-xl"
              />
            </Field>
            <Field label="Phone number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98xxx xxxxx"
                inputMode="tel"
                className="h-12 rounded-xl"
              />
            </Field>
            <Field label="Base city">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chennai"
                className="h-12 rounded-xl"
              />
            </Field>
            <MobileButton
              fullWidth
              onClick={() => {
                if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
                  return toast.error(
                    "Enter your name and a valid phone number",
                  );
                }
                setStep("truck");
              }}
            >
              Continue
            </MobileButton>
          </div>
        )}

        {step === "truck" && (
          <div className="space-y-4">
            <Field label="Truck plate">
              <Input
                value={truckPlate}
                onChange={(e) =>
                  setTruckPlate(e.target.value.toUpperCase().slice(0, 15))
                }
                placeholder="TN 09 AB 1234"
                className="h-12 rounded-xl uppercase"
              />
            </Field>
            <Field label="Truck type">
              <div className="grid grid-cols-2 gap-2">
                {TRUCK_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTruckType(t)}
                    className={`p-3 rounded-xl border text-body-sm font-semibold ${
                      truckType === t
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {TRUCK_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Capabilities">
              <div className="space-y-2">
                {[
                  { key: "flatbed", label: "Flatbed transport" },
                  { key: "wheelLift", label: "Wheel-lift towing" },
                  { key: "evSafe", label: "EV-safe (insulated)" },
                  { key: "heavyDuty", label: "Heavy-duty (>5T)" },
                  { key: "accidentRecovery", label: "Accident recovery" },
                ].map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <input
                      type="checkbox"
                      checked={caps[c.key as keyof typeof caps]}
                      onChange={(e) =>
                        setCaps({ ...caps, [c.key]: e.target.checked })
                      }
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="text-body-sm text-foreground flex-1">
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <MobileButton fullWidth loading={saving} onClick={submit}>
              Register truck
            </MobileButton>
          </div>
        )}
      </div>
    </div>
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

export default TowRegisterScreen;
