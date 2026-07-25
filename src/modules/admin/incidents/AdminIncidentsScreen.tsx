// Screen: A-08 · Primitives: Availability, Notification
// Route: /admin/incidents

import { useState } from "react";
import {
  Activity,
  Loader2,
  CircleDot,
  MapPin,
  Clock,
  CheckCircle2,
  PlayCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import { useIncidents, useUpdateIncidentStatus } from "./hooks";
import {
  KIND_LABEL,
  SEVERITY_LABEL,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
} from "./types";

const STATUS_TABS: { key: IncidentStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "mitigating", label: "Mitigating" },
  { key: "resolved", label: "Resolved" },
];

const AdminIncidentsScreen = () => {
  const actor = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const [filter, setFilter] = useState<IncidentStatus | "all">("all");
  const { data: incidents = [], isLoading, isError } = useIncidents(
    filter === "all" ? undefined : filter,
  );
  const update = useUpdateIncidentStatus();

  const advance = async (
    inc: Incident,
    nextStatus: IncidentStatus,
    defaultNote: string,
  ) => {
    const note = window.prompt("Add a note for the timeline:", defaultNote);
    if (note === null) return;
    await update.mutateAsync({
      id: inc.id,
      status: nextStatus,
      actor,
      note: note.trim() || defaultNote,
    });
    toast.success(`Incident ${nextStatus}`);
  };

  const activeCount = incidents.filter(
    (i) => i.status !== "resolved",
  ).length;

  return (
    <AdminLayout
      title="Incident Board"
      subtitle="Live operational incidents across the network"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="Open" value={String(incidents.filter((i) => i.status === "open").length)} tone="destructive" />
        <Kpi label="Acknowledged" value={String(incidents.filter((i) => i.status === "acknowledged").length)} tone="warning" />
        <Kpi label="Mitigating" value={String(incidents.filter((i) => i.status === "mitigating").length)} tone="primary" />
        <Kpi label="Resolved (24h)" value={String(incidents.filter((i) => i.status === "resolved").length)} tone="success" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold border ${
              filter === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-body-sm text-destructive">Couldn't load incidents</div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 rounded-2xl border border-dashed border-border">
          <CheckCircle2 className="w-10 h-10 text-success" />
          <p className="text-body-sm text-muted-foreground">
            No {filter === "all" ? "" : filter + " "}incidents
          </p>
          {activeCount === 0 && (
            <p className="text-caption text-success font-bold">All quiet 🟢</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`rounded-2xl border bg-card p-4 ${
                inc.status === "open"
                  ? "border-destructive/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                      {KIND_LABEL[inc.kind]}
                    </span>
                    {inc.status === "open" && (
                      <CircleDot className="w-3 h-3 text-destructive animate-pulse" />
                    )}
                  </div>
                  <p className="text-body-sm font-bold text-foreground mt-1 truncate">
                    {inc.title}
                  </p>
                  <p className="text-caption text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {inc.city}
                    {inc.provider ? ` · ${inc.provider}` : ""}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Opened{" "}
                    {new Date(inc.openedAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {inc.impactUsers ? ` · ${inc.impactUsers} users affected` : ""}
                  </p>
                </div>
                <StatusPill status={inc.status} />
              </div>

              {/* Timeline */}
              <div className="mt-3 space-y-1.5">
                {inc.timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-caption">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <span className="font-bold">{t.by}:</span> {t.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(t.at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {inc.status !== "resolved" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {inc.status === "open" && (
                    <MobileButton
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() =>
                        advance(inc, "acknowledged", `${actor} acknowledged.`)
                      }
                      loading={update.isPending}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Acknowledge
                    </MobileButton>
                  )}
                  {inc.status !== "mitigating" && (
                    <MobileButton
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() =>
                        advance(inc, "mitigating", "Started mitigation")
                      }
                      loading={update.isPending}
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Mitigating
                    </MobileButton>
                  )}
                  <MobileButton
                    size="sm"
                    variant="success"
                    className="gap-1.5"
                    onClick={() =>
                      advance(inc, "resolved", "Incident resolved")
                    }
                    loading={update.isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </MobileButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

const Kpi = ({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "destructive" | "primary";
}) => {
  const color = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    primary: "text-primary",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className={`text-heading-md font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
};

const SeverityBadge = ({ severity }: { severity: IncidentSeverity }) => {
  const map: Record<IncidentSeverity, string> = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-warning text-warning-foreground",
    med: "bg-primary/10 text-primary",
    low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${map[severity]}`}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
};

const StatusPill = ({ status }: { status: IncidentStatus }) => {
  const map: Record<IncidentStatus, string> = {
    open: "bg-destructive/10 text-destructive",
    acknowledged: "bg-warning/10 text-warning",
    mitigating: "bg-primary/10 text-primary",
    resolved: "bg-success/10 text-success",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
};

export default AdminIncidentsScreen;
