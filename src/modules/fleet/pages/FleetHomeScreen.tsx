// Screen: F-01 · Primitives: Vehicle, Payment, Reservation, Notification
// Fleet Console Home — network-wide KPIs, live incidents, quick jumps.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  DollarSign,
  Gauge,
  Route,
  Users,
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
  FleetLayout,
  FleetPageBody,
  FleetKpiCard,
  FleetSection,
  FleetEmpty,
  FleetLoading,
} from "@/modules/fleet/components/FleetLayout";
import {
  useFleetAlerts,
  useFleetInvoices,
  useFleetMaintenance,
  useFleetShifts,
  useFleetVehicles,
} from "@/modules/fleet/hooks";

const FleetHomeScreen = () => {
  const navigate = useNavigate();
  const vehicles = useFleetVehicles();
  const alerts = useFleetAlerts();
  const invoices = useFleetInvoices();
  const shifts = useFleetShifts();
  const maintenance = useFleetMaintenance();

  const totalVehicles = vehicles.data?.length ?? 0;
  const onlineVehicles = vehicles.data?.filter((v) => v.telematics.online).length ?? 0;
  const uptimePct = totalVehicles ? Math.round((onlineVehicles / totalVehicles) * 100) : 0;

  const openIncidents = useMemo(() => {
    const critical = alerts.data?.filter((a) => a.severity === "critical" && !a.read).length ?? 0;
    const warn = alerts.data?.filter((a) => a.severity === "warning" && !a.read).length ?? 0;
    return { critical, warn, total: critical + warn };
  }, [alerts.data]);

  const monthlySpend = invoices.data?.[0]?.total ?? 0;
  const sessionsToday = useMemo(() => {
    const today = new Date().toDateString();
    return shifts.data?.filter((s) => new Date(s.startAt).toDateString() === today).length ?? 0;
  }, [shifts.data]);

  const spendSeries = useMemo(() => {
    const list = [...(invoices.data ?? [])].reverse();
    return list.map((inv) => ({
      month: inv.month.slice(5),
      spend: Math.round(inv.total / 1000),
    }));
  }, [invoices.data]);

  const utilizationSeries = useMemo(() => {
    // 14 days of shift counts
    const days: Record<string, number> = {};
    (shifts.data ?? []).forEach((s) => {
      const key = new Date(s.startAt).toISOString().slice(5, 10);
      days[key] = (days[key] ?? 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, count]) => ({ day, count }));
  }, [shifts.data]);

  const openMaint = maintenance.data?.filter((m) => m.status !== "completed") ?? [];

  const loading = vehicles.isLoading || alerts.isLoading || invoices.isLoading;

  return (
    <FleetLayout
      title="Overview"
      screenId="F-01"
      primitives={["Vehicle", "Payment", "Reservation", "Notification"]}
    >
      {loading ? (
        <FleetLoading />
      ) : (
        <FleetPageBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <FleetKpiCard
              label="Fleet uptime"
              value={`${uptimePct}%`}
              trend={{ value: "1.2 pp", positive: true }}
              hint={`${onlineVehicles} / ${totalVehicles} online`}
              icon={Gauge}
            />
            <FleetKpiCard
              label="Energy + fuel (MTD)"
              value={`₹${(monthlySpend / 1000).toFixed(1)}k`}
              trend={{ value: "4.6%", positive: false }}
              hint="Across 4 cost centers"
              icon={DollarSign}
            />
            <FleetKpiCard
              label="Open incidents"
              value={String(openIncidents.total)}
              trend={{
                value: `${openIncidents.critical} critical`,
                positive: false,
              }}
              hint={`${openIncidents.warn} warning`}
              icon={Bell}
            />
            <FleetKpiCard
              label="Shifts today"
              value={String(sessionsToday)}
              hint={`${shifts.data?.length ?? 0} last 14 days`}
              icon={CalendarClock}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FleetSection
              title="Monthly spend (₹k)"
              subtitle="Last 6 months"
              className="lg:col-span-2"
            >
              <div className="h-64 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendSeries}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="spend"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </FleetSection>

            <FleetSection title="Quick actions">
              <div className="p-3 space-y-2">
                <QuickBtn
                  icon={CalendarClock}
                  label="Batch reserve chargers"
                  onClick={() => navigate("/fleet/batch-reserve")}
                />
                <QuickBtn
                  icon={Route}
                  label="Plan a route"
                  onClick={() => navigate("/fleet/routes")}
                />
                <QuickBtn
                  icon={Users}
                  label="Add driver"
                  onClick={() => navigate("/fleet/drivers")}
                />
                <QuickBtn
                  icon={Zap}
                  label="Energy analytics"
                  onClick={() => navigate("/fleet/energy")}
                />
              </div>
            </FleetSection>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FleetSection
              title="Utilization"
              subtitle="Shifts per day (last 14)"
              className="lg:col-span-2"
            >
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationSeries}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </FleetSection>

            <FleetSection
              title="Open maintenance"
              subtitle={`${openMaint.length} work orders`}
            >
              {openMaint.length === 0 ? (
                <FleetEmpty
                  title="Nothing to service"
                  body="All predictive alerts clear."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {openMaint.slice(0, 5).map((m) => (
                    <li
                      key={m.id}
                      className="px-4 py-2.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">
                          {m.reason}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {m.vehicleId} · ₹{m.estCost}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 shrink-0">
                        {m.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => navigate("/fleet/maintenance")}
                className="w-full text-center py-2 text-[12px] text-blue-700 font-semibold border-t border-slate-100 hover:bg-blue-50"
              >
                Open scheduler →
              </button>
            </FleetSection>
          </div>
        </FleetPageBody>
      )}
    </FleetLayout>
  );
};

const QuickBtn = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[13px] text-slate-700 text-left"
  >
    <Icon className="w-4 h-4 text-blue-600" />
    <span className="flex-1">{label}</span>
    <span className="text-slate-400">→</span>
  </button>
);

export default FleetHomeScreen;
