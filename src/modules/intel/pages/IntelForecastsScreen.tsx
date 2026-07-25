// Screen: MI-04 · Primitives: Availability, Reservation
// Route: /intel/forecasts
// Zone-level demand forecast with confidence-interval band.

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelForecast, useIntelZones } from "../hooks";
import { CITY_LABEL } from "../types";

const IntelForecastsScreen = () => {
  const { data: zones } = useIntelZones();
  const [zoneId, setZoneId] = useState<string>("");
  const activeZoneId = zoneId || zones?.[0]?.id;
  const { data, isLoading, isError } = useIntelForecast(activeZoneId);

  const zoneMeta = zones?.find((z) => z.id === activeZoneId);
  const forecastStartIdx = data?.findIndex((d) => d.actual === null);
  const forecastStartDate =
    forecastStartIdx != null && forecastStartIdx >= 0
      ? data?.[forecastStartIdx]?.date
      : undefined;

  return (
    <IntelLayout
      title="Demand forecasts"
      subtitle="Day-level session forecast per zone (7-day moving avg + trend)"
      right={
        <select
          value={activeZoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="rounded bg-slate-900 border border-slate-700 text-[12px] px-2 py-1 max-w-[220px]"
        >
          {(zones ?? []).map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} · {CITY_LABEL[z.city]}
            </option>
          ))}
        </select>
      }
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load forecasts." />
      ) : !data || data.length === 0 ? (
        <IntelEmpty title="No history for this zone" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <IntelCard
            title={`${zoneMeta?.name ?? "Zone"} · daily sessions`}
            action={
              <span className="text-[11px] text-slate-400">
                Shaded band = ±1σ · dashed cutoff = forecast start
              </span>
            }
          >
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="#fbbf24"
                    fillOpacity={0.12}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#0a0f1c"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {forecastStartDate ? (
                    <ReferenceLine
                      x={forecastStartDate}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      label={{
                        value: "forecast →",
                        fill: "#94a3b8",
                        fontSize: 10,
                        position: "insideTopRight",
                      }}
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-1 bg-emerald-500" /> Actual
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-1 bg-amber-400" /> Forecast
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-2 bg-amber-400/20" /> ±1σ
              </span>
            </div>
          </IntelCard>
        </div>
      )}
    </IntelLayout>
  );
};

export default IntelForecastsScreen;
