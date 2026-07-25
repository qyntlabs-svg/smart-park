// Screen: T-05 · Primitives: Payment
// Route: /tow/earnings

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { IndianRupee, TrendingUp, Wallet } from "lucide-react";
import TowLayout from "@/modules/tow/components/TowLayout";
import {
  getCurrentOperator,
  listEarnings,
  type TowEarning,
} from "@/modules/tow/lib/tow";

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short" });

const TowEarningsScreen = () => {
  const op = getCurrentOperator();
  const earnings = op ? listEarnings(op.id) : [];

  const { weekTotal, monthTotal, jobs, chart } = useMemo(() => {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const oneMonth = oneWeek * 4;
    const weekTotal = earnings
      .filter((e) => now - new Date(e.completedAt).getTime() <= oneWeek)
      .reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = earnings
      .filter((e) => now - new Date(e.completedAt).getTime() <= oneMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    // Build 7-day chart (oldest → newest)
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayLabel(d);
      buckets[key] = 0;
    }
    earnings.forEach((e) => {
      const d = new Date(e.completedAt);
      const key = dayLabel(d);
      if (key in buckets) buckets[key] += e.amount;
    });
    const chart = Object.entries(buckets).map(([day, amount]) => ({
      day,
      amount,
    }));

    return { weekTotal, monthTotal, jobs: earnings.length, chart };
  }, [earnings]);

  return (
    <TowLayout title="Earnings">
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="This week" value={`₹${weekTotal.toLocaleString("en-IN")}`} icon={Wallet} />
          <StatCard
            label="Last 30d"
            value={`₹${monthTotal.toLocaleString("en-IN")}`}
            icon={TrendingUp}
          />
          <StatCard label="Jobs" value={String(jobs)} icon={IndianRupee} />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-body-sm font-bold text-foreground mb-2">
            Last 7 days
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  hide
                  domain={[
                    0,
                    (dataMax: number) => Math.max(500, Math.ceil(dataMax * 1.2)),
                  ]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,199,0,0.08)" }}
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(v: number) => [`₹${v}`, "Earnings"]}
                />
                <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-body-sm font-bold text-foreground mb-2">
            Recent payouts
          </p>
          {earnings.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border text-center">
              <p className="text-body-sm font-semibold text-foreground">
                No completed jobs yet
              </p>
              <p className="text-caption text-muted-foreground">
                Finish an SOS to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {earnings.map((e) => (
                <EarningRow key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </TowLayout>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) => (
  <div className="p-3 rounded-xl bg-card border border-border text-center">
    <Icon className="w-4 h-4 mx-auto text-primary" />
    <p className="text-body-sm font-bold text-foreground mt-1">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

const EarningRow = ({ e }: { e: TowEarning }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
    <div>
      <p className="text-body-sm font-semibold text-foreground">
        {e.serviceLabel}
      </p>
      <p className="text-caption text-muted-foreground">
        {new Date(e.completedAt).toLocaleString()}
      </p>
    </div>
    <p className="text-body-sm font-bold text-success">
      +₹{e.amount.toLocaleString("en-IN")}
    </p>
  </div>
);

export default TowEarningsScreen;
