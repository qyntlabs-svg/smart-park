// Vendor-side: create or edit an EV charging station.
// Routes: /partner/ev/new  and  /partner/ev/:id/edit

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Plug,
  IndianRupee,
  Clock,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import LocationPicker from "@/components/LocationPicker";
import {
  useCreateEvStation,
  useEvStation,
  useUpdateEvStation,
} from "@/modules/ev/hooks";
import {
  AMENITY_LABEL,
  CONNECTOR_LABEL,
  type ConnectorType,
  type EvAmenity,
  type EvConnector,
  type EvPricing,
  type EvStation,
} from "@/modules/ev/types";
import { makeId } from "@/shared/lib/storage";

// ---------- Local editor state ----------

interface FormState {
  name: string;
  address: string;
  lat: number;
  lng: number;
  isOpen24x7: boolean;
  openTime: string;
  closeTime: string;
  supportPhone: string;
  connectors: EvConnector[];
  pricing: EvPricing;
  amenities: EvAmenity[];
  status: EvStation["status"];
}

const EMPTY: FormState = {
  name: "",
  address: "",
  lat: 13.0827,
  lng: 80.2707,
  isOpen24x7: true,
  openTime: "06:00",
  closeTime: "23:00",
  supportPhone: "",
  connectors: [
    { id: makeId("c"), type: "type2", powerKw: 22, count: 2, available: 2 },
  ],
  pricing: { unit: "per_kwh", amount: 18, idleFeePerMinute: 0, taxPct: 18 },
  amenities: ["cctv"],
  status: "active",
};

const CONNECTOR_OPTIONS: ConnectorType[] = [
  "type2",
  "ccs",
  "chademo",
  "gbt",
  "bharat_ac_001",
  "bharat_dc_001",
];
const AMENITY_OPTIONS: EvAmenity[] = [
  "restroom",
  "cafe",
  "wifi",
  "shade",
  "24x7",
  "wheelchair",
  "cctv",
  "atm",
];

const PartnerEvStationSetupScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const user = useAuthStore((s) => s.user);
  const partnerId = user?.id ?? "partner-demo";

  const { data: existing, isLoading: loadingExisting } = useEvStation(id);
  const create = useCreateEvStation();
  const update = useUpdateEvStation();

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        name: existing.name,
        address: existing.address,
        lat: existing.lat,
        lng: existing.lng,
        isOpen24x7: existing.isOpen24x7,
        openTime: existing.openTime ?? "06:00",
        closeTime: existing.closeTime ?? "23:00",
        supportPhone: existing.supportPhone ?? "",
        connectors: existing.connectors,
        pricing: existing.pricing,
        amenities: existing.amenities,
        status: existing.status,
      });
    }
  }, [existing, isEdit]);

  const canSave = useMemo(
    () =>
      form.name.trim().length > 2 &&
      form.address.trim().length > 4 &&
      form.connectors.length > 0 &&
      form.connectors.every((c) => c.count > 0 && c.powerKw > 0) &&
      form.pricing.amount > 0,
    [form],
  );

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const addConnector = () =>
    patch({
      connectors: [
        ...form.connectors,
        { id: makeId("c"), type: "ccs", powerKw: 50, count: 1, available: 1 },
      ],
    });

  const updateConnector = (idx: number, p: Partial<EvConnector>) =>
    patch({
      connectors: form.connectors.map((c, i) =>
        i === idx ? { ...c, ...p, available: p.count ?? c.available } : c,
      ),
    });

  const removeConnector = (idx: number) =>
    patch({ connectors: form.connectors.filter((_, i) => i !== idx) });

  const toggleAmenity = (a: EvAmenity) =>
    patch({
      amenities: form.amenities.includes(a)
        ? form.amenities.filter((x) => x !== a)
        : [...form.amenities, a],
    });

  const submit = async () => {
    if (!canSave) return;
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, patch: form });
        toast.success("Station updated");
      } else {
        await create.mutateAsync({ ...form, partnerId, photos: [] });
        toast.success("Station published");
      }
      navigate("/partner/ev", { replace: true });
    } catch (e) {
      toast.error("Something went wrong");
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      {/* Header */}
      <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Zap className="w-5 h-5 text-primary" />
        <span className="text-body font-bold text-foreground">
          {isEdit ? "Edit EV Station" : "New EV Station"}
        </span>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Basics */}
        <Section title="Basics" icon={Info}>
          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Station Name
            </span>
            <Input
              className="mt-1.5"
              placeholder="e.g. Auto Doc Volt Hub — Anna Nagar"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Support Phone (optional)
            </span>
            <Input
              className="mt-1.5"
              placeholder="+91 98765 43210"
              value={form.supportPhone}
              onChange={(e) => patch({ supportPhone: e.target.value })}
            />
          </label>
        </Section>

        {/* Location */}
        <Section title="Location" icon={Info}>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            address={form.address}
            onChange={(lat, lng, address) => patch({ lat, lng, address })}
          />
        </Section>

        {/* Hours */}
        <Section title="Hours" icon={Clock}>
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-semibold text-foreground">
              Open 24×7
            </span>
            <button
              type="button"
              onClick={() => patch({ isOpen24x7: !form.isOpen24x7 })}
              className={`w-11 h-6 rounded-full transition-colors ${form.isOpen24x7 ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${form.isOpen24x7 ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          {!form.isOpen24x7 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
                  Open
                </span>
                <Input
                  type="time"
                  className="mt-1.5"
                  value={form.openTime}
                  onChange={(e) => patch({ openTime: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
                  Close
                </span>
                <Input
                  type="time"
                  className="mt-1.5"
                  value={form.closeTime}
                  onChange={(e) => patch({ closeTime: e.target.value })}
                />
              </label>
            </div>
          )}
        </Section>

        {/* Connectors */}
        <Section title="Connectors" icon={Plug}>
          <div className="space-y-3">
            {form.connectors.map((c, idx) => (
              <motion.div
                key={c.id}
                layout
                className="rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-caption font-bold text-muted-foreground">
                    Connector #{idx + 1}
                  </span>
                  {form.connectors.length > 1 && (
                    <button
                      onClick={() => removeConnector(idx)}
                      className="text-destructive p-1"
                      aria-label="Remove connector"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 block">
                    <span className="text-caption text-muted-foreground">
                      Type
                    </span>
                    <select
                      value={c.type}
                      onChange={(e) =>
                        updateConnector(idx, {
                          type: e.target.value as ConnectorType,
                        })
                      }
                      className="mt-1 w-full h-10 rounded-lg border border-border bg-background px-2 text-body-sm"
                    >
                      {CONNECTOR_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {CONNECTOR_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-caption text-muted-foreground">
                      Power (kW)
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={c.powerKw}
                      onChange={(e) =>
                        updateConnector(idx, {
                          powerKw: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-caption text-muted-foreground">
                      Guns
                    </span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={c.count}
                      onChange={(e) =>
                        updateConnector(idx, {
                          count: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                    />
                  </label>
                </div>
              </motion.div>
            ))}
            <MobileButton
              variant="outline"
              onClick={addConnector}
              className="w-full gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add another connector
            </MobileButton>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing" icon={IndianRupee}>
          <div className="flex gap-2">
            {(["per_kwh", "per_hour"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() =>
                  patch({ pricing: { ...form.pricing, unit: u } })
                }
                className={`flex-1 h-11 rounded-xl border-2 text-body-sm font-semibold ${
                  form.pricing.unit === u
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {u === "per_kwh" ? "₹ per kWh" : "₹ per hour"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="block">
              <span className="text-caption text-muted-foreground">
                Amount ({form.pricing.unit === "per_kwh" ? "₹/kWh" : "₹/hr"})
              </span>
              <Input
                type="number"
                inputMode="decimal"
                value={form.pricing.amount}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...form.pricing,
                      amount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-caption text-muted-foreground">
                Idle fee (₹/min)
              </span>
              <Input
                type="number"
                inputMode="decimal"
                value={form.pricing.idleFeePerMinute ?? 0}
                onChange={(e) =>
                  patch({
                    pricing: {
                      ...form.pricing,
                      idleFeePerMinute: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="mt-1"
              />
            </label>
          </div>
        </Section>

        {/* Amenities */}
        <Section title="Amenities" icon={Sparkles}>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => {
              const active = form.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 h-9 rounded-full border text-body-sm font-semibold ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {AMENITY_LABEL[a]}
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          loading={create.isPending || update.isPending}
          disabled={!canSave}
          onClick={submit}
        >
          {isEdit ? "Save changes" : "Publish station"}
        </MobileButton>
      </div>
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-body-sm font-bold text-foreground">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

export default PartnerEvStationSetupScreen;
