// Consumer-side: browse nearby EV charging stations.
// Route: /ev

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  MapPin,
  Filter,
  Loader2,
  Star,
  Plug,
  Navigation,
} from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import BottomNav from "@/components/BottomNav";
import { useEvStations } from "@/modules/ev/hooks";
import {
  AMENITY_LABEL,
  CONNECTOR_LABEL,
  type ConnectorType,
  type EvAmenity,
  type EvSearchFilters,
} from "@/modules/ev/types";
import { formatKm } from "@/shared/lib/geo";

const ConsumerEvStationsScreen = () => {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [filters, setFilters] = useState<EvSearchFilters>({ onlyOpen: true });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 6000 })
      .then((p) =>
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      )
      .catch(() => setOrigin({ lat: 13.0827, lng: 80.2707 }));
  }, []);

  const { data: stations = [], isLoading } = useEvStations(
    filters,
    origin ?? undefined,
  );

  const totalAvailable = useMemo(
    () =>
      stations.reduce(
        (n, s) => n + s.connectors.reduce((m, c) => m + c.available, 0),
        0,
      ),
    [stations],
  );

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-[80px]">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">
            EV Charging
          </span>
        </div>
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className={`touch-target flex items-center justify-center rounded-lg ${filterOpen ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </header>

      {/* Summary */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-body-sm text-muted-foreground">
          {isLoading
            ? "Searching…"
            : `${stations.length} station${stations.length === 1 ? "" : "s"} · ${totalAvailable} guns free`}
        </p>
      </div>

      {/* Filter drawer */}
      {filterOpen && (
        <FilterPanel filters={filters} onChange={setFilters} />
      )}

      {/* Cards */}
      <div className="flex-1 px-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 text-body-sm text-muted-foreground">
            No stations match your filters.
          </div>
        ) : (
          stations.map((s) => (
            <motion.button
              key={s.id}
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/ev/${s.id}`)}
              className="w-full text-left rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {s.name}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {s.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-body-sm font-bold text-foreground">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {s.rating.toFixed(1)}
                  </div>
                  {typeof s.distanceKm === "number" && (
                    <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-0.5 justify-end">
                      <Navigation className="w-3 h-3" />
                      {formatKm(s.distanceKm)}
                    </p>
                  )}
                </div>
              </div>

              {/* Connectors mini */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.connectors.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className={`text-caption px-2 py-1 rounded-lg font-semibold ${
                      c.available > 0
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Plug className="w-3 h-3 inline mr-1" />
                    {c.available}/{c.count} · {c.powerKw}kW
                  </span>
                ))}
                {s.connectors.length > 3 && (
                  <span className="text-caption px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                    +{s.connectors.length - 3}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-caption text-muted-foreground">
                  {s.isOpen24x7
                    ? "Open 24×7"
                    : `${s.openTime}–${s.closeTime}`}
                </span>
                <span className="text-body-sm font-bold text-foreground">
                  ₹{s.pricing.amount}
                  <span className="text-caption text-muted-foreground font-normal ml-0.5">
                    /{s.pricing.unit === "per_kwh" ? "kWh" : "hr"}
                  </span>
                </span>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const FilterPanel = ({
  filters,
  onChange,
}: {
  filters: EvSearchFilters;
  onChange: (f: EvSearchFilters) => void;
}) => {
  const connectorOpts: ConnectorType[] = [
    "type2",
    "ccs",
    "chademo",
    "gbt",
    "bharat_ac_001",
    "bharat_dc_001",
  ];
  const amenityOpts: EvAmenity[] = ["restroom", "cafe", "wifi", "shade", "24x7"];

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-border bg-card p-3 space-y-3">
      <div>
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Connector
        </p>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={!filters.connectorType}
            onClick={() => onChange({ ...filters, connectorType: undefined })}
          >
            All
          </FilterChip>
          {connectorOpts.map((c) => (
            <FilterChip
              key={c}
              active={filters.connectorType === c}
              onClick={() => onChange({ ...filters, connectorType: c })}
            >
              {CONNECTOR_LABEL[c]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Min power (kW)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[undefined, 7, 22, 50, 100, 150].map((kw) => (
            <FilterChip
              key={String(kw)}
              active={filters.minPowerKw === kw}
              onClick={() => onChange({ ...filters, minPowerKw: kw })}
            >
              {kw ? `${kw}+ kW` : "Any"}
            </FilterChip>
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
              <FilterChip
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
                {AMENITY_LABEL[a]}
              </FilterChip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FilterChip = ({
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
    className={`px-3 h-8 rounded-full text-caption font-semibold border ${
      active
        ? "bg-primary/10 border-primary text-primary"
        : "bg-card border-border text-muted-foreground"
    }`}
  >
    {children}
  </button>
);

export default ConsumerEvStationsScreen;
