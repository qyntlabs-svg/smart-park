// Screen: C-41 · Primitives: Provider, Location, Reservation, Notification
//
// Big red button + situation picker. Auto-detects location via
// @capacitor/geolocation, previews cost + ETA before confirming, then routes
// into /sos/:id (C-42).
//
// Route: /sos

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Geolocation } from "@capacitor/geolocation";
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Loader2,
  Wrench,
  CircleDot,
  Truck,
  AlertTriangle,
  BatteryLow,
  Check,
  RefreshCw,
  Car,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useVehicles } from "@/api/vehicles";
import {
  useCreateSosRequest,
  useUserSosRequests,
} from "@/modules/consumer/sos/hooks";
import {
  SOS_SITUATION_DETAIL,
  SOS_SITUATION_LABEL,
  type SosSituation,
} from "@/modules/consumer/sos/types";
import { quoteSos } from "@/modules/consumer/sos/store";

const SITUATIONS: { id: SosSituation; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
  { id: "breakdown",     icon: Wrench,        tone: "text-primary" },
  { id: "flat_tyre",     icon: CircleDot,     tone: "text-primary" },
  { id: "tow",           icon: Truck,         tone: "text-primary" },
  { id: "accident",      icon: AlertTriangle, tone: "text-destructive" },
  { id: "out_of_charge", icon: BatteryLow,    tone: "text-primary" },
];

const SosHomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";
  const { data: vehicles } = useVehicles();
  const defaultVehicle = vehicles?.find((v) => v.is_default) ?? vehicles?.[0];
  const { data: recent = [] } = useUserSosRequests(userId);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  const [selected, setSelected] = useState<SosSituation | null>(null);
  const [notes, setNotes] = useState("");
  const create = useCreateSosRequest();

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLocation() {
    setLocLoading(true);
    setLocError(null);
    try {
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== "granted") {
        setOrigin({ lat: 13.0827, lng: 80.2707 });
        setLocLabel("Chennai (default)");
        setLocError("Location permission not granted — using city center.");
        return;
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setOrigin({ lat, lng });
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        const addr = data.address;
        const label =
          addr?.road ??
          addr?.suburb ??
          addr?.neighbourhood ??
          addr?.city ??
          "Your current location";
        setLocLabel(label);
      } catch {
        setLocLabel("Your current location");
      }
    } catch {
      setOrigin({ lat: 13.0827, lng: 80.2707 });
      setLocLabel("Chennai (default)");
      setLocError("Couldn't get precise location — using city center.");
    } finally {
      setLocLoading(false);
    }
  }

  const quote = useMemo(() => (selected ? quoteSos(selected) : null), [selected]);

  const canSubmit = !!selected && !!origin && !create.isPending;

  const submit = async () => {
    if (!selected || !origin) return;
    try {
      const req = await create.mutateAsync({
        userId,
        situation: selected,
        notes: notes.trim() || undefined,
        origin: { ...origin, label: locLabel ?? undefined },
        vehicleId: defaultVehicle?.id,
        vehicleRegistration: defaultVehicle?.registration_number,
      });
      toast.success("Help is on the way");
      navigate(`/sos/${req.id}`);
    } catch {
      toast.error("Could not create SOS request");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Get help
        </h1>
      </header>

      {/* Big red button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          document
            .getElementById("sos-picker")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-destructive to-red-700 p-6 shadow-xl shadow-destructive/30 text-primary-foreground text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-heading-md text-white leading-tight">
              I need help now
            </p>
            <p className="text-body-sm text-white/85 mt-0.5">
              Tap below to pick your situation
            </p>
          </div>
        </div>
      </motion.button>

      {/* Location banner */}
      <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-foreground truncate">
              {locLoading ? "Locating…" : (locLabel ?? "Unknown location")}
            </p>
            {locError && (
              <p className="text-caption text-warning">{locError}</p>
            )}
          </div>
        </div>
        <button
          onClick={fetchLocation}
          className="p-2 text-muted-foreground active:text-primary"
        >
          {locLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Situation picker */}
      <div id="sos-picker" className="mx-4 mt-4">
        <p className="text-body-sm font-bold text-foreground">
          What happened?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {SITUATIONS.map(({ id, icon: Icon, tone }) => {
            const active = selected === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      active ? "bg-primary/15" : "bg-secondary"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${active ? "text-primary" : tone}`}
                    />
                  </div>
                  {active && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="mt-2 text-body-sm font-bold text-foreground">
                  {SOS_SITUATION_LABEL[id]}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">
                  {SOS_SITUATION_DETAIL[id]}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Vehicle + notes */}
      {defaultVehicle && (
        <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-caption text-muted-foreground">Vehicle</p>
            <p className="text-body-sm font-bold text-foreground">
              {defaultVehicle.registration_number}
            </p>
          </div>
        </div>
      )}

      <div className="mx-4 mt-3">
        <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
          Notes (optional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything the operator should know?"
          className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-body-sm resize-none"
        />
      </div>

      {/* Quote preview */}
      <AnimatePresence>
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 p-4"
          >
            <p className="text-caption font-bold uppercase tracking-wider text-primary">
              Estimated
            </p>
            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-heading-md text-foreground">
                ₹{quote.cost}
                <span className="text-body-sm text-muted-foreground font-normal">
                  {" "}
                  · ETA {quote.etaMinutes}m
                </span>
              </p>
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              Final price may vary based on distance and severity.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent requests link */}
      {recent.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Recent
          </p>
          <button
            onClick={() => navigate(`/sos/${recent[0].id}`)}
            className="mt-2 w-full flex items-center justify-between p-3 rounded-2xl border border-border bg-card active:bg-secondary"
          >
            <div className="text-left">
              <p className="text-body-sm font-bold text-foreground">
                {SOS_SITUATION_LABEL[recent[0].situation]}
              </p>
              <p className="text-caption text-muted-foreground">
                {new Date(recent[0].createdAt).toLocaleString([], {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="text-caption font-bold text-primary">Open</span>
          </button>
        </div>
      )}

      {/* Sticky confirm */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        <MobileButton
          fullWidth
          disabled={!canSubmit}
          loading={create.isPending}
          onClick={submit}
          className="gap-1.5"
          variant={selected === "accident" ? "destructive" : "primary"}
        >
          <ShieldAlert className="w-4 h-4" />
          {selected
            ? `Confirm — ₹${quote?.cost}`
            : "Pick a situation"}
        </MobileButton>
      </div>
    </div>
  );
};

export default SosHomeScreen;
