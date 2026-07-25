// Screen: T-03 · Primitives: Reservation, Location, Notification
// Route: /tow/jobs/:id

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Car,
  Ban,
  CheckCircle2,
  PlayCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import TowLayout from "@/modules/tow/components/TowLayout";
import { getCurrentOperator } from "@/modules/tow/lib/tow";
import {
  SOS_SITUATION_EMOJI,
  SOS_SITUATION_LABEL,
  SOS_STATUS_LABEL,
} from "@/shared/lib/sos-store";
import {
  useCancelSosRequest,
  useSosRequest,
  useUpdateSosRequest,
} from "@/shared/lib/sos-hooks";
import { haversineKm } from "@/shared/lib/geo";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#f97316;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(249,115,22,0.25);"></div>`,
  iconAnchor: [9, 9],
});
const consumerIcon = L.divIcon({
  className: "",
  html: `<div style="background:#ef4444;color:#fff;padding:6px 8px;border-radius:20px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(239,68,68,0.45);border:2px solid #fff;">SOS</div>`,
  iconAnchor: [22, 20],
});

const TowJobDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const op = getCurrentOperator();
  const { data: req, isLoading } = useSosRequest(id);
  const updateMutation = useUpdateSosRequest();
  const cancelMutation = useCancelSosRequest();
  const [note, setNote] = useState("");

  const distanceKm = useMemo(() => {
    if (!op?.lat || !op?.lng || !req) return null;
    return haversineKm(
      { lat: op.lat, lng: op.lng },
      req.location,
    );
  }, [op, req]);

  const setStatus = (status: "en_route" | "arrived") => {
    if (!req) return;
    updateMutation.mutate(
      {
        id: req.id,
        patch: {
          status,
          etaMinutes:
            status === "en_route" && distanceKm
              ? Math.max(2, Math.round(distanceKm * 2.5))
              : req.etaMinutes,
        },
      },
      { onSuccess: () => toast.success(SOS_STATUS_LABEL[status]) },
    );
  };

  const cancel = () => {
    if (!req) return;
    if (!confirm("Cancel this job? Consumer will be notified.")) return;
    cancelMutation.mutate(
      { id: req.id, by: "operator", reason: "Operator cancelled" },
      {
        onSuccess: () => {
          toast.message("Job cancelled");
          navigate("/tow/dispatch", { replace: true });
        },
      },
    );
  };

  const saveNote = () => {
    if (!req || !note.trim()) return;
    updateMutation.mutate(
      { id: req.id, patch: { notes: note.trim() } },
      { onSuccess: () => toast.success("Note saved") },
    );
    setNote("");
  };

  if (isLoading || !op) {
    return (
      <TowLayout title="Job" showBack>
        <div className="p-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      </TowLayout>
    );
  }

  if (!req) {
    return (
      <TowLayout title="Job not found" showBack showNav={false}>
        <div className="p-10 text-center">
          <p className="text-body-sm text-muted-foreground">
            This SOS request no longer exists.
          </p>
        </div>
      </TowLayout>
    );
  }

  const done = req.status === "completed" || req.status === "cancelled";
  const opLatLng: [number, number] | null =
    op.lat && op.lng ? [op.lat, op.lng] : null;

  return (
    <TowLayout title="Active job" showBack>
      {/* Map */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl overflow-hidden border border-border h-64">
          <MapContainer
            center={[req.location.lat, req.location.lng]}
            zoom={13}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
              position={[req.location.lat, req.location.lng]}
              icon={consumerIcon}
            >
              <Popup>Customer · {SOS_SITUATION_LABEL[req.situation]}</Popup>
            </Marker>
            {opLatLng && (
              <>
                <Marker position={opLatLng} icon={truckIcon}>
                  <Popup>You · {op.truckPlate}</Popup>
                </Marker>
                <Polyline
                  positions={[opLatLng, [req.location.lat, req.location.lng]]}
                  pathOptions={{
                    color: "#f97316",
                    weight: 4,
                    dashArray: "6 8",
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Summary card */}
      <div className="px-4 py-4 space-y-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              {SOS_SITUATION_EMOJI[req.situation]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-bold text-foreground">
                {SOS_SITUATION_LABEL[req.situation]}
              </p>
              <p className="text-caption text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{" "}
                {new Date(req.createdAt).toLocaleTimeString()} ·{" "}
                {SOS_STATUS_LABEL[req.status]}
              </p>
              {distanceKm !== null && (
                <p className="text-caption text-muted-foreground">
                  {distanceKm.toFixed(1)} km · ETA ~
                  {Math.max(2, Math.round(distanceKm * 2.5))} min
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border grid gap-2 text-caption">
            {req.vehicleLabel && (
              <p className="text-foreground flex items-center gap-2">
                <Car className="w-3 h-3 text-muted-foreground" />{" "}
                {req.vehicleLabel}
              </p>
            )}
            <p className="text-foreground flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground" />
              {req.location.address}
            </p>
            <p className="text-foreground flex items-center gap-2">
              <Phone className="w-3 h-3 text-muted-foreground" />
              {req.userPhone}
              <a
                href={`tel:${req.userPhone.replace(/\s/g, "")}`}
                className="ml-auto text-primary font-semibold"
              >
                Call
              </a>
            </p>
          </div>
        </div>

        {/* Actions */}
        {!done && (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${req.location.lat},${req.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="h-11 rounded-xl bg-secondary text-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
            >
              <Navigation className="w-4 h-4" /> Google Maps
            </a>
            {req.status === "assigned" && (
              <button
                onClick={() => setStatus("en_route")}
                className="h-11 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
              >
                <PlayCircle className="w-4 h-4" /> On the way
              </button>
            )}
            {req.status === "en_route" && (
              <button
                onClick={() => setStatus("arrived")}
                className="h-11 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> I've arrived
              </button>
            )}
            {req.status === "arrived" && (
              <button
                onClick={() => navigate(`/tow/jobs/${req.id}/proof`)}
                className="h-11 rounded-xl bg-success text-white text-body-sm font-semibold flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Finish & proof
              </button>
            )}
          </div>
        )}

        {/* Situation notes */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-body-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Situation notes
          </p>
          {req.notes ? (
            <p className="mt-2 text-caption text-foreground bg-secondary p-2 rounded-lg">
              {req.notes}
            </p>
          ) : (
            <p className="mt-2 text-caption text-muted-foreground">
              No notes captured yet.
            </p>
          )}
          {!done && (
            <div className="mt-3 flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (e.g. car locked, waiting)"
                className="flex-1 h-10 rounded-xl bg-secondary px-3 text-body-sm"
              />
              <button
                onClick={saveNote}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {!done && (
          <button
            onClick={cancel}
            className="w-full h-11 rounded-xl border border-destructive/40 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1"
          >
            <Ban className="w-4 h-4" /> Cancel this job
          </button>
        )}
      </div>
    </TowLayout>
  );
};

export default TowJobDetailScreen;
