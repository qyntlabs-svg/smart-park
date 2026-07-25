// Screen: C-18 · Primitives: Reservation, Identity
//
// Consumer arrives at the station and shows this QR code + 4-digit plug-in
// code to the charger operator. "I'm plugged in" transitions to the live
// session view (C-20).
//
// Route: /ev/reservation/:id/qr

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Navigation,
  PlugZap,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { Browser } from "@capacitor/browser";
import {
  useEvReservation,
  useEvStation,
  useSessionByReservation,
  useStartEvSession,
} from "@/modules/ev/hooks";
import { CONNECTOR_LABEL } from "@/modules/ev/types";

const EvBookingQrScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: reservation, isLoading } = useEvReservation(id);
  const { data: station } = useEvStation(reservation?.stationId);
  const { data: existingSession } = useSessionByReservation(reservation?.id);
  const startSession = useStartEvSession();

  const qrPayload = useMemo(() => {
    if (!reservation) return "";
    return JSON.stringify({
      kind: "ev-reservation",
      reservationId: reservation.id,
      plugInCode: reservation.plugInCode,
      chargerId: reservation.chargerId,
      station: reservation.stationId,
    });
  }, [reservation]);

  const holdExpiresAt = useMemo(() => {
    if (!reservation) return null;
    return new Date(
      new Date(reservation.requestedStart).getTime() +
        reservation.holdMinutes * 60_000,
    );
  }, [reservation]);

  if (isLoading || !reservation) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const openDirections = async () => {
    if (!station) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    try {
      await Browser.open({ url });
    } catch {
      window.open(url, "_blank");
    }
  };

  const handlePlugIn = async () => {
    try {
      if (existingSession && existingSession.status === "active") {
        navigate(`/ev/session/${existingSession.id}`, { replace: true });
        return;
      }
      const session = await startSession.mutateAsync(reservation.id);
      if (!session) {
        toast.error("Could not start session");
        return;
      }
      navigate(`/ev/session/${session.id}`, { replace: true });
    } catch {
      toast.error("Could not start session");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate("/home")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Reservation Confirmed
        </h1>
      </header>

      <div className="flex-1 px-6 pt-6 pb-6 flex flex-col items-center overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-success" />
        </motion.div>

        <p className="mt-3 text-heading-sm text-foreground">Charger held for you</p>
        <p className="mt-1 text-body-sm text-muted-foreground text-center max-w-xs">
          Show this QR (or type the 4-digit code) at the station to unlock the
          gun.
        </p>

        {/* QR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 p-6 bg-card border border-border rounded-3xl shadow-sm"
        >
          <QRCodeSVG value={qrPayload} size={200} level="H" includeMargin />
        </motion.div>

        {/* Plug-in code */}
        <div className="mt-6 w-full">
          <p className="text-caption text-muted-foreground text-center uppercase font-bold tracking-wider">
            Plug-in code
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            {reservation.plugInCode.split("").map((d, i) => (
              <div
                key={i}
                className="w-12 h-14 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-center"
              >
                <span className="text-heading-md text-primary">{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 w-full space-y-3">
          <DetailRow
            icon={Zap}
            label="Charger"
            value={
              station
                ? `${CONNECTOR_LABEL[reservation.connectorType]} · ${reservation.powerKw} kW`
                : "—"
            }
          />
          <DetailRow
            icon={MapPin}
            label="Station"
            value={station?.name ?? "—"}
          />
          <DetailRow
            icon={Clock}
            label="Arrive by"
            value={new Date(reservation.requestedStart).toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            })}
          />
          {holdExpiresAt && (
            <DetailRow
              icon={Clock}
              label="Hold expires"
              value={holdExpiresAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              muted
            />
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 w-full rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-caption font-bold text-primary uppercase tracking-wider">
            Show at station
          </p>
          <ol className="mt-2 space-y-1 text-body-sm text-foreground list-decimal list-inside">
            <li>Park in the reserved bay.</li>
            <li>Scan this QR or enter the plug-in code on the charger.</li>
            <li>Plug in and tap "I'm plugged in" below.</li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="mt-6 w-full space-y-3 pb-safe">
          <MobileButton
            fullWidth
            onClick={handlePlugIn}
            loading={startSession.isPending}
            className="gap-1.5"
          >
            <PlugZap className="w-4 h-4" />
            I'm plugged in — start session
          </MobileButton>
          <MobileButton
            fullWidth
            variant="outline"
            onClick={openDirections}
            className="gap-1.5"
          >
            <Navigation className="w-4 h-4" />
            Directions to station
          </MobileButton>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="flex items-center gap-2 text-body-sm text-muted-foreground">
      <Icon className="w-4 h-4" />
      {label}
    </span>
    <span
      className={`text-body-sm font-semibold ${muted ? "text-muted-foreground" : "text-foreground"}`}
    >
      {value}
    </span>
  </div>
);

export default EvBookingQrScreen;
