// Screen: C-14 · Primitives: Availability, Reservation, Provider
//
// Consumer picks a specific charger at an EV station: connector, kW, start
// time, target (SOC / duration / full), and vehicle. Shows a live cost estimate
// then forwards to the shared Booking Summary screen.
//
// Route: /ev/stations/:id/reserve

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Plug,
  Loader2,
  Car,
  Clock,
  Battery,
  Timer,
  Sparkles,
  Info,
  ChevronRight,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useVehicles, type Vehicle } from "@/api/vehicles";
import {
  useEvStation,
  useEvVehicleProfiles,
} from "@/modules/ev/hooks";
import {
  CONNECTOR_LABEL,
  type ChargerStatus,
  type ConnectorType,
  type EvConnector,
  type EvReservationTarget,
  type EvStation,
  type EvVehicleProfile,
} from "@/modules/ev/types";

// ---------- Helpers ----------

interface GunOption {
  connector: EvConnector;
  gunIndex: number;
  status: ChargerStatus;
}

/** Flatten each connector into individual gun options with per-gun status. */
function flattenGuns(station: EvStation): GunOption[] {
  const rows: GunOption[] = [];
  station.connectors.forEach((c) => {
    const statuses: ChargerStatus[] = c.status ?? [];
    for (let i = 0; i < c.count; i++) {
      const s: ChargerStatus = statuses[i] ?? (i < c.available ? "available" : "in_use");
      rows.push({ connector: c, gunIndex: i, status: s });
    }
  });
  return rows;
}

const START_PRESETS = [
  { key: "now", label: "Now", minutes: 0 },
  { key: "15m", label: "+15 min", minutes: 15 },
  { key: "30m", label: "+30 min", minutes: 30 },
  { key: "1h", label: "+1 hr", minutes: 60 },
] as const;

type TargetMode = "soc" | "duration" | "full";

const EvChargerSelectionScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";

  const { data: station, isLoading } = useEvStation(id);
  const { data: vehicles = [] } = useVehicles();
  const { data: evProfiles = [] } = useEvVehicleProfiles();

  const guns = useMemo(() => (station ? flattenGuns(station) : []), [station]);

  // ── Selected charger ───────────────────────────────────────────────────
  const [selectedGunKey, setSelectedGunKey] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedGunKey && guns.length) {
      const first =
        guns.find((g) => g.status === "available") ?? guns[0];
      setSelectedGunKey(`${first.connector.id}#${first.gunIndex}`);
    }
  }, [guns, selectedGunKey]);

  const selectedGun = useMemo(
    () =>
      guns.find(
        (g) => `${g.connector.id}#${g.gunIndex}` === selectedGunKey,
      ) ?? null,
    [guns, selectedGunKey],
  );

  // ── Vehicle (compatible EVs only) ──────────────────────────────────────
  const evVehicleRows = useMemo(() => {
    return vehicles
      .map((v) => {
        const profile = evProfiles.find((p) => p.vehicleId === v.id);
        return profile ? { vehicle: v, profile } : null;
      })
      .filter(
        (row): row is { vehicle: Vehicle; profile: EvVehicleProfile } => !!row,
      );
  }, [vehicles, evProfiles]);

  const compatibleVehicles = useMemo(() => {
    if (!selectedGun) return evVehicleRows;
    return evVehicleRows.filter(
      (row) => row.profile.connectorType === selectedGun.connector.type,
    );
  }, [evVehicleRows, selectedGun]);

  const [vehicleId, setVehicleId] = useState<string | null>(null);
  useEffect(() => {
    if (
      compatibleVehicles.length &&
      !compatibleVehicles.some((r) => r.vehicle.id === vehicleId)
    ) {
      setVehicleId(compatibleVehicles[0].vehicle.id);
    }
  }, [compatibleVehicles, vehicleId]);

  const activeVehicleRow = compatibleVehicles.find((r) => r.vehicle.id === vehicleId);

  // ── Start time ─────────────────────────────────────────────────────────
  const [startPreset, setStartPreset] = useState<
    (typeof START_PRESETS)[number]["key"] | "custom"
  >("now");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 60_000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const startAt = useMemo(() => {
    if (startPreset === "custom") return new Date(customStart);
    const preset = START_PRESETS.find((p) => p.key === startPreset);
    return new Date(Date.now() + (preset?.minutes ?? 0) * 60_000);
  }, [startPreset, customStart]);

  // ── Target ─────────────────────────────────────────────────────────────
  const [targetMode, setTargetMode] = useState<TargetMode>("soc");
  const [targetSoc, setTargetSoc] = useState<number>(80);
  const [durationMin, setDurationMin] = useState<number>(45);

  const currentSocPct = activeVehicleRow?.profile.currentSocPct ?? 20;
  const batteryKwh = activeVehicleRow?.profile.batteryKwh ?? 40;

  const target: EvReservationTarget = useMemo(() => {
    switch (targetMode) {
      case "soc":
        return { kind: "soc", targetSocPct: targetSoc };
      case "duration":
        return { kind: "duration", minutes: durationMin };
      case "full":
        return { kind: "full" };
    }
  }, [targetMode, targetSoc, durationMin]);

  // ── Estimate ───────────────────────────────────────────────────────────
  const estimate = useMemo(() => {
    if (!station || !selectedGun) return null;
    const ratedKw = selectedGun.connector.powerKw;
    let kwh = 0;
    if (target.kind === "soc")
      kwh = Math.max(0, ((target.targetSocPct - currentSocPct) / 100) * batteryKwh);
    else if (target.kind === "full")
      kwh = Math.max(0, ((100 - currentSocPct) / 100) * batteryKwh);
    else kwh = (ratedKw * target.minutes) / 60;

    const pricePerKwh =
      station.pricing.unit === "per_kwh"
        ? station.pricing.amount
        : station.pricing.amount / ratedKw;
    const energy = kwh * pricePerKwh;
    const gstPct = station.pricing.taxPct ?? 18;
    const gst = (energy * gstPct) / 100;
    const idleFeePerMin = station.pricing.idleFeePerMinute ?? 0;
    const minutes = ratedKw > 0 ? (kwh / ratedKw) * 60 : 0;
    return {
      kwh,
      pricePerKwh,
      energy,
      gst,
      gstPct,
      idleFeePerMin,
      total: Math.round(energy + gst),
      minutes,
    };
  }, [station, selectedGun, target, currentSocPct, batteryKwh]);

  // ── Guard states ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-[100dvh] max-w-md mx-auto px-6 flex flex-col items-center justify-center">
        <Zap className="w-8 h-8 text-muted-foreground" />
        <p className="mt-3 text-body-sm text-muted-foreground">
          Station not found.
        </p>
        <MobileButton className="mt-4" onClick={() => navigate("/ev")}>
          Back to stations
        </MobileButton>
      </div>
    );
  }

  // No EV in garage → G-02 empty state.
  if (evVehicleRows.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-body font-bold text-foreground">
            Reserve charger
          </span>
        </header>
        <div className="flex-1 px-6 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-heading-sm text-foreground">
            Add your EV to continue
          </p>
          <p className="mt-2 text-body-sm text-muted-foreground max-w-xs">
            We need your car's connector type and battery capacity so we can
            hold a compatible charger and estimate cost.
          </p>
          <MobileButton
            className="mt-6 w-full"
            onClick={() =>
              navigate(`/add-vehicle?type=ev&next=/ev/stations/${station.id}/reserve`)
            }
          >
            Add EV vehicle
          </MobileButton>
        </div>
      </div>
    );
  }

  const canContinue = !!selectedGun && !!activeVehicleRow && estimate && estimate.kwh > 0;

  const handleContinue = () => {
    if (!canContinue || !selectedGun || !activeVehicleRow || !estimate) return;
    navigate("/booking-summary", {
      state: {
        kind: "ev-charging",
        stationId: station.id,
        stationName: station.name,
        stationAddress: station.address,
        stationLat: station.lat,
        stationLng: station.lng,
        chargerId: selectedGun.connector.id,
        connectorType: selectedGun.connector.type,
        powerKw: selectedGun.connector.powerKw,
        vehicleId: activeVehicleRow.vehicle.id,
        vehicleRegistration: activeVehicleRow.vehicle.registration_number,
        batteryKwh: activeVehicleRow.profile.batteryKwh,
        currentSocPct,
        target,
        estimate,
        requestedStart: startAt.toISOString(),
        userId,
      },
    });
  };

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
        <div className="min-w-0 flex-1">
          <p className="text-body font-bold text-foreground truncate">
            Reserve charger
          </p>
          <p className="text-caption text-muted-foreground truncate">
            {station.name}
          </p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Guns */}
        <Section title="Choose a charger" icon={Plug}>
          <div className="space-y-2">
            {guns.map((g) => {
              const key = `${g.connector.id}#${g.gunIndex}`;
              const active = selectedGunKey === key;
              const disabled = g.status !== "available";
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: disabled ? 1 : 0.98 }}
                  onClick={() => !disabled && setSelectedGunKey(key)}
                  disabled={disabled}
                  className={`w-full text-left rounded-2xl border-2 p-3 transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  } ${disabled ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-foreground truncate">
                          {CONNECTOR_LABEL[g.connector.type]}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          Gun #{g.gunIndex + 1} · {g.connector.powerKw} kW
                        </p>
                      </div>
                    </div>
                    <ChargerBadge status={g.status} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* Vehicle */}
        <Section title="Your EV" icon={Car}>
          {compatibleVehicles.length === 0 ? (
            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground">
                    No compatible EV in your garage
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    This charger uses {selectedGun ? CONNECTOR_LABEL[selectedGun.connector.type] : "an incompatible connector"}. Add an EV with the matching plug to continue.
                  </p>
                  <MobileButton
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() =>
                      navigate(
                        `/add-vehicle?type=ev&next=/ev/stations/${station.id}/reserve`,
                      )
                    }
                  >
                    Add EV vehicle
                  </MobileButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {compatibleVehicles.map((row) => {
                const active = vehicleId === row.vehicle.id;
                return (
                  <button
                    key={row.vehicle.id}
                    onClick={() => setVehicleId(row.vehicle.id)}
                    className={`w-full text-left rounded-2xl border-2 p-3 flex items-center gap-3 transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {row.vehicle.registration_number}
                      </p>
                      <p className="text-caption text-muted-foreground truncate">
                        {row.vehicle.nickname || row.vehicle.model || "EV"} ·{" "}
                        {CONNECTOR_LABEL[row.profile.connectorType]} ·{" "}
                        {row.profile.batteryKwh} kWh
                      </p>
                    </div>
                    <p className="text-caption font-bold text-primary shrink-0">
                      {row.profile.currentSocPct ?? 20}%
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* Start */}
        <Section title="When do you want to start?" icon={Clock}>
          <div className="flex flex-wrap gap-2">
            {START_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setStartPreset(p.key)}
                className={`px-3 h-9 rounded-full border text-body-sm font-semibold ${
                  startPreset === p.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setStartPreset("custom")}
              className={`px-3 h-9 rounded-full border text-body-sm font-semibold ${
                startPreset === "custom"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              Custom
            </button>
          </div>
          {startPreset === "custom" && (
            <Input
              type="datetime-local"
              className="mt-3"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          )}
          <p className="mt-2 text-caption text-muted-foreground">
            Arrive by{" "}
            <span className="font-bold text-foreground">
              {startAt.toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
            </span>{" "}
            · hold expires 30 min after start
          </p>
        </Section>

        {/* Target */}
        <Section title="How much to charge?" icon={Battery}>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "soc" as const, icon: Battery, label: "To SOC %" },
                { key: "duration" as const, icon: Timer, label: "Duration" },
                { key: "full" as const, icon: Sparkles, label: "Till full" },
              ]
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTargetMode(key)}
                className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 ${
                  targetMode === key
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-caption font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {targetMode === "soc" && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-caption text-muted-foreground">
                  Current {currentSocPct}% → Target
                </p>
                <p className="text-heading-sm text-primary">{targetSoc}%</p>
              </div>
              <input
                type="range"
                min={Math.max(currentSocPct + 5, 10)}
                max={100}
                step={5}
                value={targetSoc}
                onChange={(e) => setTargetSoc(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}
          {targetMode === "duration" && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-caption text-muted-foreground">
                  Duration
                </p>
                <p className="text-heading-sm text-primary">
                  {durationMin} min
                </p>
              </div>
              <input
                type="range"
                min={15}
                max={180}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          )}
          {targetMode === "full" && (
            <p className="mt-3 text-caption text-muted-foreground">
              We'll stop automatically at 100% (from {currentSocPct}%).
            </p>
          )}
        </Section>

        {/* Estimate */}
        {estimate && (
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
            <p className="text-caption font-bold text-primary uppercase tracking-wider">
              Cost estimate
            </p>
            <div className="mt-3 space-y-2">
              <Row
                label={`Energy · ${estimate.kwh.toFixed(1)} kWh × ₹${estimate.pricePerKwh.toFixed(1)}`}
                value={`₹${Math.round(estimate.energy)}`}
              />
              <Row
                label={`GST (${estimate.gstPct}%)`}
                value={`₹${Math.round(estimate.gst)}`}
              />
              {estimate.idleFeePerMin > 0 && (
                <Row
                  label={`Idle fee (after complete)`}
                  value={`₹${estimate.idleFeePerMin}/min`}
                  muted
                />
              )}
              <div className="pt-2 border-t border-primary/20 flex items-baseline justify-between">
                <span className="text-body font-bold text-foreground">
                  Total
                </span>
                <span className="text-heading-md text-primary">
                  ₹{estimate.total}
                </span>
              </div>
              <p className="text-caption text-muted-foreground text-right">
                ≈ {Math.max(1, Math.round(estimate.minutes))} min at{" "}
                {selectedGun?.connector.powerKw ?? 0} kW
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          disabled={!canContinue}
          onClick={handleContinue}
          className="gap-1.5"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
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
    {children}
  </section>
);

const Row = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between">
    <span className={`text-body-sm ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      {label}
    </span>
    <span className={`text-body-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

const ChargerBadge = ({ status }: { status: ChargerStatus }) => {
  const map: Record<ChargerStatus, { label: string; cls: string }> = {
    available: { label: "Free", cls: "bg-emerald-500/10 text-emerald-600" },
    in_use: { label: "In use", cls: "bg-amber-500/10 text-amber-600" },
    offline: { label: "Offline", cls: "bg-muted text-muted-foreground" },
    maintenance: {
      label: "Maintenance",
      cls: "bg-muted text-muted-foreground",
    },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-caption font-bold px-2 py-1 rounded-lg ${cls}`}>
      {label}
    </span>
  );
};

export default EvChargerSelectionScreen;
