// Screen: MOS-09 · Primitives: Identity, Review
// Route: /mechanic-os/tech-perf

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Star, TrendingUp, User } from "lucide-react";
import MechanicOsLayout from "@/modules/mechanic-os/components/MechanicOsLayout";
import {
  getMechanicShop,
  getShopBookings,
} from "@/modules/mechanic/lib/shops";
import { getWorkersForShop } from "@/modules/worker/lib/workers";

interface Row {
  workerId: string;
  name: string;
  status: string;
  jobs: number;
  revenue: number;
  avgTicket: number;
  upsellRate: number;
  csat: number; // 0..100
}

const MosTechPerformanceScreen = () => {
  const shop = getMechanicShop();

  const rows: Row[] = useMemo(() => {
    if (!shop) return [];
    const bookings = getShopBookings(shop.id);
    const reviews = shop.reviews ?? [];
    const workers = getWorkersForShop(shop.id);
    return workers
      .map((w) => {
        const mine = bookings.filter((b) => b.workerId === w.id);
        const done = mine.filter((b) => b.status === "completed");
        const rev = done.reduce((s, b) => s + (b.price || 0), 0);
        const workerReviews = reviews.filter((r) => r.workerId === w.id);
        const csatBase = workerReviews.length
          ? Math.round(
              (workerReviews.reduce((s, r) => s + r.rating, 0) /
                (workerReviews.length * 5)) *
                100,
            )
          : 85;
        const upsell = done.filter((b) => (b.services?.length ?? 1) > 1).length;
        return {
          workerId: w.id,
          name: w.name,
          status: w.status,
          jobs: done.length,
          revenue: rev,
          avgTicket: done.length ? Math.round(rev / done.length) : 0,
          upsellRate: done.length
            ? Math.round((upsell / done.length) * 100)
            : 0,
          csat: csatBase,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [shop]);

  const chart = rows.map((r) => ({
    name: r.name.split(" ")[0],
    jobs: r.jobs,
    revenue: r.revenue,
  }));

  return (
    <MechanicOsLayout
      title="Tech performance"
      subtitle="Per-worker throughput, upsell rate, CSAT"
    >
      {!shop ? (
        <Empty />
      ) : rows.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border text-center">
          <Award className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="text-body-sm text-muted-foreground mt-2">
            Invite workers from the mobile Mechanic app to populate this view.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top leaderboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rows.slice(0, 3).map((r, i) => (
              <div
                key={r.workerId}
                className={`p-4 rounded-2xl border ${
                  i === 0
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-body-sm font-bold text-primary">
                      #{i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-sm font-bold text-foreground">
                      {r.name}
                    </p>
                    <p className="text-caption text-muted-foreground capitalize">
                      {r.status}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <MiniStat label="Jobs" value={String(r.jobs)} />
                  <MiniStat label="₹" value={`${(r.revenue / 1000).toFixed(1)}k`} />
                  <MiniStat label="CSAT" value={`${r.csat}%`} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-body-sm font-bold text-foreground mb-2">
              Jobs & revenue per tech
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="jobs" fill="#FFC700" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-caption text-muted-foreground">
              <span className="col-span-3">Technician</span>
              <span className="col-span-2 text-right">Jobs</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-2 text-right">Avg ticket</span>
              <span className="col-span-2 text-right">Upsell</span>
              <span className="col-span-1 text-right">CSAT</span>
            </div>
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div
                  key={r.workerId}
                  className="grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 items-center"
                >
                  <div className="col-span-2 md:col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-foreground">
                        {r.name}
                      </p>
                      <p className="text-caption text-muted-foreground capitalize">
                        {r.status}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2 md:text-right text-body-sm text-foreground">
                    {r.jobs}
                  </div>
                  <div className="md:col-span-2 md:text-right text-body-sm font-bold text-foreground">
                    ₹{r.revenue.toLocaleString("en-IN")}
                  </div>
                  <div className="md:col-span-2 md:text-right text-body-sm text-muted-foreground">
                    ₹{r.avgTicket.toLocaleString("en-IN")}
                  </div>
                  <div className="md:col-span-2 md:text-right text-body-sm flex items-center gap-1 md:justify-end text-primary">
                    <TrendingUp className="w-3 h-3" /> {r.upsellRate}%
                  </div>
                  <div className="md:col-span-1 md:text-right text-body-sm flex items-center gap-1 md:justify-end text-warning">
                    <Star className="w-3 h-3 fill-warning" /> {r.csat}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MechanicOsLayout>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 rounded-lg bg-card text-center border border-border">
    <p className="text-body-sm font-bold text-foreground">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

const Empty = () => (
  <div className="p-8 rounded-2xl border border-dashed border-border text-center">
    <p className="text-body-sm text-muted-foreground">
      Set up your shop to see technician stats.
    </p>
  </div>
);

export default MosTechPerformanceScreen;
