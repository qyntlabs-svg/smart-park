// Screen: VIP-03 · Primitives: Vehicle, Reservation, Provider
// Route: /vip/vehicles/:id/history
// Standalone printable chronological timeline across all providers.

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, Filter } from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
  VehicleTabs,
} from "../components/VipLayout";
import { useVipVehicle } from "../hooks";
import {
  HISTORY_LABEL,
  type VipHistoryKind,
} from "../types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const KIND_TONE: Record<VipHistoryKind, string> = {
  service: "bg-emerald-500/20 text-emerald-200",
  charge: "bg-cyan-500/20 text-cyan-200",
  tow: "bg-rose-500/20 text-rose-200",
  parking: "bg-violet-500/20 text-violet-200",
};

const VipHistoryScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useVipVehicle(id);
  const [kindFilter, setKindFilter] = useState<VipHistoryKind | "all">(
    "all",
  );

  const rows = useMemo(() => {
    if (!data) return [];
    return data.serviceHistory
      .filter((h) => kindFilter === "all" || h.kind === kindFilter)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [data, kindFilter]);

  const totalSpend = useMemo(
    () => rows.reduce((s, h) => s + h.cost, 0),
    [rows],
  );

  if (isLoading) {
    return (
      <VipLayout title="Service history">
        <VipLoading />
      </VipLayout>
    );
  }
  if (isError || !data) {
    return (
      <VipLayout title="Service history">
        {isError ? (
          <VipError message="Failed to load history." />
        ) : (
          <VipEmpty title="Vehicle not found" />
        )}
      </VipLayout>
    );
  }

  return (
    <VipLayout
      title={`${data.plate} — Full history`}
      subtitle={`${data.year} ${data.make} ${data.model}`}
      right={
        <button
          onClick={() =>
            typeof window !== "undefined" && window.print()
          }
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] hover:bg-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      }
    >
      <VehicleTabs vehicleId={data.vehicleId} current="history" />

      <VipCard
        title={`${rows.length} events · ₹${totalSpend.toLocaleString()} lifetime`}
        action={
          <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filter
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "service", "charge", "tow", "parking"] as const).map(
            (k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`rounded px-3 py-1 text-[11px] border ${
                  kindFilter === k
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {k === "all" ? "All" : HISTORY_LABEL[k]}
              </button>
            ),
          )}
        </div>

        {rows.length === 0 ? (
          <VipEmpty
            title="No events for this filter"
            hint="Try 'All' to see everything on file"
          />
        ) : (
          <ol className="relative border-l border-slate-800 ml-3">
            {rows.map((h) => (
              <li key={h.id} className="ml-4 pb-4">
                <span
                  className={`absolute -left-[6px] w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                    KIND_TONE[h.kind].split(" ")[0]
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-2 text-[12px]">
                  <time className="text-slate-400">{fmt(h.date)}</time>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${KIND_TONE[h.kind]}`}
                  >
                    {HISTORY_LABEL[h.kind]}
                  </span>
                  <span className="text-slate-300 flex-1 min-w-0">
                    {h.summary}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {h.providerName}
                  </span>
                  <span className="tabular-nums text-slate-200 w-20 text-right">
                    {h.cost > 0 ? `₹${h.cost.toLocaleString()}` : "—"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </VipCard>
    </VipLayout>
  );
};

export default VipHistoryScreen;
