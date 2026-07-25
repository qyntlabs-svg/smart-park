// Screen: W-06 · Primitives: Location, Notification
// Route: /worker/jobs/:id/nav

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Navigation as NavIcon,
  Phone,
  RefreshCcw,
} from "lucide-react";
import {
  getMechanicBookings,
  updateMechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkerAuth,
  getWorkerById,
  updateWorker,
} from "@/modules/worker/lib/workers";
import { haversineKm } from "@/shared/lib/geo";
import { pushNotification } from "@/shared/lib/notifications";
import { toast } from "sonner";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const workerIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
  iconAnchor: [9, 9],
});
const jobIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;color:#fff;padding:5px 8px;border-radius:16px;font-size:11px;font-weight:700;border:2px solid #fff;">JOB</div>`,
  iconAnchor: [22, 12],
});

const WorkerJobNavScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const [worker, setWorker] = useState(
    auth ? getWorkerById(auth.workerId) : null,
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!worker) navigate("/", { replace: true });
  }, [worker, navigate]);

  const booking = useMemo(
    () => getMechanicBookings().find((b) => b.id === id) ?? null,
    [id, tick],
  );

  // Simulate worker moving 5% closer every 4s so the route feels alive.
  useEffect(() => {
    if (!worker || !booking?.customerLocation) return;
    const i = setInterval(() => {
      const w = auth ? getWorkerById(auth.workerId) : null;
      if (!w || !booking.customerLocation) return;
      if (typeof w.lat !== "number" || typeof w.lng !== "number") return;
      const nextLat = w.lat + (booking.customerLocation.lat - w.lat) * 0.05;
      const nextLng = w.lng + (booking.customerLocation.lng - w.lng) * 0.05;
      const dist = haversineKm(
        { lat: nextLat, lng: nextLng },
        booking.customerLocation,
      );
      const updated = updateWorker(w.id, { lat: nextLat, lng: nextLng });
      if (updated) setWorker(updated);
      if (dist < 0.15 && booking.status === "on_the_way") {
        // auto-transition to arrived-ish state for demo
        updateMechanicBooking(booking.id, { status: "on_the_way" });
      }
      setTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(i);
  }, [auth, booking, worker]);

  if (!worker) return null;
  if (!booking || !booking.customerLocation) {
    return (
      <Shell title="Navigation">
        <div className="p-8 text-center">
          <MapPin className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="mt-2 text-body-sm text-muted-foreground">
            No location attached to this job.
          </p>
        </div>
      </Shell>
    );
  }

  const distanceKm =
    worker.lat && worker.lng
      ? haversineKm(
          { lat: worker.lat, lng: worker.lng },
          booking.customerLocation,
        )
      : null;
  const etaMin =
    distanceKm !== null ? Math.max(1, Math.round(distanceKm * 2.5)) : null;

  const pingCustomer = () => {
    pushNotification({
      audience: "consumer",
      audienceId: booking.customerPhone,
      title: "Worker en route",
      body: `${worker.name} is ${distanceKm?.toFixed(1)} km away · ETA ${etaMin} min`,
    });
    toast.success("Customer notified");
  };

  return (
    <Shell title="Navigation" onBack={() => navigate(-1)}>
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <MapContainer
            center={[booking.customerLocation.lat, booking.customerLocation.lng]}
            zoom={13}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
              position={[
                booking.customerLocation.lat,
                booking.customerLocation.lng,
              ]}
              icon={jobIcon}
            >
              <Popup>{booking.customerName}</Popup>
            </Marker>
            {worker.lat && worker.lng && (
              <>
                <Marker position={[worker.lat, worker.lng]} icon={workerIcon}>
                  <Popup>You</Popup>
                </Marker>
                <Polyline
                  positions={[
                    [worker.lat, worker.lng],
                    [
                      booking.customerLocation.lat,
                      booking.customerLocation.lng,
                    ],
                  ]}
                  pathOptions={{
                    color: "#3b82f6",
                    weight: 4,
                    dashArray: "8 6",
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>

        {/* Bottom sheet */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-card border-t border-border rounded-t-3xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <NavIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-foreground">
                {booking.customerName}
              </p>
              <p className="text-caption text-muted-foreground truncate">
                {booking.customerLocation.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-body-sm font-bold text-primary">
                {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "—"}
              </p>
              <p className="text-caption text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {etaMin !== null ? `${etaMin} min` : "—"}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.customerLocation.lat},${booking.customerLocation.lng}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
            >
              <NavIcon className="w-4 h-4" /> Maps
            </a>
            <button
              onClick={pingCustomer}
              className="h-10 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
            >
              <RefreshCcw className="w-4 h-4" /> Ping
            </button>
            <a
              href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}
              className="h-10 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
};

const Shell = ({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="touch-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          {title}
        </h1>
      </header>
      {children}
    </div>
  );
};

export default WorkerJobNavScreen;
