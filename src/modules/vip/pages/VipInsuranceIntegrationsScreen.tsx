// Screen: VIP-06 · Primitives: Vehicle, Provider
// Route: /vip/integrations/insurance
// List of insurer widgets pulling live data. Mock; not underwriting.

import { useState } from "react";
import { ShieldCheck, Activity, RefreshCcw, PlugZap } from "lucide-react";
import {
  VipCard,
  VipError,
  VipLayout,
  VipLoading,
} from "../components/VipLayout";
import { useVipVehicles } from "../hooks";

interface InsurerWidget {
  id: string;
  name: string;
  logo: string; // emoji stand-in
  status: "live" | "degraded" | "offline";
  vehicles: number;
  claimsThisMonth: number;
  scopes: string[];
  latencyMs: number;
}

const SEED_WIDGETS: InsurerWidget[] = [
  {
    id: "bajaj",
    name: "Bajaj Allianz",
    logo: "🛡️",
    status: "live",
    vehicles: 812,
    claimsThisMonth: 34,
    scopes: ["service_history", "tow_events", "recalls"],
    latencyMs: 214,
  },
  {
    id: "icici",
    name: "ICICI Lombard",
    logo: "🏛️",
    status: "live",
    vehicles: 1104,
    claimsThisMonth: 51,
    scopes: ["service_history", "recalls"],
    latencyMs: 187,
  },
  {
    id: "hdfc",
    name: "HDFC Ergo",
    logo: "🏦",
    status: "degraded",
    vehicles: 623,
    claimsThisMonth: 22,
    scopes: ["service_history", "tow_events"],
    latencyMs: 913,
  },
  {
    id: "digit",
    name: "Digit Insurance",
    logo: "🎯",
    status: "live",
    vehicles: 447,
    claimsThisMonth: 12,
    scopes: ["service_history"],
    latencyMs: 156,
  },
  {
    id: "acko",
    name: "Acko",
    logo: "🚀",
    status: "offline",
    vehicles: 0,
    claimsThisMonth: 0,
    scopes: [],
    latencyMs: 0,
  },
];

const STATUS_TONE: Record<InsurerWidget["status"], string> = {
  live: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
  degraded: "bg-amber-500/20 text-amber-200 border-amber-500/30",
  offline: "bg-slate-800 text-slate-400 border-slate-700",
};

const VipInsuranceIntegrationsScreen = () => {
  const { data, isLoading, isError } = useVipVehicles();
  const [widgets, setWidgets] = useState<InsurerWidget[]>(SEED_WIDGETS);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const totalVehicles = data?.length ?? 0;

  const refresh = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setWidgets((w) =>
        w.map((widget) =>
          widget.id === id
            ? {
                ...widget,
                latencyMs:
                  widget.status === "offline"
                    ? 0
                    : Math.round(120 + Math.random() * 500),
              }
            : widget,
        ),
      );
      setRefreshingId(null);
    }, 600);
  };

  return (
    <VipLayout
      title="Insurance integrations"
      subtitle="Insurer partners consuming VIP data via API (mock)"
    >
      {isError ? (
        <VipError message="Failed to load platform vehicles." />
      ) : isLoading ? (
        <VipLoading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Vehicles on network
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {totalVehicles.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Live integrations
              </div>
              <div className="mt-1 text-2xl font-semibold text-emerald-300">
                {widgets.filter((w) => w.status === "live").length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Degraded
              </div>
              <div className="mt-1 text-2xl font-semibold text-amber-300">
                {widgets.filter((w) => w.status === "degraded").length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Monthly claims read
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {widgets
                  .reduce((n, w) => n + w.claimsThisMonth, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>

          <VipCard
            title="Insurer widgets"
            action={
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <PlugZap className="w-3.5 h-3.5" /> Read-only feeds
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {widgets.map((w) => (
                <div
                  key={w.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-lg">
                        {w.logo}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold">
                          {w.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          insurer/{w.id}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_TONE[w.status]}`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 text-[11px] gap-2">
                    <div>
                      <div className="text-slate-500">Vehicles</div>
                      <div className="text-slate-200 tabular-nums">
                        {w.vehicles.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Claims / mo</div>
                      <div className="text-slate-200 tabular-nums">
                        {w.claimsThisMonth}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Latency</div>
                      <div className="text-slate-200 tabular-nums">
                        {w.latencyMs === 0 ? "—" : `${w.latencyMs}ms`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {w.scopes.length === 0 ? (
                      <span className="text-[10px] text-slate-500">
                        No scopes granted
                      </span>
                    ) : (
                      w.scopes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono rounded bg-slate-800 text-slate-300 px-1.5 py-0.5"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Activity className="w-3 h-3" /> Live
                    </div>
                    <button
                      onClick={() => refresh(w.id)}
                      disabled={
                        w.status === "offline" || refreshingId === w.id
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 disabled:text-slate-500"
                    >
                      <RefreshCcw
                        className={`w-3 h-3 ${refreshingId === w.id ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </VipCard>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-[12px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            Insurers act only as consumers of the VIP graph — SmartPark does
            not underwrite policies. Data sharing is gated by per-vehicle
            consent (see the vehicle's "Permissions" tab).
          </div>
        </>
      )}
    </VipLayout>
  );
};

export default VipInsuranceIntegrationsScreen;
