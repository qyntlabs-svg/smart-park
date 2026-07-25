// Screen: T-02 · Primitives: Availability, Reservation, Location
// Route: /tow/dispatch

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ToggleLeft,
  ToggleRight,
  Clock,
  MapPin,
  Car,
  Check,
  X,
  Loader2,
  Bell,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import TowLayout from "@/modules/tow/components/TowLayout";
import {
  getCurrentOperator,
  updateOperator,
  TOW_STATUS_LABEL,
  type TowOperator,
  type TowOperatorStatus,
} from "@/modules/tow/lib/tow";
import {
  SOS_SITUATION_EMOJI,
  SOS_SITUATION_LABEL,
} from "@/shared/lib/sos-store";
import {
  useAcceptSosRequest,
  useSosRequests,
} from "@/shared/lib/sos-hooks";
import { toast } from "sonner";
import { haversineKm } from "@/shared/lib/geo";

// Fix Leaflet default icons (same as ParkingMap).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const operatorIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#f97316;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(249,115,22,0.25);"></div>`,
  iconAnchor: [9, 9],
});

const sosIcon = (situation: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#ef4444;color:#fff;padding:6px 8px;border-radius:20px;font-size:16px;box-shadow:0 4px 12px rgba(239,68,68,0.5);border:2px solid #fff;">${situation}</div>`,
    iconAnchor: [22, 20],
  });

