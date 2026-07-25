// Screen: MI-05 · Primitives: Pricing, Reservation
// Route: /intel/elasticity
// Price elasticity — sessions/day vs ₹/kWh, by segment. Recharts scatter.

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelElasticity } from "../hooks";
import type { IntelElasticityPoint } from "../types";

const SEGMENT_COLOR: Record<IntelElasticityPoint["segment"], string> = {
  commuter: "#38bdf8",
  fleet: "#fbbf24",
  casual: "#f472b6",
  tourist: "#a3e635",
};

const SEGMENT_LABEL: Record<IntelElasticityPoint["segment"], string> = {
  commuter: "Commuter",
  fleet: "Fleet",
  casual: "Casual",
  tourist: "Tourist",
};

const IntelElasticityScreen = () => {
  const { data, isLoading, isError } = useIntelElasticity();
  const [enabled, setEnabled] = useState<Record<IntelElasticityPoint["segment"], boolean>>({
    commuter: true,
    fleet: true,
    casual: true,
    tourist: true,
  });

  const grouped = useMemo(() => {
    if (!data) return null;
    const g: Record<
      IntelElasticityPoint["segment"],
      IntelElasticityPoint[]
    > = { commuter: [], fleet: [], casual: [], tourist: [] };
    for (const p of data) g[p.segment].push(p);
    return g;
  }, [data]);

  return (
    <IntelLayout
      title="Price elasticity"
      subtitle="Sensitivity of demand to per-kWh price, by consumer segment"
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load elasticity." />
      ) : !grouped ? (
        <IntelEmpty title="No elasticity data yet" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <IntelCard title="Sessions/day vs ₹/kWh" className="lg:col-span-3">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    dataKey="pricePerKwh"
                    name="₹/kWh"
                    stroke="#64748b"
                    fontSize={10}
                    label={{
                      value: "₹ per kWh",
                      position: "insideBottom",
                      offset: -6,
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="sessionsPerDay"
                    name="Sessions/day"
                    stroke="#64748b"
                    fontSize={10}
                    label={{
                      value: "Sessions / day",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />
                  <ZAxis range={[70, 70]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  {(Object.keys(grouped) as IntelElasticityPoint["segment"][]).map(
                    (seg) =>
                      enabled[seg] ? (
                        <Scatter
                          key={seg}
                          name={SEGMENT_LABEL[seg]}
                          data={grouped[seg]}
                          fill={SEGMENT_COLOR[seg]}
                        />
                      ) : null,
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </IntelCard>

          <IntelCard title="Segments" className="lg:col-span-1">
            <ul className="space-y-2 text-[13px]">
              {(Object.keys(grouped) as IntelElasticityPoint["segment"][]).map(
                (seg) => (
                  <li key={seg}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled[seg]}
                        onChange={() =>
                          setEnabled((e) => ({ ...e, [seg]: !e[seg] }))
                        }
                        className="accent-amber-400"
                      />
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: SEGMENT_COLOR[seg] }}
                      />
                      {SEGMENT_LABEL[seg]}
                    </label>
                  </li>
                ),
              )}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>
                Steeper negative slope = higher price sensitivity. Fleet
                buyers usually cluster the steepest.
              </p>
              <p>Toggle segments to isolate elasticity clusters.</p>
            </div>
          </IntelCard>
        </div>
      )}
    </IntelLayout>
  );
};

export default IntelElasticityScreen;
