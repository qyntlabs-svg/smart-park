// Screen: C-42 · Primitives: Reservation, Location, Notification, Identity
//
// Live map (leaflet) showing truck marker converging to consumer origin.
// Driver identity + call button. Share trip link. Status timeline stepper.
//
// Route: /sos/:id

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Share2,
  Star,
  X,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useCancelSosRequest,
  useSosRequest,
  useTickSosLifecycle,
} from "@/modules/consumer/sos/hooks";
import {
  SOS_SITUATION_LABEL,
  SOS_STATUS_LABEL,
  type SosStatus,
} from "@/modules/consumer/sos/types";

// Ensure leaflet default icons resolve (project already sets this globally in
// ParkingMap, but keep it defensive in case this loads first).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;background:#111;border:3px solid #fff;
    border-radius:12px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 12px rgba(0,0,0,0.35);color:#FFC700;font-size:16px;
  ">⛟</div>`,
  iconAnchor: [16, 16],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;background:#ef4444;border:3px solid #fff;
    border-radius:50%;box-shadow:0 0 0 6px rgba(239,68,68,0.25);
  "></div>`,
  iconAnchor: [9, 9],
});

const TICK_MS = 4_000;

const SosLiveStatusScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: req, isLoading, isError } = useSosRequest(id);
  const tick = useTickSosLifecycle();
  const cancel = useCancelSosRequest();
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Poll lifecycle
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!id || !req) return;
    if (req.status === "completed" || req.status === "cancelled") return;
    const iv = window.setInterval(() => tickRef.current.mutate(id), TICK_MS);
    tickRef.current.mutate(id);
    return () => window.clearInterval(iv);
  }, [id, req?.status]);

  const shareLink = useMemo(
    () => (req ? `${window.location.origin}/#/sos/${req.id}` : ""),
    [req?.id],
  );

  const handleShare = async () => {
    if (!req) return;
    const shareData = {
      title: "My SOS trip",
      text: `Track my ${SOS_SITUATION_LABEL[req.situation]} assistance.`,
      url: shareLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareLink);
        toast.success("Trip link copied");
      }
    } catch {
      /* user dismissed */
    }
  };

  const handleCall = () => {
    if (!req?.driver?.phone) return;
    window.location.href = `tel:${req.driver.phone.replace(/\s+/g, "")}`;
  };

  const handleCancel = async () => {
    if (!req) return;
    try {
      await cancel.mutateAsync(req.id);
      setConfirmCancel(false);
      toast.success("SOS request cancelled");
      navigate("/home");
    } catch {
      toast.error("Could not cancel");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  if (isError || !req) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <SimpleHeader onBack={() => navigate("/sos")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <ShieldAlert className="w-12 h-12 text-destructive/40" />
          <p className="text-body font-bold text-foreground">
            SOS request not found
          </p>
          <MobileButton
            variant="outline"
            onClick={() => navigate("/sos")}
          >
            Back to SOS
          </MobileButton>
        </div>
      </div>
    );
  }

  const center: [number, number] = [req.origin.lat, req.origin.lng];
  const driverLoc = req.driver?.location;
  const isTerminal = req.status === "completed" || req.status === "cancelled";

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-32">
      <SimpleHeader
        onBack={() => navigate("/home")}
        title={SOS_SITUATION_LABEL[req.situation]}
        subtitle={SOS_STATUS_LABEL[req.status]}
      />

      {/* Map */}
      <div className="mx-4 mt-4 h-[220px] rounded-2xl overflow-hidden border border-border">
        <MapContainer
          center={center}
          zoom={15}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <Marker position={center} icon={userIcon}>
            <Popup>You</Popup>
          </Marker>
          {driverLoc && (
            <Marker
              position={[driverLoc.lat, driverLoc.lng]}
              icon={truckIcon}
            >
              <Popup>{req.driver?.name ?? "Operator"}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* ETA card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 p-4"
      >
        <p className="text-caption font-bold uppercase tracking-wider text-primary">
          {SOS_STATUS_LABEL[req.status]}
        </p>
        <p className="mt-1 text-heading-md text-foreground leading-tight">
          {req.status === "searching"
            ? "Finding an operator near you"
            : req.status === "assigned"
              ? "Operator on their way"
              : req.status === "en_route"
                ? `Arriving in ~${req.estimatedEtaMinutes}m`
                : req.status === "arrived"
                  ? "Operator is at your location"
                  : req.status === "completed"
                    ? `Completed · ₹${req.estimatedCost}`
                    : "Cancelled"}
        </p>
        <p className="text-body-sm text-muted-foreground mt-1">
          Estimated ₹{req.estimatedCost}
        </p>
      </motion.div>

      {/* Driver card */}
      {req.driver && (
        <div className="mx-4 mt-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-bold text-foreground">
                {req.driver.name}
              </p>
              <p className="text-caption text-muted-foreground truncate">
                {req.driver.vehicle}
              </p>
            </div>
            <div className="flex items-center gap-0.5 text-caption font-semibold text-warning">
              <Star className="w-3.5 h-3.5 fill-current" />
              {req.driver.rating.toFixed(1)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MobileButton
              variant="outline"
              className="gap-1.5"
              onClick={handleCall}
            >
              <Phone className="w-4 h-4" />
              Call
            </MobileButton>
            <MobileButton
              variant="secondary"
              className="gap-1.5"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              Share trip
            </MobileButton>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-body-sm font-bold text-foreground">Progress</p>
        <div className="mt-3">
          <StatusStepper current={req.status} />
        </div>
        {req.timeline.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {req.timeline
              .slice()
              .reverse()
              .map((e, i) => (
                <div key={i} className="flex gap-2 text-body-sm">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(e.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-foreground">
                    {e.note ?? SOS_STATUS_LABEL[e.status]}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Sticky action */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 pb-safe">
        {isTerminal ? (
          <MobileButton fullWidth onClick={() => navigate("/home")}>
            Back to home
          </MobileButton>
        ) : (
          <MobileButton
            fullWidth
            variant="outline"
            className="gap-1.5 border-destructive/40 text-destructive"
            onClick={() => setConfirmCancel(true)}
          >
            <X className="w-4 h-4" />
            Cancel request
          </MobileButton>
        )}
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel SOS?</DialogTitle>
            <DialogDescription>
              A cancellation fee may apply if the operator is already en route.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmCancel(false)}
            >
              Keep
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              loading={cancel.isPending}
              onClick={handleCancel}
            >
              Cancel
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Sub-components ----------

const SimpleHeader = ({
  onBack,
  title = "SOS",
  subtitle,
}: {
  onBack: () => void;
  title?: string;
  subtitle?: string;
}) => (
  <header className="flex items-center gap-2 h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
    <button
      onClick={onBack}
      className="touch-target flex items-center justify-center"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
    <ShieldAlert className="w-5 h-5 text-destructive" />
    <div className="min-w-0 flex-1">
      <p className="text-body font-bold text-foreground truncate">{title}</p>
      {subtitle && (
        <p className="text-caption text-muted-foreground truncate">
          {subtitle}
        </p>
      )}
    </div>
  </header>
);

const ORDER: SosStatus[] = ["searching", "assigned", "en_route", "arrived", "completed"];

const StatusStepper = ({ current }: { current: SosStatus }) => {
  const currentIdx = ORDER.indexOf(current);
  const cancelled = current === "cancelled";
  return (
    <div className="flex items-center">
      {ORDER.map((s, i) => {
        const done = !cancelled && i <= currentIdx;
        const active = !cancelled && i === currentIdx;
        return (
          <div key={s} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                } ${active ? "ring-2 ring-primary/30" : ""}`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-1 text-[9px] font-semibold text-center uppercase tracking-wider ${
                  done ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {SOS_STATUS_LABEL[s].split(" ")[0]}
              </span>
            </div>
            {i < ORDER.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full ${
                  i < currentIdx ? "bg-primary" : "bg-secondary"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SosLiveStatusScreen;
