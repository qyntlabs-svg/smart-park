// Screen: M-11 · Primitives: Reservation, Provider, Location
// Route: /mechanic/dispatch

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Bike,
  Clock,
  Loader2,
  MapPin,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMechanicShop,
  getShopBookings,
  updateMechanicBooking,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkersForShop,
  type MechanicWorker,
} from "@/modules/worker/lib/workers";
import { haversineKm } from "@/shared/lib/geo";
import { pushNotification } from "@/shared/lib/notifications";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const shopIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#1a1a2e;border:3px solid #FFC700;border-radius:4px;"></div>`,
  iconAnchor: [9, 9],
});
const workerIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>`,
  iconAnchor: [7, 7],
});
const jobIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;color:#fff;padding:4px 6px;border-radius:16px;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.4);">JOB</div>`,
  iconAnchor: [22, 12],
});

const inferJobType = (b: MechanicBooking) =>
  b.jobType || (b.serviceType === "doorstep" ? "mobile" : "in_shop");

const MechanicDispatchScreen = () => {
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const [tick, setTick] = useState(0);
  const [selectedJob, setSelectedJob] = useState<MechanicBooking | null>(null);

  useEffect(() => {
    if (!shop) navigate("/mechanic/login", { replace: true });
  }, [shop, navigate]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(i);
  }, []);

  const jobs = useMemo(() => {
    if (!shop) return [];
    return getShopBookings(shop.id).filter(
      (b) =>
        inferJobType(b) === "mobile" &&
        (b.status === "searching" ||
          b.status === "pending" ||
          b.status === "assigned"),
    );
  }, [shop, tick]);

  const workers = useMemo(() => {
    if (!shop) return [];
    return getWorkersForShop(shop.id).filter((w) => w.status === "approved");
  }, [shop, tick]);

  if (!shop) return null;

  const assign = (job: MechanicBooking, worker: MechanicWorker) => {
    updateMechanicBooking(job.id, {
      status: "assigned",
      workerId: worker.id,
      workerName: worker.name,
      contactRevealed: true,
    });
    pushNotification({
      audience: "worker",
      audienceId: worker.id,
      title: "New job assigned to you",
      body: `${job.service} · ${job.customerName}`,
    });
    setSelectedJob(null);
    toast.success(`Assigned to ${worker.name}`);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Mobile Job Dispatch
        </h1>
      </header>

      {/* Map */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl overflow-hidden border border-border h-64">
          <MapContainer
            center={[shop.lat, shop.lng]}
            zoom={12}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[shop.lat, shop.lng]}
              radius={12000}
              pathOptions={{
                color: "#FFC700",
                weight: 1,
                fillOpacity: 0.05,
              }}
            />
            <Marker position={[shop.lat, shop.lng]} icon={shopIcon}>
              <Popup>{shop.shopName}</Popup>
            </Marker>
            {workers.map((w) =>
              w.lat && w.lng ? (
                <Marker
                  key={w.id}
                  position={[w.lat, w.lng]}
                  icon={workerIcon}
                >
                  <Popup>
                    {w.name} · {w.status}
                  </Popup>
                </Marker>
              ) : null,
            )}
            {jobs.map((j) =>
              j.customerLocation ? (
                <Marker
                  key={j.id}
                  position={[j.customerLocation.lat, j.customerLocation.lng]}
                  icon={jobIcon}
                >
                  <Popup>
                    <strong>{j.service}</strong>
                    <br />
                    {j.customerName}
                  </Popup>
                </Marker>
              ) : null,
            )}
            {selectedJob?.customerLocation && (
              <Polyline
                positions={[
                  [shop.lat, shop.lng],
                  [
                    selectedJob.customerLocation.lat,
                    selectedJob.customerLocation.lng,
                  ],
                ]}
                pathOptions={{
                  color: "#f59e0b",
                  weight: 3,
                  dashArray: "6 6",
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Open jobs" value={jobs.length} />
          <Stat label="Workers" value={workers.length} />
          <Stat
            label="Assigned"
            value={jobs.filter((j) => j.status === "assigned").length}
          />
        </div>

        <p className="text-body font-bold text-foreground">Incoming requests</p>

        {jobs.length === 0 && (
          <div className="p-6 rounded-2xl border border-dashed border-border text-center">
            <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin" />
            <p className="text-body-sm font-semibold text-foreground mt-2">
              Waiting for jobs
            </p>
            <p className="text-caption text-muted-foreground">
              Auto-refresh every 3s.
            </p>
          </div>
        )}

        {jobs.map((j) => {
          const distKm = j.customerLocation
            ? haversineKm(
                { lat: shop.lat, lng: shop.lng },
                { lat: j.customerLocation.lat, lng: j.customerLocation.lng },
              )
            : null;
          const nearestWorkers = j.customerLocation
            ? [...workers]
                .filter((w) => w.lat && w.lng)
                .sort(
                  (a, b) =>
                    haversineKm(
                      { lat: a.lat!, lng: a.lng! },
                      {
                        lat: j.customerLocation!.lat,
                        lng: j.customerLocation!.lng,
                      },
                    ) -
                    haversineKm(
                      { lat: b.lat!, lng: b.lng! },
                      {
                        lat: j.customerLocation!.lat,
                        lng: j.customerLocation!.lng,
                      },
                    ),
                )
            : workers;
          const open = selectedJob?.id === j.id;
          return (
            <div
              key={j.id}
              className={`rounded-2xl border ${open ? "border-primary" : "border-border"} bg-card`}
            >
              <button
                onClick={() => setSelectedJob(open ? null : j)}
                className="w-full p-4 text-left flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bike className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground">
                    {j.service}
                  </p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> {j.customerName}
                  </p>
                  {j.customerLocation && (
                    <p className="text-caption text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5" />
                      <span className="truncate">
                        {j.customerLocation.address}
                      </span>
                      {distKm !== null && (
                        <span className="ml-1 shrink-0">
                          · {distKm.toFixed(1)} km
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-bold text-primary">
                    ₹{j.price}
                  </p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.max(
                      1,
                      Math.round(
                        (Date.now() - new Date(j.date).getTime()) / 60000,
                      ),
                    )}{" "}
                    m
                  </p>
                </div>
              </button>

              {open && (
                <div className="border-t border-border p-4 space-y-2">
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> Nearest workers
                  </p>
                  {nearestWorkers.length === 0 ? (
                    <p className="text-caption text-muted-foreground">
                      No approved workers online. Invite from Workers page.
                    </p>
                  ) : (
                    nearestWorkers.slice(0, 4).map((w) => {
                      const wDist =
                        j.customerLocation && w.lat && w.lng
                          ? haversineKm(
                              { lat: w.lat, lng: w.lng },
                              {
                                lat: j.customerLocation.lat,
                                lng: j.customerLocation.lng,
                              },
                            )
                          : null;
                      return (
                        <button
                          key={w.id}
                          onClick={() => assign(j, w)}
                          className="w-full flex items-center gap-2 p-3 rounded-xl bg-secondary text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-body-sm font-semibold text-foreground">
                              {w.name}
                            </p>
                            <p className="text-caption text-muted-foreground">
                              {w.phone}
                              {wDist !== null &&
                                ` · ${wDist.toFixed(1)} km to job`}
                            </p>
                          </div>
                          <Zap className="w-4 h-4 text-primary" />
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="p-3 rounded-xl bg-card border border-border text-center">
    <p className="text-body-sm font-bold text-foreground">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

export default MechanicDispatchScreen;
