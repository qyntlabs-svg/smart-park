// Screen: VIP-04 · Primitives: Vehicle, Identity
// Route: /vip/vehicles/:id/ownership
// Chain of ownership + resale-value inputs.

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
  VehicleTabs,
} from "../components/VipLayout";
import { useVipVehicle } from "../hooks";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const yearsBetween = (a: string, b?: string) => {
  const start = new Date(a).getTime();
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, (end - start) / (365.25 * 86400000));
};

const VipOwnershipScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useVipVehicle(id);

  // Resale calculator inputs
  const [askingPrice, setAskingPrice] = useState<number>(0);
  const [conditionScore, setConditionScore] = useState<number>(7);

  const resale = useMemo(() => {
    if (!data) return null;
    // Rough MSRP proxy by segment.
    const msrpProxy =
      data.model.toLowerCase().includes("kona")
        ? 2400000
        : data.model.toLowerCase().includes("zs")
          ? 2200000
          : 2000000;
    const ageYears = Math.max(0, new Date().getFullYear() - data.year);
    const depreciation = Math.min(0.75, ageYears * 0.11);
    const historyBoost = Math.min(
      0.06,
      data.serviceHistory.filter((h) => h.kind === "service").length * 0.015,
    );
    const towPenalty = Math.min(
      0.1,
      data.serviceHistory.filter((h) => h.kind === "tow").length * 0.03,
    );
    const openRecallPenalty =
      data.recalls.filter((r) => r.status === "open").length * 0.02;
    const conditionAdj = (conditionScore - 7) * 0.02;
    const fair =
      msrpProxy *
      (1 - depreciation + historyBoost - towPenalty - openRecallPenalty + conditionAdj);
    return {
      msrpProxy,
      fair: Math.max(200000, Math.round(fair)),
      depreciation,
      historyBoost,
      towPenalty,
      openRecallPenalty,
    };
  }, [data, conditionScore]);

  if (isLoading) {
    return (
      <VipLayout title="Ownership ledger">
        <VipLoading />
      </VipLayout>
    );
  }
  if (isError || !data) {
    return (
      <VipLayout title="Ownership ledger">
        {isError ? (
          <VipError message="Failed to load ownership." />
        ) : (
          <VipEmpty title="Vehicle not found" />
        )}
      </VipLayout>
    );
  }

  const gapVsAsk =
    askingPrice && resale ? askingPrice - resale.fair : null;

  return (
    <VipLayout
      title={`${data.plate} — Ownership ledger`}
      subtitle={`${data.year} ${data.make} ${data.model}`}
    >
      <VehicleTabs vehicleId={data.vehicleId} current="ownership" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <VipCard title="Chain of ownership" className="lg:col-span-2">
          <ol className="relative border-l border-slate-800 ml-3">
            {data.ownershipChain.map((o, i) => {
              const held = yearsBetween(o.from, o.to).toFixed(1);
              const current = !o.to;
              return (
                <li key={`${o.owner}-${i}`} className="ml-4 pb-4">
                  <span
                    className={`absolute -left-[6px] w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                      current ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  <div className="flex items-baseline gap-2 text-[13px]">
                    <span className="font-medium">{o.owner}</span>
                    {current ? (
                      <span className="text-[10px] rounded bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5">
                        current
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {fmt(o.from)} → {o.to ? fmt(o.to) : "now"} · held {held} yr
                  </div>
                </li>
              );
            })}
          </ol>
        </VipCard>

        <VipCard title="Resale calculator">
          {!resale ? (
            <VipEmpty title="Not enough data" />
          ) : (
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Estimated fair market
                </div>
                <div className="mt-1 text-2xl font-semibold text-emerald-300 tabular-nums">
                  ₹{resale.fair.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  vs. MSRP proxy ₹{resale.msrpProxy.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] text-slate-400">
                  Condition score: {conditionScore}/10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={conditionScore}
                  onChange={(e) =>
                    setConditionScore(Number(e.target.value))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Asking price (INR)
                </label>
                <input
                  type="number"
                  className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1.5 text-[13px] outline-none focus:border-cyan-400"
                  value={askingPrice || ""}
                  onChange={(e) =>
                    setAskingPrice(Number(e.target.value) || 0)
                  }
                  placeholder="e.g. 1400000"
                />
              </div>

              {gapVsAsk != null && askingPrice > 0 ? (
                <div
                  className={`rounded p-2 text-[12px] flex items-center gap-2 ${
                    gapVsAsk >= 0
                      ? "bg-rose-500/10 text-rose-200"
                      : "bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {gapVsAsk >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {gapVsAsk >= 0
                    ? `Asking ₹${gapVsAsk.toLocaleString()} above fair — buyer will negotiate.`
                    : `Asking ₹${Math.abs(gapVsAsk).toLocaleString()} below fair — good deal.`}
                </div>
              ) : null}

              <ul className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                <li>
                  Depreciation: −{(resale.depreciation * 100).toFixed(0)}%
                </li>
                <li>
                  Service history boost: +
                  {(resale.historyBoost * 100).toFixed(1)}%
                </li>
                <li>
                  Tow-event penalty: −{(resale.towPenalty * 100).toFixed(1)}%
                </li>
                <li>
                  Open-recall penalty: −
                  {(resale.openRecallPenalty * 100).toFixed(1)}%
                </li>
              </ul>
            </div>
          )}
        </VipCard>
      </div>
    </VipLayout>
  );
};

export default VipOwnershipScreen;
