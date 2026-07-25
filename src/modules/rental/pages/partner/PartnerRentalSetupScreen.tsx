// Vendor-side: create or edit a parking rental listing.
// Routes: /partner/rentals/new  and  /partner/rentals/:id/edit

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  IndianRupee,
  Sparkles,
  Loader2,
  Info,
  Car,
  Bike,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import LocationPicker from "@/components/LocationPicker";
import {
  useCreateRentalListing,
  useRentalListing,
  useUpdateRentalListing,
} from "@/modules/rental/hooks";
import {
  PERIOD_LABEL,
  RENTAL_AMENITY_LABEL,
  SLOT_TYPE_LABEL,
  VEHICLE_LABEL,
  type RentalAmenity,
  type RentalListing,
  type RentalPeriod,
  type RentalPricing,
  type RentalSlotType,
  type RentalVehicleType,
} from "@/modules/rental/types";

interface FormState {
  title: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  slotType: RentalSlotType;
  vehicleTypes: RentalVehicleType[];
  totalSpots: number;
  availableSpots: number;
  pricing: RentalPricing;
  amenities: RentalAmenity[];
  minPeriod: RentalPeriod;
  contactPhone: string;
  status: RentalListing["status"];
}

const EMPTY: FormState = {
  title: "",
  description: "",
  address: "",
  lat: 13.0827,
  lng: 80.2707,
  slotType: "covered",
  vehicleTypes: ["car"],
  totalSpots: 1,
  availableSpots: 1,
  pricing: { taxPct: 18 },
  amenities: ["cctv"],
  minPeriod: "daily",
  contactPhone: "",
  status: "active",
};

const SLOT_TYPES: RentalSlotType[] = ["covered", "open", "basement", "stack"];
const VEHICLE_TYPES: RentalVehicleType[] = ["bike", "car", "commercial"];
const AMENITY_OPTIONS: RentalAmenity[] = [
  "24x7_access",
  "cctv",
  "security_guard",
  "gated",
  "covered",
  "ev_socket",
  "car_wash",
  "restroom",
];
const PERIODS: RentalPeriod[] = ["daily", "weekly", "monthly"];

const PartnerRentalSetupScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const user = useAuthStore((s) => s.user);
  const partnerId = user?.id ?? "partner-demo";

  const { data: existing, isLoading: loadingExisting } = useRentalListing(id);
  const create = useCreateRentalListing();
  const update = useUpdateRentalListing();

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        address: existing.address,
        lat: existing.lat,
        lng: existing.lng,
        slotType: existing.slotType,
        vehicleTypes: existing.vehicleTypes,
        totalSpots: existing.totalSpots,
        availableSpots: existing.availableSpots,
        pricing: existing.pricing,
        amenities: existing.amenities,
        minPeriod: existing.minPeriod,
        contactPhone: existing.contactPhone ?? "",
        status: existing.status,
      });
    }
  }, [existing, isEdit]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const canSave = useMemo(() => {
    if (form.title.trim().length < 3) return false;
    if (form.address.trim().length < 4) return false;
    if (form.totalSpots < 1) return false;
    if (form.vehicleTypes.length === 0) return false;
    // Whichever period is picked as minimum MUST have a price
    if (form.minPeriod === "daily" && !form.pricing.dailyRate) return false;
    if (form.minPeriod === "weekly" && !form.pricing.weeklyRate) return false;
    if (form.minPeriod === "monthly" && !form.pricing.monthlyRate) return false;
    return true;
  }, [form]);

  const toggleVehicle = (v: RentalVehicleType) =>
    patch({
      vehicleTypes: form.vehicleTypes.includes(v)
        ? form.vehicleTypes.filter((x) => x !== v)
        : [...form.vehicleTypes, v],
    });

  const toggleAmenity = (a: RentalAmenity) =>
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
        toast.success("Listing updated");
      } else {
        await create.mutateAsync({ ...form, partnerId, photos: [] });
        toast.success("Listing published");
      }
      navigate("/partner/rentals", { replace: true });
    } catch {
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
        <Warehouse className="w-5 h-5 text-primary" />
        <span className="text-body font-bold text-foreground">
          {isEdit ? "Edit Rental Listing" : "New Rental Listing"}
        </span>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Basics */}
        <Section title="Listing" icon={Info}>
          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Title
            </span>
            <Input
              className="mt-1.5"
              placeholder="e.g. Covered Reserved Spot — Anna Nagar Tower"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Description
            </span>
            <textarea
              className="mt-1.5 w-full min-h-[80px] rounded-xl border border-border bg-card px-3 py-2 text-body-sm resize-none"
              placeholder="Access hours, gate instructions, what makes this spot great…"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Contact phone (optional)
            </span>
            <Input
              className="mt-1.5"
              placeholder="+91 98765 43210"
              value={form.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
            />
          </label>
        </Section>

        {/* Location */}
        <Section title="Location" icon={MapPin}>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            address={form.address}
            onChange={(lat, lng, address) => patch({ lat, lng, address })}
          />
        </Section>

        {/* Slot config */}
        <Section title="Spots" icon={Info}>
          <div>
            <p className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Slot type
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {SLOT_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ slotType: s })}
                  className={`h-11 rounded-xl border-2 text-body-sm font-semibold ${
                    form.slotType === s
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {SLOT_TYPE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Vehicle types accepted
            </p>
            <div className="mt-1.5 flex gap-2">
              {VEHICLE_TYPES.map((v) => {
                const Icon = v === "bike" ? Bike : v === "car" ? Car : Truck;
                const active = form.vehicleTypes.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`flex-1 h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-caption font-semibold ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {VEHICLE_LABEL[v]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-muted-foreground">
                Total spots
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={form.totalSpots}
                onChange={(e) =>
                  patch({
                    totalSpots: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-caption text-muted-foreground">
                Available
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={form.availableSpots}
                onChange={(e) =>
                  patch({
                    availableSpots: Math.min(
                      form.totalSpots,
                      parseInt(e.target.value) || 0,
                    ),
                  })
                }
                className="mt-1"
              />
            </label>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing" icon={IndianRupee}>
          <p className="text-caption text-muted-foreground">
            Leave a rate empty to disable that duration. Vendor keeps 100% of
            rental — no per-booking commission (unlike hourly).
          </p>

          <div className="space-y-2">
            <PriceRow
              label="Daily rate (₹/day)"
              value={form.pricing.dailyRate}
              onChange={(v) =>
                patch({ pricing: { ...form.pricing, dailyRate: v } })
              }
            />
            <PriceRow
              label="Weekly rate (₹/week)"
              value={form.pricing.weeklyRate}
              onChange={(v) =>
                patch({ pricing: { ...form.pricing, weeklyRate: v } })
              }
            />
            <PriceRow
              label="Monthly rate (₹/month)"
              value={form.pricing.monthlyRate}
              onChange={(v) =>
                patch({ pricing: { ...form.pricing, monthlyRate: v } })
              }
            />
            <PriceRow
              label="Security deposit (refundable)"
              value={form.pricing.securityDeposit}
              onChange={(v) =>
                patch({ pricing: { ...form.pricing, securityDeposit: v } })
              }
            />
          </div>

          <div>
            <p className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Minimum contract
            </p>
            <div className="mt-1.5 flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => patch({ minPeriod: p })}
                  className={`flex-1 h-11 rounded-xl border-2 text-body-sm font-semibold ${
                    form.minPeriod === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
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
                  {RENTAL_AMENITY_LABEL[a]}
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
          {isEdit ? "Save changes" : "Publish listing"}
        </MobileButton>
      </div>
    </div>
  );
};

const PriceRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) => (
  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
    <span className="text-body-sm text-foreground">{label}</span>
    <div className="flex items-center gap-1">
      <span className="text-body-sm text-muted-foreground">₹</span>
      <Input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? undefined : parseFloat(v) || 0);
        }}
        className="w-24 h-9 text-right"
      />
    </div>
  </label>
);

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

export default PartnerRentalSetupScreen;
