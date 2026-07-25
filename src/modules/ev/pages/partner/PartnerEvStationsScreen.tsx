// Screen: V-13/V-14 · Primitives: Provider, Availability, Reservation, Notification
//
// Vendor-side dashboard for EV stations. Extends the Phase-0 scope:
//  - Per-charger status toggle (Available / In-Use / Offline / Maintenance)
//  - Live sessions on each station (real-time kW, kWh, force-stop)
//  - Confirm dialog when taking a charger offline while a confirmed reservation
//    is on it — the affected consumer is notified via shared/notifications.
//
// Route: /partner/ev

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Zap,
  MapPin,
  Loader2,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  Activity,
  StopCircle,
  Wrench,
  PowerOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import {
  useDeleteEvStation,
  useEndEvSession,
  useEvStationsByPartner,
  useSetChargerStatus,
  useStationEvSessions,
  useTickTelemetry,
  useToggleEvStationStatus,
} from "@/modules/ev/hooks";
import {
  CHARGER_STATUS_LABEL,
  CONNECTOR_LABEL,
  type ChargerStatus,
  type EvConnector,
  type EvStation,
} from "@/modules/ev/types";
import { getReservationsForStation } from "@/modules/ev/store";

interface OfflineDialogState {
  stationId: string;
  connectorId: string;
  gunIndex: number;
  affectedReservationIds: string[];
  targetStatus: Exclude<ChargerStatus, "available" | "in_use">;
}

const PartnerEvStationsScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const partnerId = user?.id ?? "partner-demo";

  const { data: stations = [], isLoading } = useEvStationsByPartner(partnerId);
  const toggle = useToggleEvStationStatus();
  const remove = useDeleteEvStation();
  const setStatus = useSetChargerStatus();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [offlineDialog, setOfflineDialog] =
    useState<OfflineDialogState | null>(null);

  const activeCount = useMemo(
    () => stations.filter((s) => s.status === "active").length,
    [stations],
  );

  const onToggleStation = async (id: string) => {
    await toggle.mutateAsync(id);
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;
    await remove.mutateAsync(id);
    toast.success("Station removed");
  };

  const requestChargerStatusChange = async (
    stationId: string,
    connectorId: string,
    gunIndex: number,
    nextStatus: ChargerStatus,
  ) => {
    if (nextStatus === "offline" || nextStatus === "maintenance") {
      // Check whether a confirmed reservation targets this exact gun.
      const affected = (await getReservationsForStation(stationId)).filter(
        (r) =>
          r.chargerId === connectorId &&
          (r.status === "confirmed" || r.status === "requested"),
      );
      if (affected.length > 0) {
        setOfflineDialog({
          stationId,
          connectorId,
          gunIndex,
          affectedReservationIds: affected.map((a) => a.id),
          targetStatus: nextStatus,
        });
        return;
      }
    }
    try {
      await setStatus.mutateAsync({
        stationId,
        connectorId,
        gunIndex,
        status: nextStatus,
      });
      toast.success(`Charger marked ${CHARGER_STATUS_LABEL[nextStatus].toLowerCase()}`);
    } catch {
      toast.error("Could not update charger");
    }
  };

  const confirmOfflineChange = async () => {
    if (!offlineDialog) return;
    try {
      await setStatus.mutateAsync({
        stationId: offlineDialog.stationId,
        connectorId: offlineDialog.connectorId,
        gunIndex: offlineDialog.gunIndex,
        status: offlineDialog.targetStatus,
      });
      toast.success(
        `${offlineDialog.affectedReservationIds.length} customer(s) notified`,
      );
    } catch {
      toast.error("Could not update charger");
    } finally {
      setOfflineDialog(null);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
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
        <MobileButton
          size="sm"
          onClick={() => navigate("/partner/ev/new")}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
        </MobileButton>
      </header>

      {/* Summary strip */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-caption text-muted-foreground">Total stations</p>
          <p className="text-heading-md text-foreground mt-1">
            {stations.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-caption text-muted-foreground">Active</p>
          <p className="text-heading-md text-primary mt-1">{activeCount}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : stations.length === 0 ? (
          <EmptyState onCreate={() => navigate("/partner/ev/new")} />
        ) : (
          stations.map((s) => (
            <StationCard
              key={s.id}
              station={s}
              expanded={expandedId === s.id}
              onExpand={() =>
                setExpandedId((prev) => (prev === s.id ? null : s.id))
              }
              onEdit={() => navigate(`/partner/ev/${s.id}/edit`)}
              onDelete={() => onDelete(s.id, s.name)}
              onToggleStation={() => onToggleStation(s.id)}
              onChargerStatus={(connectorId, gunIndex, nextStatus) =>
                requestChargerStatusChange(
                  s.id,
                  connectorId,
                  gunIndex,
                  nextStatus,
                )
              }
            />
          ))
        )}
      </div>

      {/* Offline confirm dialog */}
      <Dialog
        open={!!offlineDialog}
        onOpenChange={(open) => !open && setOfflineDialog(null)}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Take charger offline?</DialogTitle>
            <DialogDescription>
              {offlineDialog?.affectedReservationIds.length ?? 0} confirmed
              reservation(s) are on this gun. They will be marked{" "}
              <span className="font-bold text-warning">at risk</span> and the
              consumer(s) will be notified immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <MobileButton
              variant="outline"
              className="flex-1"
              onClick={() => setOfflineDialog(null)}
            >
              Cancel
            </MobileButton>
            <MobileButton
              variant="destructive"
              className="flex-1"
              onClick={confirmOfflineChange}
              loading={setStatus.isPending}
            >
              Take offline
            </MobileButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- Station card ----------

const StationCard = ({
  station,
  expanded,
  onExpand,
  onEdit,
  onDelete,
  onToggleStation,
  onChargerStatus,
}: {
  station: EvStation;
  expanded: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStation: () => void;
  onChargerStatus: (
    connectorId: string,
    gunIndex: number,
    status: ChargerStatus,
  ) => void;
}) => {
  return (
    <motion.div
      layout
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button onClick={onExpand} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-bold text-foreground truncate">
              {station.name}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {station.address}
            </p>
          </div>
          <StationStatusPill status={station.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {station.connectors.map((c) => (
            <span
              key={c.id}
              className="text-caption px-2 py-1 rounded-lg bg-primary/5 text-primary font-semibold"
            >
              {c.count}× {CONNECTOR_LABEL[c.type]} · {c.powerKw}kW
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-caption text-muted-foreground">Price</p>
          <p className="text-body-sm font-bold text-foreground">
            ₹{station.pricing.amount}
            <span className="text-caption text-muted-foreground font-normal ml-0.5">
              /{station.pricing.unit === "per_kwh" ? "kWh" : "hr"}
            </span>
          </p>
        </div>
      </button>

      {/* Expanded: per-charger status + live sessions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-secondary/40"
          >
            <div className="p-4 space-y-4">
              {station.connectors.map((c) => (
                <ConnectorPanel
                  key={c.id}
                  connector={c}
                  onStatus={(gunIndex, status) =>
                    onChargerStatus(c.id, gunIndex, status)
                  }
                />
              ))}

              <LiveSessionsPanel stationId={station.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="border-t border-border flex divide-x divide-border">
        <button
          onClick={onEdit}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-foreground active:bg-secondary"
        >
          <Pencil className="w-4 h-4" /> Edit
        </button>
        <button
          onClick={onToggleStation}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-foreground active:bg-secondary"
        >
          {station.status === "active" ? (
            <>
              <PauseCircle className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" /> Activate
            </>
          )}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-3 flex items-center justify-center gap-1.5 text-body-sm font-semibold text-destructive active:bg-secondary"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </motion.div>
  );
};

const ConnectorPanel = ({
  connector,
  onStatus,
}: {
  connector: EvConnector;
  onStatus: (gunIndex: number, status: ChargerStatus) => void;
}) => {
  const statuses: ChargerStatus[] = useMemo(() => {
    if (connector.status && connector.status.length === connector.count) {
      return connector.status;
    }
    const arr: ChargerStatus[] = [];
    for (let i = 0; i < connector.count; i++) {
      arr.push(i < connector.available ? "available" : "in_use");
    }
    return arr;
  }, [connector.status, connector.count, connector.available]);

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-bold text-foreground">
          {CONNECTOR_LABEL[connector.type]} · {connector.powerKw} kW
        </p>
        <span className="text-caption text-muted-foreground">
          {connector.count} gun{connector.count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {statuses.map((status, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-2 rounded-xl bg-background border border-border p-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-caption font-bold text-muted-foreground">
                #{idx + 1}
              </span>
              <ChargerStatusBadge status={status} />
            </div>
            <div className="flex items-center gap-1">
              <StatusIcon
                active={status === "available"}
                icon={CheckCircle2}
                onClick={() => onStatus(idx, "available")}
                title="Available"
              />
              <StatusIcon
                active={status === "in_use"}
                icon={Activity}
                onClick={() => onStatus(idx, "in_use")}
                title="In use"
              />
              <StatusIcon
                active={status === "offline"}
                icon={PowerOff}
                danger
                onClick={() => onStatus(idx, "offline")}
                title="Offline"
              />
              <StatusIcon
                active={status === "maintenance"}
                icon={Wrench}
                onClick={() => onStatus(idx, "maintenance")}
                title="Maintenance"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusIcon = ({
  icon: Icon,
  active,
  danger,
  onClick,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
      active
        ? danger
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary"
        : "text-muted-foreground active:bg-secondary"
    }`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

// ---------- Live sessions panel ----------

const LiveSessionsPanel = ({ stationId }: { stationId: string }) => {
  const { data: sessions = [], refetch } = useStationEvSessions(stationId);
  const tick = useTickTelemetry();
  const endSession = useEndEvSession();

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === "active"),
    [sessions],
  );

  // Live-poll active sessions so vendor's dashboard mirrors what the consumer sees.
  useEffect(() => {
    if (!activeSessions.length) return;
    const iv = window.setInterval(() => {
      activeSessions.forEach((s) => tick.mutate(s.id));
      refetch();
    }, 3000);
    return () => window.clearInterval(iv);
  }, [activeSessions.length, refetch, tick]);

  if (activeSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-3 text-center">
        <p className="text-caption text-muted-foreground">
          No live sessions right now
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-caption font-bold text-foreground uppercase tracking-wider">
          Live sessions ({activeSessions.length})
        </p>
      </div>
      <div className="space-y-2">
        {activeSessions.map((s) => (
          <div
            key={s.id}
            className="rounded-xl bg-background border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-body-sm font-bold text-foreground truncate">
                  {CONNECTOR_LABEL[s.connectorType]} · {s.ratedKw} kW
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {s.kwhDelivered.toFixed(2)} kWh · ₹{s.cost}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-body-sm font-bold text-primary">
                  {s.currentKw.toFixed(1)} kW
                </p>
                <p className="text-caption text-muted-foreground">now</p>
              </div>
              <button
                onClick={async () => {
                  const ok = window.confirm(
                    "Force-stop this session? (support-only action)",
                  );
                  if (!ok) return;
                  await endSession.mutateAsync(s.id);
                  toast.success("Session force-stopped");
                }}
                className="p-2 text-destructive rounded-lg"
                title="Force stop"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Small UI bits ----------

const StationStatusPill = ({
  status,
}: {
  status: "draft" | "active" | "paused";
}) => {
  const map = {
    active: "bg-emerald-500/10 text-emerald-600",
    paused: "bg-amber-500/10 text-amber-600",
    draft: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      className={`text-caption font-bold px-2 py-1 rounded-lg ${map[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
};

const ChargerStatusBadge = ({ status }: { status: ChargerStatus }) => {
  const map: Record<ChargerStatus, string> = {
    available: "bg-emerald-500/10 text-emerald-600",
    in_use: "bg-amber-500/10 text-amber-600",
    offline: "bg-destructive/10 text-destructive",
    maintenance: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`text-caption font-bold px-2 py-0.5 rounded-md ${map[status]}`}
    >
      {CHARGER_STATUS_LABEL[status]}
    </span>
  );
};

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <Zap className="w-7 h-7 text-primary" />
    </div>
    <p className="mt-4 text-body font-bold text-foreground">
      No EV stations yet
    </p>
    <p className="mt-1 text-body-sm text-muted-foreground">
      Publish your first charging point so consumers can find it on the map.
    </p>
    <MobileButton onClick={onCreate} className="mt-5 w-full gap-1.5">
      <Plus className="w-4 h-4" /> Add EV Station
    </MobileButton>
  </div>
);

export default PartnerEvStationsScreen;
