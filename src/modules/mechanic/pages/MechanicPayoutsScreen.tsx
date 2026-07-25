// Screen: M-12 · Primitives: Payment
// Route: /mechanic/payouts

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  Wallet,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getMechanicShop,
  getShopBookings,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const MechanicPayoutsScreen = () => {
  const navigate = useNavigate();
  const shop = getMechanicShop();

  useEffect(() => {
    if (!shop) navigate("/mechanic/login", { replace: true });
  }, [shop, navigate]);

  const bookings: MechanicBooking[] = shop ? getShopBookings(shop.id) : [];
  const completed = bookings.filter((b) => b.status === "completed");

  const { pending, thisMonth, lifetime, chart, nextPayout } = useMemo(() => {
    const paid = completed.filter((b) => b.paid);
    const pending = completed
      .filter((b) => !b.paid)
      .reduce((s, b) => s + (b.price || 0), 0);
    const lifetime = paid.reduce((s, b) => s + (b.price || 0), 0);
    const now = Date.now();
    const monthMs = 1000 * 60 * 60 * 24 * 30;
    const thisMonth = paid
      .filter((b) => now - new Date(b.date).getTime() <= monthMs)
      .reduce((s, b) => s + (b.price || 0), 0);

    // 14-day trailing chart
    const buckets: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets[dayLabel(d)] = 0;
    }
    paid.forEach((b) => {
      const key = dayLabel(new Date(b.date));
      if (key in buckets) buckets[key] += b.price || 0;
    });
    const chart = Object.entries(buckets).map(([day, amount]) => ({
      day,
      amount,
    }));

    // Next payout = Friday of this week @ 4pm (mock)
    const next = new Date();
    const dayIdx = next.getDay(); // 0=Sun, 5=Fri
    const diff = (5 - dayIdx + 7) % 7 || 7;
    next.setDate(next.getDate() + diff);
    next.setHours(16, 0, 0, 0);

    return {
      pending,
      thisMonth,
      lifetime,
      chart,
      nextPayout: next,
    };
  }, [completed]);

  if (!shop) return null;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Payouts
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Hero card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <p className="text-caption opacity-90">Available for next payout</p>
          <p className="text-3xl font-bold mt-1">
            ₹{pending.toLocaleString("en-IN")}
          </p>
          <div className="mt-3 flex items-center gap-2 text-caption">
            <Calendar className="w-3 h-3" />
            Next payout {nextPayout.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            })} · 16:00 IST
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="This month"
            value={`₹${thisMonth.toLocaleString("en-IN")}`}
            icon={TrendingUp}
          />
          <StatCard
            label="Lifetime"
            value={`₹${lifetime.toLocaleString("en-IN")}`}
            icon={Wallet}
          />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-body-sm font-bold text-foreground mb-2">
            Last 14 days
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`₹${v}`, "Payout"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#FFC700"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-body-sm font-bold text-foreground mb-2">
            Payout schedule
          </p>
          <div className="rounded-2xl overflow-hidden border border-border divide-y divide-border">
            <ScheduleRow
              date={nextPayout}
              amount={pending}
              tone="upcoming"
              label="Upcoming"
            />
            {mockPastPayouts(thisMonth, lifetime).map((p) => (
              <ScheduleRow
                key={p.date.toISOString()}
                date={p.date}
                amount={p.amount}
                tone="past"
                label="Settled"
              />
            ))}
          </div>
        </div>

        <p className="text-caption text-muted-foreground text-center">
          Payouts settle every Friday to your registered UPI /{shop.upiId ?? "shop@upi"}.
        </p>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof IndianRupee;
}) => (
  <div className="p-3 rounded-xl bg-card border border-border">
    <Icon className="w-4 h-4 text-primary" />
    <p className="text-body-sm font-bold text-foreground mt-1">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

const ScheduleRow = ({
  date,
  amount,
  tone,
  label,
}: {
  date: Date;
  amount: number;
  tone: "upcoming" | "past";
  label: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-card">
    <div>
      <p className="text-body-sm font-semibold text-foreground">
        {date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="text-caption text-muted-foreground">{label}</p>
    </div>
    <p
      className={`text-body-sm font-bold ${tone === "upcoming" ? "text-primary" : "text-foreground"}`}
    >
      ₹{amount.toLocaleString("en-IN")}
    </p>
  </div>
);

function mockPastPayouts(thisMonth: number, lifetime: number) {
  const seed = Math.max(1, Math.floor(lifetime / 4) || 0);
  const now = new Date();
  return [1, 2, 3].map((i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setHours(16, 0, 0, 0);
    return {
      date: d,
      amount: Math.round((thisMonth || seed) * (0.7 + i * 0.1)),
    };
  });
}

export default MechanicPayoutsScreen;
