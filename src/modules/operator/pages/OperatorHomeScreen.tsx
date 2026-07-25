// Screen: CO-01 · Primitives: Provider, Availability, Payment
// Operator Console Home — network KPIs: uptime, utilization, revenue.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  DollarSign,
  Gauge,
  MapPin,
  ShieldAlert,
  Timer,
  Zap,
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
  OperatorKpiCard,
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  useDailyRevenue,
  useOperatorKpis,
  useOperatorNotices,
  useSlaIncidents,
  useStationSummaries,
} from "@/modules/operator/hooks";
import { cn } from "@/lib/utils";

const OperatorHomeScreen = () => {
  const navigate = useNavigate();
  const kpis = useOperatorKpis();
  const daily = useDailyRevenue(30);
  const stations = useStationSummaries();
  const sla = useSlaIncidents();
  const notices = useOperatorNotices();

  const critical = useMemo(
    () => notices.data?.filter((n) => n.severity === "critical" && !n.read) ?? [],
    [notices.data],
  );

  if (kpis.isLoading || daily.isLoading)
    return (
      <OperatorLayout title="Overview" screenId="CO-01" primitives={["Provider", "Availability", "Payment"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  const k = kpis.data!;
  const revenueSeries = daily.data ?? [];
  const sessionsSeries = revenueSeries.slice(-14);

  return (
    <OperatorLayout
      title="Operator overview"
      screenId="CO-01"
      primitives={["Provider", "Availability", "Payment"]}
    >
      <OperatorPageBody>
        {critical.length > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-red-800">
                {critical.length} critical incident(s) open
              </p>
              <p className="text-[12px] text-red-700 truncate">
                {critical[0].title}
              </p>
            </div>
            <button
              onClick={() => navigate("/operator/notifications")}
              className="text-[12px] font-semibold text-red-700 hover:underline shrink-0"
            >
              View →
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OperatorKpiCard
            label="Network uptime"
            value={`${k.uptimePct}%`}
            trend={{ value: "0.4 pp", positive: true }}
            hint={`${k.connectorsOffline} offline of ${k.totalConnectors}`}
            icon={Gauge}
            tone={k.uptimePct < 95 ? "warning" : "success"}
          />
          <OperatorKpiCard
            label="Utilization (24h)"
            value={`${k.utilizationPct}%`}
            hint="of connector-hours"
            icon={Activity}
          />
          <OperatorKpiCard
            label="Revenue (90 days)"
            value={`₹${(k.revenueLast90d / 1000).toFixed(1)}k`}
            trend={{ value: "12%", positive: true }}
            hint={`${k.sessionsLast90d.toLocaleString()} sessions`}
            icon={DollarSign}
          />
          <OperatorKpiCard
            label="SLA breaches"
            value={String(k.slaBreachCount)}
            hint="last 30 days"
            icon={ShieldAlert}
            tone={k.slaBreachCount > 5 ? "warning" : "default"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OperatorSection
            title="Daily revenue (last 30 days)"
            subtitle="Aggregated from EV session ledger"
            className="lg:col-span-2"
          >
            <div className="h-64 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="₹"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>

          <OperatorSection title="Today at a glance">
            <div className="p-4 space-y-3">
              <Row label="Sessions today" value={String(k.sessionsToday)} icon={Zap} />
              <Row
                label="Energy (90d)"
                value={`${(k.kwhLast90d / 1000).toFixed(1)} MWh`}
                icon={Zap}
              />
              <Row
                label="Avg session"
                value={`${k.avgSessionMinutes} min`}
                icon={Timer}
              />
              <Row
                label="Active stations"
                value={`${k.activeStations} / ${k.totalStations}`}
                icon={MapPin}
              />
            </div>
          </OperatorSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OperatorSection title="Sessions (last 14 days)" className="lg:col-span-2">
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsSeries}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sessions" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OperatorSection>

          <OperatorSection title="Recent SLA incidents" subtitle={`${sla.data?.length ?? 0} in 30 days`}>
            {(sla.data ?? []).length === 0 ? (
              <p className="p-6 text-[12px] text-slate-500 text-center">No incidents</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(sla.data ?? []).slice(0, 4).map((incident) => (
                  <li key={incident.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-slate-800 truncate">
                        {incident.reason.replace("_", " ")}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                          incident.durationMinutes > 240
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {Math.round(incident.durationMinutes)}m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {incident.stationId} · penalty ₹{incident.penalty}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </OperatorSection>
        </div>

        <OperatorSection
          title="Top stations today"
          right={
            <button
              onClick={() => navigate("/operator/stations")}
              className="text-[12px] font-semibold text-emerald-700 hover:underline"
            >
              View all →
            </button>
          }
        >
          <ul className="divide-y divide-slate-100">
            {(stations.data ?? [])
              .slice(0, 5)
              .sort((a, b) => b.todayRevenue - a.todayRevenue)
              .map((s) => (
                <li
                  key={s.stationId}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/operator/stations/${s.stationId}`)}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{s.address}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-[12px]">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ₹{s.todayRevenue.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {s.todaySessions} sessions
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-14 text-center rounded-md py-1 text-[10px] font-bold uppercase",
                        s.uptimePct === 100
                          ? "bg-emerald-50 text-emerald-700"
                          : s.uptimePct >= 90
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700",
                      )}
                    >
                      {s.uptimePct}%
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </OperatorSection>
      </OperatorPageBody>
    </OperatorLayout>
  );
};

const Row = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-none">
    <span className="text-[12px] text-slate-500 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      {label}
    </span>
    <span className="text-[13px] font-bold text-slate-900">{value}</span>
  </div>
);

export default OperatorHomeScreen;
