// Screen: W-08 · Primitives: Payment
// Route: /worker/earnings

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getMechanicBookings,
  type MechanicBooking,
} from "@/modules/mechanic/lib/shops";
import {
  getWorkerAuth,
  getWorkerById,
} from "@/modules/worker/lib/workers";

const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short" });

const WorkerEarningsScreen = () => {
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const worker = auth ? getWorkerById(auth.workerId) : null;

  const mine: MechanicBooking[] = useMemo(() => {
    if (!worker) return [];
    return getMechanicBookings().filter((b) => b.workerId === worker.id);
  }, [worker]);
  const completed = mine.filter((b) => b.status === "completed");

  const { week, month, total, chart } = useMemo(() => {
    const now = Date.now();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const oneMonth = oneWeek * 4;
    const week = completed
      .filter((b) => now - new Date(b.date).getTime() <= oneWeek)
      .reduce((s, b) => s + (b.price || 0), 0);
    const month = completed
      .filter((b) => now - new Date(b.date).getTime() <= oneMonth)
      .reduce((s, b) => s + (b.price || 0), 0);
    const total = completed.reduce((s, b) => s + (b.price || 0), 0);

    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets[dayLabel(d)] = 0;
    }
    completed.forEach((b) => {
      const key = dayLabel(new Date(b.date));
      if (key in buckets) buckets[key] += b.price || 0;
    });
    const chart = Object.entries(buckets).map(([day, amount]) => ({
      day,
      amount,
    }));
    return { week, month, total, chart };
  }, [completed]);

  if (!worker) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Earnings
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <p className="text-caption opacity-90">This week's payout</p>
          <p className="text-3xl font-bold mt-1">
            ₹{week.toLocaleString("en-IN")}
          </p>
          <p className="text-caption opacity-90 mt-2">
            Settles every Friday to your registered UPI.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Last 30d" value={`₹${month.toLocaleString("en-IN")}`} icon={TrendingUp} />
          <Stat
            label="Lifetime"
            value={`₹${total.toLocaleString("en-IN")}`}
            icon={Wallet}
          />
          <Stat label="Jobs" value={String(completed.length)} icon={IndianRupee} />
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
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(255,199,0,0.1)" }}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`₹${v}`, "Earnings"]}
                />
                <Bar dataKey="amount" fill="#FFC700" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-body-sm font-bold text-foreground mb-2">
            Recent jobs
          </p>
          {completed.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border text-center">
              <p className="text-body-sm font-semibold text-foreground">
                No completed jobs yet
              </p>
              <p className="text-caption text-muted-foreground">
                Finish a job to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {completed.slice(0, 20).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div>
                    <p className="text-body-sm font-semibold text-foreground">
                      {b.service}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {b.customerName} · {new Date(b.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-body-sm font-bold text-success">
                    +₹{b.price}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof IndianRupee;
}) => (
  <div className="p-3 rounded-xl bg-card border border-border text-center">
    <Icon className="w-4 h-4 mx-auto text-primary" />
    <p className="text-body-sm font-bold text-foreground mt-1">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

export default WorkerEarningsScreen;
