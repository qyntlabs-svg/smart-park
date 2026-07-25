// Screen: C-48 · Primitives: Vehicle, Payment, Reservation
//
// Monthly kWh + cost/km chart (recharts). Compare vs city average.
//
// Route: /insights/energy

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  ArrowLeft,
  Loader2,
  Zap,
  IndianRupee,
  Route as RouteIcon,
  Info,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  useCityAverage,
  useEnergyMonths,
} from "@/modules/consumer/insights/hooks";

const EnergyInsightsScreen = () => {
  const navigate = useNavigate();
  const { data: months = [], isLoading, isError, refetch } = useEnergyMonths();
  const { data: city } = useCityAverage();

  const summary = useMemo(() => {
    if (!months.length) return null;
    const kwh = months.reduce((n, m) => n + m.kwh, 0);
    const cost = months.reduce((n, m) => n + m.cost, 0);
    const km = months.reduce((n, m) => n + m.cost / m.costPerKm, 0);
    return {
      kwh: Math.round(kwh),
      cost: Math.round(cost),
      avgCostPerKm:
        Math.round(
          (months.reduce((n, m) => n + m.costPerKm, 0) / months.length) * 100,
        ) / 100,
      km: Math.round(km),
    };
  }, [months]);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-16">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Energy insights
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="mx-4 mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-body-sm font-semibold text-destructive">
            Couldn't load insights
          </p>
          <MobileButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Retry
          </MobileButton>
        </div>
      ) : months.length === 0 ? (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-body-sm font-bold text-foreground">
            No data yet
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Charge or drive to see monthly insights.
          </p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="mx-4 mt-4 grid grid-cols-3 gap-2">
            <SummaryTile
              icon={Zap}
              label="kWh · 6mo"
              value={`${summary?.kwh ?? 0}`}
              tone="primary"
            />
            <SummaryTile
              icon={IndianRupee}
              label="Total cost"
              value={`₹${summary?.cost ?? 0}`}
            />
            <SummaryTile
              icon={RouteIcon}
              label="Cost/km"
              value={`₹${summary?.avgCostPerKm.toFixed(2) ?? "0"}`}
              tone="emerald"
            />
          </div>

          {/* kWh chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-body-sm font-bold text-foreground">
                Monthly kWh
              </p>
              <p className="text-caption text-muted-foreground">
                Last 6 months
              </p>
            </div>
            <div className="mt-3" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  />
                  <Bar dataKey="kwh" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Cost/km line */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-body-sm font-bold text-foreground">
                Cost per km
              </p>
              {city && (
                <p className="text-caption text-muted-foreground">
                  City avg ₹{city.costPerKm.toFixed(2)}
                </p>
              )}
            </div>
            <div className="mt-3" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={months} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="costPerKm"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* City compare */}
          {city && summary && (
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-primary/5 border border-emerald-500/25 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Info className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-body-sm font-bold text-foreground">
                    You're {Math.round(((city.costPerKm - summary.avgCostPerKm) / city.costPerKm) * 100)}%
                    cheaper than city average
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    Chennai avg ₹{city.costPerKm.toFixed(2)}/km · yours ₹
                    {summary.avgCostPerKm.toFixed(2)}/km
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SummaryTile = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "primary" | "emerald";
}) => {
  const bg =
    tone === "primary"
      ? "bg-primary/10"
      : tone === "emerald"
        ? "bg-emerald-500/10"
        : "bg-secondary";
  const fg =
    tone === "primary"
      ? "text-primary"
      : tone === "emerald"
        ? "text-emerald-600"
        : "text-foreground";
  return (
    <div className="p-3 rounded-2xl border border-border bg-card">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${fg}`} />
      </div>
      <p className="mt-2 text-caption text-muted-foreground">{label}</p>
      <p className="text-heading-sm text-foreground">{value}</p>
    </div>
  );
};

export default EnergyInsightsScreen;
