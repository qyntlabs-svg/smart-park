// Consumer-side: browse rental listings near me.
// Route: /rentals

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Warehouse,
  MapPin,
  Filter,
  Loader2,
  Star,
  Navigation,
  Car,
  Bike,
  Truck,
} from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import BottomNav from "@/components/BottomNav";
import { useRentalListings } from "@/modules/rental/hooks";
import {
  PERIOD_LABEL,
  RENTAL_AMENITY_LABEL,
  SLOT_TYPE_LABEL,
  VEHICLE_LABEL,
  type RentalAmenity,
  type RentalSearchFilters,
  type RentalSlotType,
  type RentalVehicleType,
} from "@/modules/rental/types";
import { formatKm } from "@/shared/lib/geo";

const ConsumerParkingRentalsScreen = () => {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [filters, setFilters] = useState<RentalSearchFilters>({
    onlyActive: true,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 6000 })
      .then((p) =>
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      )
      .catch(() => setOrigin({ lat: 13.0827, lng: 80.2707 }));
  }, []);

  const { data: listings = [], isLoading } = useRentalListings(
    filters,
    origin ?? undefined,
  );

  const totalSpots = useMemo(
    () => listings.reduce((n, l) => n + l.availableSpots, 0),
    [listings],
  );

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-[80px]">
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Warehouse className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">
            Parking Rentals
          </span>
        </div>
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className={`touch-target flex items-center justify-center rounded-lg ${filterOpen ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-body-sm text-muted-foreground">
          {isLoading
            ? "Searching…"
            : `${listings.length} listing${listings.length === 1 ? "" : "s"} · ${totalSpots} spots free`}
        </p>
      </div>

      {filterOpen && <FilterPanel filters={filters} onChange={setFilters} />}

      <div className="flex-1 px-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-body-sm text-muted-foreground">
            No rental listings match your filters.
          </div>
        ) : (
          listings.map((l) => (
            <motion.button
              key={l.id}
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/rentals/${l.id}`)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {l.title}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {l.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-body-sm font-bold text-foreground">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {l.rating.toFixed(1)}
                  </div>
                  {typeof l.distanceKm === "number" && (
                    <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-0.5 justify-end">
                      <Navigation className="w-3 h-3" />
                      {formatKm(l.distanceKm)}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag>{SLOT_TYPE_LABEL[l.slotType]}</Tag>
                {l.vehicleTypes.map((v) => (
                  <Tag key={v}>{VEHICLE_LABEL[v]}</Tag>
                ))}
                <Tag muted>Min: {PERIOD_LABEL[l.minPeriod]}</Tag>
              </div>

              {/* Cheapest headline price */}
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-caption text-muted-foreground">
                  {l.availableSpots}/{l.totalSpots} spots free
                </span>
                <HeadlinePrice pricing={l.pricing} />
              </div>
            </motion.button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const HeadlinePrice = ({ pricing }: { pricing: { dailyRate?: number; weeklyRate?: number; monthlyRate?: number } }) => {
  if (pricing.dailyRate) {
    return (
      <span className="text-body-sm font-bold text-foreground">
        from ₹{pricing.dailyRate}
        <span className="text-caption text-muted-foreground font-normal ml-0.5">
          /day
        </span>
      </span>
    );
  }
  if (pricing.weeklyRate) {
    return (
      <span className="text-body-sm font-bold text-foreground">
        from ₹{pricing.weeklyRate}
        <span className="text-caption text-muted-foreground font-normal ml-0.5">
          /week
        </span>
      </span>
    );
  }
  if (pricing.monthlyRate) {
    return (
      <span className="text-body-sm font-bold text-foreground">
        from ₹{pricing.monthlyRate}
        <span className="text-caption text-muted-foreground font-normal ml-0.5">
          /mo
        </span>
      </span>
    );
  }
  return null;
};

const Tag = ({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) => (
  <span
    className={`text-caption px-2 py-1 rounded-lg font-semibold ${
      muted ? "bg-muted text-muted-foreground" : "bg-primary/5 text-primary"
    }`}
  >
    {children}
  </span>
);

const FilterPanel = ({
  filters,
  onChange,
}: {
  filters: RentalSearchFilters;
  onChange: (f: RentalSearchFilters) => void;
}) => {
  const vehicleOpts: RentalVehicleType[] = ["bike", "car", "commercial"];
  const slotOpts: RentalSlotType[] = ["covered", "open", "basement", "stack"];
  const amenityOpts: RentalAmenity[] = [
    "24x7_access",
    "cctv",
    "security_guard",
    "gated",
    "covered",
    "ev_socket",
  ];

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-border bg-card p-3 space-y-3">
      <div>
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Vehicle
        </p>
        <div className="flex gap-1.5">
          <Chip
            active={!filters.vehicleType}
            onClick={() => onChange({ ...filters, vehicleType: undefined })}
          >
            Any
          </Chip>
          {vehicleOpts.map((v) => {
            const Icon = v === "bike" ? Bike : v === "car" ? Car : Truck;
            return (
              <Chip
                key={v}
                active={filters.vehicleType === v}
                onClick={() => onChange({ ...filters, vehicleType: v })}
              >
                <Icon className="w-3.5 h-3.5" />
                {VEHICLE_LABEL[v]}
              </Chip>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Slot type
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={!filters.slotType}
            onClick={() => onChange({ ...filters, slotType: undefined })}
          >
            Any
          </Chip>
          {slotOpts.map((s) => (
            <Chip
              key={s}
              active={filters.slotType === s}
              onClick={() => onChange({ ...filters, slotType: s })}
            >
              {SLOT_TYPE_LABEL[s]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Amenities
        </p>
        <div className="flex flex-wrap gap-1.5">
          {amenityOpts.map((a) => {
            const active = filters.amenities?.includes(a) ?? false;
            return (
              <Chip
                key={a}
                active={active}
                onClick={() =>
                  onChange({
                    ...filters,
                    amenities: active
                      ? filters.amenities?.filter((x) => x !== a)
                      : [...(filters.amenities ?? []), a],
                  })
                }
              >
                {RENTAL_AMENITY_LABEL[a]}
              </Chip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 px-3 h-8 rounded-full text-caption font-semibold border ${
      active
        ? "bg-primary/10 border-primary text-primary"
        : "bg-card border-border text-muted-foreground"
    }`}
  >
    {children}
  </button>
);

export default ConsumerParkingRentalsScreen;
