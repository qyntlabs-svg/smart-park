// Screen: MOS-01 · Primitives: Reservation, Payment, Review
// Route: /mechanic-os

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ClipboardList,
  IndianRupee,
  Smile,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  getMechanicShop,
  getShopBookings,
} from "@/modules/mechanic/lib/shops";
import { getWorkersForShop } from "@/modules/worker/lib/workers";

const CHART_COLORS = ["#FFC700", "#3b82f6", "#22c55e", "#ef4444", "#a855f7"];

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short" });

const MosConsoleHomeScreen = () => {
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const bookings = shop ? getShopBookings(shop.id) : [];
  const workers = shop ? getWorkersForShop(shop.id) : [];

  const {
    completed,
    revenue,
    avgTicket,
    nps,
    utilization,
    throughputChart,
    revenueChart,
    serviceMix,
  } = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "completed");
    const revenue = completed.reduce((s, b) => s + (b.price || 0), 0);
    const avgTicket = completed.length ? Math.round(revenue / completed.length) : 0;
    const workerActive = workers.filter((w) => w.status === "approved").length;
    const utilization = workerActive
      ? Math.min(
          100,
          Math.round(
            (completed.length / Math.max(workerActive * 5, 1)) * 100,
          ),
        )
      : 0;

    // NPS = % promoters - % detractors, approximated from 4-5 star reviews.
    const reviews = shop?.reviews ?? [];
    const promoters = reviews.filter((r) => r.rating >= 5).length;
    const detractors = reviews.filter((r) => r.rating <= 3).length;
    const nps = reviews.length
      ? Math.round(((promoters - detractors) / reviews.length) * 100)
      : 68;

    // 7-day throughput
    const throughputBuckets: Record<string, number> = {};
    const revenueBuckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      throughputBuckets[dayLabel(d)] = 0;
      revenueBuckets[dayLabel(d)] = 0;
    }
    completed.forEach((b) => {
      const key = dayLabel(new Date(b.date));
      if (key in throughputBuckets) {
        throughputBuckets[key] += 1;
        revenueBuckets[key] += b.price || 0;
      }
    });
    const throughputChart = Object.entries(throughputBuckets).map(([day, jobs]) => ({ day, jobs }));
    const revenueChart = Object.entries(revenueBuckets).map(([day, revenue]) => ({ day, revenue }));

    // Service mix pie
    const mix: Record<string, number> = {};
    completed.forEach((b) => {
      const svc = (b.service || "Other").slice(0, 22);
      mix[svc] = (mix[svc] || 0) + 1;
    });
    const serviceMix = Object.entries(mix)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      completed,
      revenue,
      avgTicket,
      nps,
      utilization,
      throughputChart,
      revenueChart,
      serviceMix,
    };
  }, [bookings, workers, shop]);

  return (
    <MechanicOsLayout
      title="Console home"
      subtitle={`${shop?.shopName ?? "Your shop"} — snapshot of today`}
      actions={
        <button
          onClick={() => navigate("/mechanic-os/jobs")}
          className="hidden md:flex items-center gap-1 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-body-sm font-semibold"
        >
          Open job cards <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      {!shop ? (
        <EmptyShopCard />
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi
              icon={ClipboardList}
              label="Throughput"
              value={String(completed.length)}
              hint="Completed jobs (all-time)"
            />
            <Kpi
              icon={IndianRupee}
              label="Avg ticket"
              value={`₹${avgTicket.toLocaleString("en-IN")}`}
              hint={`from ${completed.length} jobs`}
            />
            <Kpi icon={Smile} label="NPS" value={String(nps)} hint="Promoters − Detractors" />
            <Kpi
              icon={Users}
              label="Tech utilization"
              value={`${utilization}%`}
              hint={`${workers.length} technicians on roster`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Throughput — last 7 days">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={throughputChart}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,199,0,0.08)" }}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [v, "Jobs"]}
                    />
                    <Bar dataKey="jobs" fill="#FFC700" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Revenue — last 7 days">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChart}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Service mix (top 5)">
            {serviceMix.length === 0 ? (
              <EmptyLine text="No completed jobs yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceMix}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label={{ fontSize: 11 }}
                      >
                        {serviceMix.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {serviceMix.map((s, i) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-body-sm flex-1 truncate">{s.name}</span>
                      <span className="text-body-sm font-bold">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </MechanicOsLayout>
  );
};

const Kpi = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  hint?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 26 }}
    whileHover={{ y: -2, boxShadow: "0 12px 32px -12px rgba(0,0,0,0.15)" }}
    className="p-4 rounded-2xl bg-card border border-border transition-shadow"
  >
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-caption text-muted-foreground">{label}</p>
    </div>
    <p className="mt-3 text-xl md:text-2xl font-bold text-foreground">
      {value}
    </p>
    {hint && (
      <p className="text-caption text-muted-foreground mt-1">{hint}</p>
    )}
  </motion.div>
);

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="p-4 rounded-2xl bg-card border border-border"
  >
    <p className="text-body-sm font-bold text-foreground mb-3">{title}</p>
    {children}
  </motion.div>
);

const EmptyShopCard = () => (
  <div className="p-8 rounded-2xl border border-dashed border-border text-center">
    <p className="text-body font-bold text-foreground">
      No mechanic shop configured
    </p>
    <p className="text-body-sm text-muted-foreground mt-1">
      Set up your shop in the mobile Mechanic app to populate this console.
    </p>
  </div>
);

const EmptyLine = ({ text }: { text: string }) => (
  <p className="text-body-sm text-muted-foreground py-6 text-center">{text}</p>
);

export default MosConsoleHomeScreen;
