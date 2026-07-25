// Screen: CO-03 · Primitives: Availability, Reservation, Provider
// Station Detail — per-station telemetry, connectors, live sessions, embeds CO-04 remote panel.

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  MapPin,
  Play,
  PowerOff,
  StopCircle,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OperatorEmpty,
  OperatorKpiCard,
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStationDetail } from "@/modules/operator/hooks";
import {
  useSetChargerStatus,
  useEndEvSession,
} from "@/modules/ev/hooks";
import {
  CHARGER_STATUS_LABEL,
  CONNECTOR_LABEL,
  type ChargerStatus,
} from "@/modules/ev/types";
import { cn } from "@/lib/utils";

const OperatorStationDetailScreen = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const detail = useStationDetail(id);
  const setStatus = useSetChargerStatus();
  const endSession = useEndEvSession();

  const [remoteOpen, setRemoteOpen] = useState<string | null>(null);

  const chart = useMemo(
    () =>
      (detail.data?.last7dSessions ?? []).map((d) => ({
        date: d.date,
        sessions: d.sessions,
        kwh: d.kwh,
        revenue: d.revenue,
      })),
    [detail.data],
  );

  if (detail.isLoading || !detail.data)
    return (
      <OperatorLayout title="Station" screenId="CO-03" primitives={["Availability", "Reservation", "Provider"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  const { station, sessions, todayKwh, todayRevenue } = detail.data;

  const changeStatus = async (connectorId: string, gunIndex: number, next: ChargerStatus) => {
    await setStatus.mutateAsync({ stationId: station.id, connectorId, gunIndex, status: next });
    toast.success(`Charger marked ${CHARGER_STATUS_LABEL[next].toLowerCase()}`);
  };

  const remoteStop = async (sessionId: string) => {
    const ok = window.confirm(
      "Remote-stop this session? The consumer will see it end immediately. (support-only action)",
    );
    if (!ok) return;
    await endSession.mutateAsync(sessionId);
    toast.success("Session stopped remotely");
    setRemoteOpen(null);
  };

  return (
    <OperatorLayout
      title={station.name}
      screenId="CO-03"
      primitives={["Availability", "Reservation", "Provider"]}
      actions={
        <button
          onClick={() => navigate("/operator/stations")}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-[12px] font-semibold text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All stations
        </button>
      }
    >
      <OperatorPageBody>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Station · {station.id}
              </p>
              <h2 className="text-[16px] font-bold text-slate-900">{station.name}</h2>
              <p className="text-[12px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {station.address}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                station.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {station.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OperatorKpiCard label="Sessions today" value={String(detail.data.sessions.filter((s) => new Date(s.startedAt ?? s.scheduledFor).toDateString() === new Date().toDateString()).length)} icon={Activity} />
          <OperatorKpiCard label="Energy today" value={`${todayKwh} kWh`} icon={Activity} />
          <OperatorKpiCard label="Revenue today" value={`₹${todayRevenue.toLocaleString()}`} icon={Activity} tone="success" />
          <OperatorKpiCard
            label="Rating"
            value={`${station.rating.toFixed(1)} / 5`}
            hint={`${station.reviewCount} reviews`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OperatorSection
            title="Last 7 days"
            subtitle="Sessions · kWh · revenue"
            className="lg:col-span-2"
          >
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sessions" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>

          <OperatorSection title="Hourly kWh (last 24h)" subtitle="Derived from session ledger">
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Array.from({ length: 24 }, (_, h) => ({
                    hour: `${h}h`,
                    kwh:
                      sessions.reduce((n, s) => {
                        const t = new Date(s.startedAt ?? s.scheduledFor);
                        if (t.getHours() === h && Date.now() - t.getTime() < 24 * 3600 * 1000)
                          return n + s.kwhDelivered;
                        return n;
                      }, 0) | 0,
                  }))}
                >
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="kwh" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>
        </div>

        <OperatorSection
          title="Connectors"
          subtitle="Force per-gun state; changes propagate to the consumer app immediately"
        >
          <div className="p-4 space-y-3">
            {station.connectors.map((c) => {
              const statuses =
                c.status ??
                Array.from({ length: c.count }, (_, i) =>
                  i < c.available ? "available" : "in_use",
                );
              return (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-800">
                      {CONNECTOR_LABEL[c.type]} · {c.powerKw} kW
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {c.count} gun{c.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {statuses.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md border border-slate-200 p-2 bg-slate-50/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">#{idx + 1}</span>
                          <StatusBadge status={st} />
                        </div>
                        <div className="flex items-center gap-1">
                          {(["available", "offline", "maintenance"] as ChargerStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => changeStatus(c.id, idx, s)}
                              className={cn(
                                "h-6 px-2 rounded-md text-[10px] font-semibold border",
                                st === s
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "border-slate-200 text-slate-600",
                              )}
                            >
                              {s === "available" ? "Live" : s === "offline" ? "Off" : "Maint"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </OperatorSection>

        <OperatorSection
          title="Live sessions (CO-04 remote start/stop panel)"
          subtitle="Support-only intervention on active sessions"
        >
          {sessions.filter((s) => s.status === "active").length === 0 ? (
            <OperatorEmpty
              title="No live sessions"
              body="When a consumer plugs in, the session shows up here."
              icon={Play}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Session</TableHead>
                  <TableHead className="text-[11px]">Connector</TableHead>
                  <TableHead className="text-[11px] text-right">kW now</TableHead>
                  <TableHead className="text-[11px] text-right">kWh</TableHead>
                  <TableHead className="text-[11px] text-right">₹</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <TableRow key={s.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{s.id.slice(-8)}</TableCell>
                      <TableCell className="py-2">
                        {CONNECTOR_LABEL[s.connectorType]} · {s.ratedKw}kW
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold text-emerald-700">
                        {s.currentKw.toFixed(1)}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {s.kwhDelivered.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono font-semibold">
                        ₹{s.cost}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          onClick={() => setRemoteOpen(s.id)}
                          className="text-[11px] font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                        >
                          <StopCircle className="w-3 h-3" /> Remote stop
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </OperatorSection>

        <OperatorSection title="Recent sessions" subtitle={`${sessions.length} completed`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">When</TableHead>
                <TableHead className="text-[11px]">Connector</TableHead>
                <TableHead className="text-[11px]">User</TableHead>
                <TableHead className="text-[11px] text-right">kWh</TableHead>
                <TableHead className="text-[11px] text-right">Cost</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 12).map((s) => (
                <TableRow key={s.id} className="text-[12px]">
                  <TableCell className="py-2">
                    {new Date(s.startedAt ?? s.scheduledFor).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">
                    {CONNECTOR_LABEL[s.connectorType]}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-slate-500">
                    {s.userId.slice(-6)}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {s.kwhDelivered.toFixed(1)}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono">
                    ₹{s.cost}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        s.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : s.status === "active"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {s.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OperatorSection>
      </OperatorPageBody>

      {remoteOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <PowerOff className="w-4 h-4 text-red-600" />
              <h3 className="text-[15px] font-bold text-slate-900">
                Remote stop session {remoteOpen.slice(-8)}
              </h3>
            </div>
            <p className="text-[12px] text-slate-600">
              This is a support-only action. Log an incident so we can trace why we
              stopped a live session.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setRemoteOpen(null)}
                className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => remoteStop(remoteOpen)}
                className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" /> Stop &amp; log
              </button>
            </div>
          </div>
        </div>
      )}
    </OperatorLayout>
  );
};

const StatusBadge = ({ status }: { status: ChargerStatus }) => {
  const map: Record<ChargerStatus, string> = {
    available: "bg-emerald-50 text-emerald-700",
    in_use: "bg-blue-50 text-blue-700",
    offline: "bg-red-50 text-red-700",
    maintenance: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
        map[status],
      )}
    >
      {CHARGER_STATUS_LABEL[status]}
    </span>
  );
};

export default OperatorStationDetailScreen;
