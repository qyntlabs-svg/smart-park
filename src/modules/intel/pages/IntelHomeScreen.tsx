// Screen: MI-01 · Primitives: Reservation, Payment
// Route: /intel
// Market overview: totals + growth series across all cities.

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelKpi,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelOverview } from "../hooks";
import type { DateRange, IntelCity } from "../types";

const fmtMoney = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

const fmtNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

const IntelHomeScreen = () => {
  const [city, setCity] = useState<IntelCity | "all">("all");
  const [range, setRange] = useState<DateRange>("30d");
  const { data, isLoading, isError } = useIntelOverview(city, range);

  return (
    <IntelLayout
      title="Market overview"
      subtitle="Sessions, GMV, unmet demand across the network"
      city={city}
      onCityChange={setCity}
      range={range}
      onRangeChange={setRange}
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load overview." />
      ) : !data || data.series.length === 0 ? (
        <IntelEmpty title="No data" hint="Try a wider date range" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <IntelKpi
              label="Total sessions"
              value={fmtNum(data.totalSessions)}
              tone="text-emerald-300"
            />
            <IntelKpi label="GMV" value={fmtMoney(data.totalGmv)} tone="text-amber-300" />
            <IntelKpi
              label="Unmet demand"
              value={fmtNum(data.totalUnmet)}
              tone="text-rose-300"
            />
            <IntelKpi
              label="Growth (2H vs 1H)"
              value={`${data.growthPct >= 0 ? "+" : ""}${data.growthPct}%`}
              tone={data.growthPct >= 0 ? "text-emerald-300" : "text-rose-300"}
              hint="Half-over-half sessions"
            />
          </div>

          <IntelCard
            title="Sessions & GMV"
            action={
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                {data.growthPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
                Half-over-half {data.growthPct}%
              </div>
            }
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series}>
                  <defs>
                    <linearGradient id="areaSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#10b981"
                    fontSize={10}
                    tickFormatter={fmtNum}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#fbbf24"
                    fontSize={10}
                    tickFormatter={fmtMoney}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(v: number, k: string) =>
                      k === "gmv" ? [fmtMoney(v), "GMV"] : [fmtNum(v), "Sessions"]
                    }
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    stroke="#10b981"
                    fill="url(#areaSessions)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="gmv"
                    stroke="#fbbf24"
                    fill="url(#areaGmv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </IntelCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <IntelCard title="Unmet demand trend">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <defs>
                      <linearGradient id="areaUnmet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={fmtNum} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="unmet"
                      stroke="#f87171"
                      fill="url(#areaUnmet)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </IntelCard>

            <IntelCard title="Session efficiency">
              <div className="text-[12px] text-slate-400 space-y-2">
                <p>
                  For the selected window, {fmtNum(data.totalSessions)} sessions
                  generated {fmtMoney(data.totalGmv)} GMV at{" "}
                  <span className="text-slate-200">
                    ₹
                    {data.totalSessions === 0
                      ? 0
                      : Math.round(data.totalGmv / data.totalSessions)}
                  </span>{" "}
                  per session (avg).
                </p>
                <p>
                  Unmet demand ratio:{" "}
                  <span className="text-rose-300">
                    {data.totalSessions + data.totalUnmet === 0
                      ? 0
                      : (
                          (data.totalUnmet /
                            (data.totalSessions + data.totalUnmet)) *
                          100
                        ).toFixed(1)}
                    %
                  </span>{" "}
                  — every 1% closed is roughly +
                  {fmtMoney(
                    Math.round(
                      (data.totalGmv / (data.totalSessions || 1)) *
                        (data.totalUnmet / 100),
                    ),
                  )}{" "}
                  GMV.
                </p>
              </div>
            </IntelCard>
          </div>
        </>
      )}
    </IntelLayout>
  );
};

export default IntelHomeScreen;
