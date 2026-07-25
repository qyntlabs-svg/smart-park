// Screen: MI-03 · Primitives: Location, Availability, Provider
// Route: /intel/gaps
// Cities × unmet demand × ROI on adding supply. Ranked table for
// real-estate + govt buyers.

import { useMemo, useState } from "react";
import { ArrowUpDown, Building2 } from "lucide-react";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelGaps } from "../hooks";
import type { DateRange } from "../types";
import { CITY_LABEL } from "../types";

type SortKey = "unmet" | "supply" | "recommended" | "roi";

const IntelGapsScreen = () => {
  const [range, setRange] = useState<DateRange>("90d");
  const [sort, setSort] = useState<SortKey>("unmet");
  const { data, isLoading, isError } = useIntelGaps(range);

  const rows = useMemo(() => {
    if (!data) return [];
    const arr = [...data];
    arr.sort((a, b) => {
      if (sort === "unmet") return b.unmet - a.unmet;
      if (sort === "supply") return b.supply - a.supply;
      if (sort === "recommended")
        return b.recommendedChargers - a.recommendedChargers;
      return a.projectedRoiMonths - b.projectedRoiMonths;
    });
    return arr;
  }, [data, sort]);

  return (
    <IntelLayout
      title="Infrastructure gap map"
      subtitle="Unmet demand ranked by projected ROI on adding chargers"
      range={range}
      onRangeChange={setRange}
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load gap analysis." />
      ) : rows.length === 0 ? (
        <IntelEmpty title="No zones surfaced" />
      ) : (
        <IntelCard
          title="Ranked zones"
          action={
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              {(
                [
                  { k: "unmet" as SortKey, l: "unmet" },
                  { k: "recommended" as SortKey, l: "add" },
                  { k: "roi" as SortKey, l: "ROI" },
                ]
              ).map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSort(s.k)}
                  className={`px-1.5 rounded ${
                    sort === s.k
                      ? "text-amber-300"
                      : "hover:text-slate-200"
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          }
        >
          <table className="w-full text-[13px]">
            <thead className="text-slate-400 text-left text-[11px] uppercase tracking-wider">
              <tr className="border-b border-slate-800">
                <th className="py-2 font-medium">Zone</th>
                <th className="py-2 font-medium">City</th>
                <th className="py-2 font-medium text-right">Unmet demand</th>
                <th className="py-2 font-medium text-right">Current chargers</th>
                <th className="py-2 font-medium text-right">Recommend + N</th>
                <th className="py-2 font-medium text-right">ROI (months)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.zone.id}
                  className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {r.zone.name}
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{CITY_LABEL[r.zone.city]}</td>
                  <td className="py-3 text-right text-rose-300 tabular-nums">
                    {r.unmet.toLocaleString()}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {r.supply}
                  </td>
                  <td className="py-3 text-right tabular-nums text-emerald-300">
                    +{r.recommendedChargers}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {r.projectedRoiMonths >= 999 ? "—" : `${r.projectedRoiMonths}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </IntelCard>
      )}
    </IntelLayout>
  );
};

export default IntelGapsScreen;
