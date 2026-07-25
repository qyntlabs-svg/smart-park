// Screen: MI-07 · Primitives: Provider, Review
// Route: /intel/benchmarks
// Compare a vendor vs peers (percentile bars).

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelKpi,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelBench } from "../hooks";
import type { IntelProviderBench } from "../types";
import { CITY_LABEL } from "../types";

const percentile = (arr: number[], v: number) => {
  const below = arr.filter((x) => x < v).length;
  return Math.round((below / arr.length) * 100);
};

const IntelBenchmarksScreen = () => {
  const { data, isLoading, isError } = useIntelBench();
  const [selectedId, setSelectedId] = useState<string>("");

  const self = useMemo<IntelProviderBench | undefined>(() => {
    if (!data || data.length === 0) return undefined;
    return (
      data.find((d) => d.providerId === selectedId) ??
      data.find((d) => d.isSelf) ??
      data[0]
    );
  }, [data, selectedId]);

  const chartData = useMemo(() => {
    if (!data || !self) return [];
    const uptimes = data.map((d) => d.uptimePct);
    const utils = data.map((d) => d.utilizationPct);
    const ratings = data.map((d) => d.avgRating);
    const gmvs = data.map((d) => d.gmv);
    return [
      {
        metric: "Uptime %",
        you: self.uptimePct,
        peer: uptimes.reduce((a, b) => a + b, 0) / uptimes.length,
        best: Math.max(...uptimes),
        yourPct: percentile(uptimes, self.uptimePct),
      },
      {
        metric: "Utilization %",
        you: self.utilizationPct,
        peer: utils.reduce((a, b) => a + b, 0) / utils.length,
        best: Math.max(...utils),
        yourPct: percentile(utils, self.utilizationPct),
      },
      {
        metric: "Rating (×20)",
        you: self.avgRating * 20,
        peer: (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 20,
        best: Math.max(...ratings) * 20,
        yourPct: percentile(ratings, self.avgRating),
      },
      {
        metric: "GMV (₹Cr)",
        you: self.gmv / 10_000_000,
        peer: gmvs.reduce((a, b) => a + b, 0) / gmvs.length / 10_000_000,
        best: Math.max(...gmvs) / 10_000_000,
        yourPct: percentile(gmvs, self.gmv),
      },
    ];
  }, [data, self]);

  return (
    <IntelLayout
      title="Provider benchmarks"
      subtitle="Compare one vendor against the network — percentile view"
      right={
        <select
          value={self?.providerId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded bg-slate-900 border border-slate-700 text-[12px] px-2 py-1"
        >
          {(data ?? []).map((d) => (
            <option key={d.providerId} value={d.providerId}>
              {d.providerName}
              {d.isSelf ? " · self" : ""}
            </option>
          ))}
        </select>
      }
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load benchmarks." />
      ) : !self ? (
        <IntelEmpty title="No providers on file" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <IntelKpi
              label="Uptime %"
              value={`${self.uptimePct}`}
              hint={`${chartData[0]?.yourPct}th percentile`}
              tone={self.uptimePct >= 98 ? "text-emerald-300" : "text-amber-300"}
            />
            <IntelKpi
              label="Utilization %"
              value={`${self.utilizationPct}`}
              hint={`${chartData[1]?.yourPct}th percentile`}
            />
            <IntelKpi
              label="Rating"
              value={`${self.avgRating}★`}
              hint={`${chartData[2]?.yourPct}th percentile`}
              tone="text-amber-300"
            />
            <IntelKpi
              label="GMV"
              value={`₹${(self.gmv / 10_000_000).toFixed(2)} Cr`}
              hint={`${chartData[3]?.yourPct}th percentile`}
            />
          </div>

          <IntelCard title={`${self.providerName} · ${CITY_LABEL[self.city]}`}>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="peer" fill="#334155" name="Peer avg" />
                  <Bar dataKey="best" fill="#0f766e" name="Best in class" />
                  <Bar dataKey="you" fill="#fbbf24" name={self.providerName}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#fbbf24" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </IntelCard>
        </>
      )}
    </IntelLayout>
  );
};

export default IntelBenchmarksScreen;