const TowDispatchScreen = () => {
  const navigate = useNavigate();
  const [op, setOp] = useState<TowOperator | null>(getCurrentOperator());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!op) navigate("/tow/login", { replace: true });
  }, [op, navigate]);

  // Only fetch when on duty; otherwise show placeholder.
  const { data: allRequests = [], isLoading, refetch } = useSosRequests({
    status: ["searching", "assigned"],
  });
  const acceptMutation = useAcceptSosRequest();

  const origin = op?.lat && op?.lng ? { lat: op.lat, lng: op.lng } : null;
  const RADIUS_KM = 20;

  const nearby = useMemo(() => {
    if (!origin) return [];
    return allRequests
      .filter((r) => r.status === "searching")
      .map((r) => ({
        ...r,
        distanceKm: haversineKm(origin, r.location),
      }))
      .filter((r) => r.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [allRequests, origin, tick]);

  const myActive = useMemo(
    () =>
      allRequests.filter(
        (r) =>
          r.assignedOperatorId === op?.id &&
          (r.status === "assigned" || r.status === "en_route" || r.status === "arrived"),
      ),
    [allRequests, op],
  );

  const toggleStatus = (next: TowOperatorStatus) => {
    if (!op) return;
    const updated = updateOperator(op.id, { status: next });
    if (updated) {
      setOp(updated);
      toast.success(`You are now ${TOW_STATUS_LABEL[next]}`);
    }
  };

  const accept = (id: string) => {
    if (!op) return;
    if (op.status !== "on_duty") {
      return toast.error("Flip status to On duty first");
    }
    acceptMutation.mutate(
      {
        id,
        operator: { id: op.id, name: op.name, plate: op.truckPlate },
      },
      {
        onSuccess: (res) => {
          if (!res) return toast.error("Job taken by another driver");
          toast.success("Job accepted — head over now");
          navigate(`/tow/jobs/${res.id}`);
        },
        onError: () => toast.error("Could not accept job"),
      },
    );
  };

  const decline = () => {
    toast.message("Skipped — request stays available for others");
    setTick((t) => t + 1);
  };

  if (!op) return null;
  const onDuty = op.status === "on_duty";

  return (
    <TowLayout title="Dispatch Queue">
      {/* Duty toggle */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              onDuty ? "bg-success/10" : "bg-muted"
            }`}
          >
            {onDuty ? (
              <ToggleRight className="w-6 h-6 text-success" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-bold text-foreground">
              {TOW_STATUS_LABEL[op.status]}
            </p>
            <p className="text-caption text-muted-foreground">
              {onDuty
                ? `Watching for jobs within ${RADIUS_KM} km`
                : "Flip on to start receiving jobs"}
            </p>
          </div>
          <button
            onClick={() =>
              toggleStatus(op.status === "on_duty" ? "off_duty" : "on_duty")
            }
            className={`h-10 px-4 rounded-xl text-body-sm font-semibold ${
              onDuty
                ? "bg-secondary text-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {onDuty ? "Go off duty" : "Go on duty"}
          </button>
        </div>
      </div>

      {/* Active job pill */}
      <AnimatePresence>
        {myActive.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-3"
          >
            <button
              onClick={() => navigate(`/tow/jobs/${myActive[0].id}`)}
              className="w-full p-3 rounded-xl bg-primary text-primary-foreground flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-body-sm font-bold">
                  Active job · {SOS_SITUATION_LABEL[myActive[0].situation]}
                </p>
                <p className="text-caption opacity-90 truncate">
                  {myActive[0].location.address}
                </p>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      {origin && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl overflow-hidden border border-border h-56">
            <MapContainer
              center={[origin.lat, origin.lng]}
              zoom={12}
              zoomControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Circle
                center={[origin.lat, origin.lng]}
                radius={RADIUS_KM * 1000}
                pathOptions={{
                  color: "#f97316",
                  weight: 1,
                  fillOpacity: 0.05,
                }}
              />
              <Marker position={[origin.lat, origin.lng]} icon={operatorIcon}>
                <Popup>You · {op.truckPlate}</Popup>
              </Marker>
              {nearby.map((r) => (
                <Marker
                  key={r.id}
                  position={[r.location.lat, r.location.lng]}
                  icon={sosIcon(SOS_SITUATION_EMOJI[r.situation])}
                >
                  <Popup>
                    <strong>{SOS_SITUATION_LABEL[r.situation]}</strong>
                    <br />
                    {r.location.address}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-bold text-foreground">
            Nearby SOS ({nearby.length})
          </h2>
          <button
            onClick={() => refetch()}
            className="touch-target text-muted-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading queue...
          </div>
        )}

        {!isLoading && !onDuty && (
          <div className="p-6 rounded-2xl border border-dashed border-border text-center">
            <Bell className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm font-semibold text-foreground mt-2">
              You're off duty
            </p>
            <p className="text-caption text-muted-foreground">
              Requests will appear here once you go on duty.
            </p>
          </div>
        )}

        {!isLoading && onDuty && nearby.length === 0 && (
          <div className="p-6 rounded-2xl border border-dashed border-border text-center">
            <p className="text-body-sm font-semibold text-foreground">
              No open SOS in your area
            </p>
            <p className="text-caption text-muted-foreground">
              We'll refresh every 3 seconds.
            </p>
          </div>
        )}

        {onDuty &&
          nearby.map((r) => (
            <motion.div
              key={r.id}
              layout
              className="p-4 rounded-2xl bg-card border border-border space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {SOS_SITUATION_EMOJI[r.situation]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground">
                    {SOS_SITUATION_LABEL[r.situation]}
                  </p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{r.location.address}</span>
                  </p>
                  {r.vehicleLabel && (
                    <p className="text-caption text-muted-foreground flex items-center gap-1">
                      <Car className="w-3 h-3" /> {r.vehicleLabel}
                    </p>
                  )}
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.max(
                      1,
                      Math.round(
                        (Date.now() - new Date(r.createdAt).getTime()) / 60000,
                      ),
                    )}{" "}
                    min ago · {r.distanceKm.toFixed(1)} km away
                  </p>
                </div>
              </div>

              {r.notes && (
                <p className="text-caption bg-secondary rounded-xl p-2 text-foreground">
                  “{r.notes}”
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={decline}
                  className="h-10 rounded-xl bg-secondary text-muted-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Skip
                </button>
                <button
                  disabled={acceptMutation.isPending}
                  onClick={() => accept(r.id)}
                  className="h-10 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            </motion.div>
          ))}
      </div>
    </TowLayout>
  );
};

export default TowDispatchScreen;
