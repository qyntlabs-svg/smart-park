// Consumer-side: rental listing detail + book flow.
// Route: /rentals/:id

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Star,
  Loader2,
  Phone,
  Navigation,
  Sparkles,
  Clock,
  IndianRupee,
  Info,
  X,
  CheckCircle2,
  Car,
  Bike,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import {
  quoteRental,
  useRentalListing,
  useRequestRentalBooking,
} from "@/modules/rental/hooks";
import {
  PERIOD_LABEL,
  RENTAL_AMENITY_LABEL,
  SLOT_TYPE_LABEL,
  VEHICLE_LABEL,
  type RentalPeriod,
  type RentalVehicleType,
} from "@/modules/rental/types";

const ConsumerParkingRentalDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useRentalListing(id);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto px-6 flex flex-col items-center justify-center">
        <Warehouse className="w-8 h-8 text-muted-foreground" />
        <p className="mt-3 text-body-sm text-muted-foreground">
          Listing not found.
        </p>
        <MobileButton className="mt-4" onClick={() => navigate("/rentals")}>
          Back to rentals
        </MobileButton>
      </div>
    );
  }

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-28">
      {/* Header */}
      <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-body font-bold text-foreground truncate">
          {listing.title}
        </span>
      </header>

      {/* Hero */}
      <div className="px-4 py-4">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-border h-40 flex items-center justify-center">
          <Warehouse className="w-16 h-16 text-primary/50" />
        </div>

        <div className="mt-4">
          <p className="text-heading-md text-foreground">{listing.title}</p>
          <p className="text-body-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 shrink-0" />
            {listing.address}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-body-sm font-bold text-foreground">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {listing.rating.toFixed(1)}
              <span className="text-caption text-muted-foreground font-normal">
                ({listing.reviewCount})
              </span>
            </span>
            <span className="text-caption text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Min: {PERIOD_LABEL[listing.minPeriod]}
            </span>
          </div>
        </div>

        {listing.description && (
          <p className="mt-3 text-body-sm text-foreground leading-relaxed">
            {listing.description}
          </p>
        )}
      </div>

      {/* Attributes */}
      <Section title="What you get" icon={Info}>
        <div className="flex flex-wrap gap-1.5">
          <Chip>{SLOT_TYPE_LABEL[listing.slotType]}</Chip>
          {listing.vehicleTypes.map((v) => (
            <VehicleChip key={v} v={v} />
          ))}
          <Chip>
            {listing.availableSpots}/{listing.totalSpots} spots free
          </Chip>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing" icon={IndianRupee}>
        <div className="grid grid-cols-3 gap-2">
          <PriceCard label="Daily" amount={listing.pricing.dailyRate} suffix="/day" />
          <PriceCard label="Weekly" amount={listing.pricing.weeklyRate} suffix="/wk" />
          <PriceCard label="Monthly" amount={listing.pricing.monthlyRate} suffix="/mo" />
        </div>
        {listing.pricing.securityDeposit ? (
          <p className="text-caption text-muted-foreground mt-2">
            Refundable security deposit: ₹{listing.pricing.securityDeposit} · +
            {listing.pricing.taxPct ?? 18}% GST
          </p>
        ) : (
          <p className="text-caption text-muted-foreground mt-2">
            + {listing.pricing.taxPct ?? 18}% GST
          </p>
        )}
      </Section>

      {/* Amenities */}
      {listing.amenities.length > 0 && (
        <Section title="Amenities" icon={Sparkles}>
          <div className="flex flex-wrap gap-1.5">
            {listing.amenities.map((a) => (
              <span
                key={a}
                className="text-caption px-2.5 py-1 rounded-full bg-secondary text-foreground font-semibold"
              >
                {RENTAL_AMENITY_LABEL[a]}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe flex gap-2">
        <MobileButton
          variant="outline"
          onClick={openDirections}
          className="gap-1.5 px-3"
        >
          <Navigation className="w-4 h-4" />
        </MobileButton>
        {listing.contactPhone && (
          <MobileButton
            variant="outline"
            onClick={() => window.open(`tel:${listing.contactPhone}`)}
            className="gap-1.5 px-3"
          >
            <Phone className="w-4 h-4" />
          </MobileButton>
        )}
        <MobileButton
          className="flex-1"
          onClick={() => setSheetOpen(true)}
          disabled={listing.availableSpots === 0}
        >
          {listing.availableSpots === 0 ? "Fully booked" : "Rent this spot"}
        </MobileButton>
      </div>

      {/* Booking sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <BookingSheet
            listingId={listing.id}
            minPeriod={listing.minPeriod}
            pricing={listing.pricing}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const BookingSheet = ({
  listingId,
  minPeriod,
  pricing,
  onClose,
}: {
  listingId: string;
  minPeriod: RentalPeriod;
  pricing: {
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
    securityDeposit?: number;
    taxPct?: number;
  };
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const request = useRequestRentalBooking();

  const availablePeriods = useMemo(
    () =>
      (["daily", "weekly", "monthly"] as RentalPeriod[]).filter((p) => {
        if (p === "daily") return !!pricing.dailyRate;
        if (p === "weekly") return !!pricing.weeklyRate;
        return !!pricing.monthlyRate;
      }),
    [pricing],
  );

  const initialPeriod = availablePeriods.includes(minPeriod)
    ? minPeriod
    : availablePeriods[0];

  const [period, setPeriod] = useState<RentalPeriod>(initialPeriod);
  const [duration, setDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [reg, setReg] = useState("");

  const quote = useMemo(() => {
    return quoteRental(
      {
        id: "",
        partnerId: "",
        title: "",
        description: "",
        address: "",
        lat: 0,
        lng: 0,
        slotType: "covered",
        vehicleTypes: [],
        totalSpots: 0,
        availableSpots: 0,
        pricing,
        amenities: [],
        photos: [],
        minPeriod,
        status: "active",
        rating: 0,
        reviewCount: 0,
        createdAt: "",
        updatedAt: "",
      },
      period,
      duration,
    );
  }, [pricing, minPeriod, period, duration]);

  const canSubmit =
    name.trim().length > 1 && phone.trim().length >= 7 && duration > 0;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await request.mutateAsync({
        listingId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        vehicleRegistration: reg.trim() || undefined,
        period,
        duration,
        startDate: new Date(startDate).toISOString(),
      });
      toast.success("Rental request sent");
      onClose();
      navigate("/home");
    } catch {
      toast.error("Could not submit request");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md bg-card z-50 rounded-t-3xl pb-safe"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-body font-bold text-foreground">
            Rent this spot
          </p>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Period picker */}
          <div>
            <p className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Duration type
            </p>
            <div className="mt-1.5 flex gap-2">
              {availablePeriods.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 h-11 rounded-xl border-2 text-body-sm font-semibold ${
                    period === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-muted-foreground">
                # of {period === "daily" ? "days" : period === "weekly" ? "weeks" : "months"}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={duration}
                onChange={(e) =>
                  setDuration(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-caption text-muted-foreground">
                Start date
              </span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Your name
            </span>
            <Input
              className="mt-1.5"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Phone
            </span>
            <Input
              className="mt-1.5"
              placeholder="+91 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-caption text-muted-foreground font-semibold uppercase tracking-wider">
              Vehicle registration (optional)
            </span>
            <Input
              className="mt-1.5"
              placeholder="TN 09 AB 1234"
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
            />
          </label>

          {/* Quote breakdown */}
          <div className="rounded-2xl border border-border bg-secondary/40 p-3">
            <Row label={`Rent (${duration} × ${PERIOD_LABEL[period]})`} value={`₹${quote.amount}`} />
            <Row label={`GST (${pricing.taxPct ?? 18}%)`} value={`₹${quote.taxes}`} />
            {quote.deposit > 0 && (
              <Row label="Security deposit (refundable)" value={`₹${quote.deposit}`} />
            )}
            <div className="my-2 border-t border-border" />
            <Row label="Total" value={`₹${quote.totalAmount}`} bold />
          </div>

          <MobileButton
            fullWidth
            loading={request.isPending}
            disabled={!canSubmit}
            onClick={submit}
            className="gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Send rental request
          </MobileButton>
          <p className="text-caption text-muted-foreground text-center">
            The vendor will confirm within 24 hrs.
          </p>
        </div>
      </motion.div>
    </>
  );
};

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div className="flex items-baseline justify-between py-1">
    <span
      className={`text-body-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}
    >
      {label}
    </span>
    <span
      className={`text-body-sm ${bold ? "font-bold text-foreground" : "text-foreground"}`}
    >
      {value}
    </span>
  </div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption px-2 py-1 rounded-lg bg-primary/5 text-primary font-semibold">
    {children}
  </span>
);

const VehicleChip = ({ v }: { v: RentalVehicleType }) => {
  const Icon = v === "bike" ? Bike : v === "car" ? Car : Truck;
  return (
    <Chip>
      <Icon className="w-3 h-3 inline mr-1" />
      {VEHICLE_LABEL[v]}
    </Chip>
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
  <section className="px-4 mt-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-body-sm font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </section>
);

const PriceCard = ({
  label,
  amount,
  suffix,
}: {
  label: string;
  amount: number;
  suffix: string;
}) => (
  <div className="rounded-xl border border-border bg-card p-3 text-center">
    <p className="text-caption text-muted-foreground">{label}</p>
    <p className="mt-1 text-body-sm font-bold text-foreground">
      ₹{amount}
      <span className="text-caption font-normal text-muted-foreground">
        {suffix}
      </span>
    </p>
  </div>
);

export default ConsumerParkingRentalDetailScreen;
