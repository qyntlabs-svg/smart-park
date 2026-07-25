// Screen: MI-06 · Primitives: Identity, Reservation
// Route: /intel/cohorts
// Weekly cohort retention curves + a Mixpanel-style retention triangle.

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { useIntelCohorts } from "../hooks";

const COLORS = [
  "#f87171",
  "#fb923c",
  "#facc15",
  "#a3e635",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#f472b6",
  "#f9a8d4",
  "#94a3b8",
];

const IntelCohortsScreen = () => {
  const { data, isLoading, isError } = useIntelCohorts();
  const [hoverCohort, setHoverCohort] = useState<string | null>(null);

  const chartData = useMemo(() => {
    if (!data) return [];
    // pivot: rows = week index, cols = cohort start
    const maxLen = Math.max(...data.map((c) => c.retentionPct.length));
    const out: Array<Record<string, number | string>> = [];
    for (let w = 0; w < maxLen; w++) {
      const row: Record<string, number | string> = { week: `W${w}` };
      for (const c of data) {
        if (c.retentionPct[w] !== undefined) {
          row[c.cohortStart] = c.retentionPct[w];
        }
      }
      out.push(row);
    }
    return out;
  }, [data]);

  return (
    <IntelLayout
      title="Cohort retention"
      subtitle="Weekly retention curves + a classic retention triangle"
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load cohorts." />
      ) : !data || data.length === 0 ? (
        <IntelEmpty title="No cohorts yet" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IntelCard title="Weekly retention curves">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: "#94a3b8" }}
                    onMouseEnter={(e: any) =>
                      setHoverCohort(e?.value ?? null)
                    }
                    onMouseLeave={() => setHoverCohort(null)}
                  />
                  {data.map((c, i) => (
                    <Line
                      key={c.cohortStart}
                      type="monotone"
                      dataKey={c.cohortStart}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={
                        hoverCohort === null
                          ? 1.5
                          : hoverCohort === c.cohortStart
                            ? 3
                            : 0.6
                      }
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </IntelCard>

          <IntelCard title="Retention triangle">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr>
                    <th className="py-1 text-left text-slate-400 font-normal">
                      Cohort
                    </th>
                    <th className="py-1 text-right text-slate-400 font-normal">
                      Size
                    </th>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <th
                        key={i}
                        className="py-1 text-center text-slate-500 font-normal w-8"
                      >
                        W{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => (
                    <tr
                      key={c.cohortStart}
                      className="border-t border-slate-800"
                    >
                      <td className="py-1 text-slate-300 font-mono">
                        {c.cohortStart.slice(5)}
                      </td>
                      <td className="py-1 text-right text-slate-300 tabular-nums">
                        {c.size}
                      </td>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const v = c.retentionPct[i];
                        if (v === undefined)
                          return (
                            <td
                              key={i}
                              className="py-1 text-center bg-slate-950"
                            >
                              <span className="text-slate-700">·</span>
                            </td>
                          );
                        const bg = `rgba(${251}, ${191}, ${36}, ${Math.min(0.85, v / 100)})`;
                        const fg = v > 45 ? "#0a0f1c" : "#fde68a";
                        return (
                          <td
                            key={i}
                            className="py-1 text-center tabular-nums"
                            style={{ background: bg, color: fg }}
                          >
                            {v.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IntelCard>
        </div>
      )}
    </IntelLayout>
  );
};

export default IntelCohortsScreen;
