// Screen: VIP-02 · Primitives: Vehicle, Reservation, Identity, Review
// Route: /vip/vehicles/:id
// Full identity record + tabs delegating to VIP-03/04/05/08 pages.

import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Car,
  Zap,
  Wrench,
  AlertTriangle,
  BadgeCheck,
  Printer,
} from "lucide-react";
import {
  VipCard,
  VipEmpty,
  VipError,
  VipLayout,
  VipLoading,
  VehicleTabs,
} from "../components/VipLayout";
import { useVipVehicle } from "../hooks";
import { HISTORY_LABEL } from "../types";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const VipVehicleProfileScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useVipVehicle(id);

  const kpis = useMemo(() => {
    if (!data)
      return { services: 0, charges: 0, spend: 0, openRecalls: 0 };
    return {
      services: data.serviceHistory.filter((h) => h.kind === "service").length,
      charges: data.serviceHistory.filter((h) => h.kind === "charge").length,
      spend: data.serviceHistory.reduce((s, h) => s + h.cost, 0),
      openRecalls: data.recalls.filter((r) => r.status === "open").length,
    };
  }, [data]);

  if (isLoading) {
    return (
      <VipLayout title="Vehicle profile" subtitle="Loading…">
        <VipLoading />
      </VipLayout>
    );
  }

  if (isError || !data) {
    return (
      <VipLayout title="Vehicle profile">
        {isError ? (
          <VipError message="Failed to load vehicle." />
        ) : (
          <VipEmpty
            title="Vehicle not found"
            hint="It may have been removed or you may not have access."
          />
        )}
      </VipLayout>
    );
  }

  const currentOwner =
    data.ownershipChain.find((o) => !o.to)?.owner ??
    data.ownershipChain.at(-1)?.owner ??
    "Unknown";
  const lastEvent = data.serviceHistory
    .slice()
    .sort((a, b) => (a.date > b.date ? -1 : 1))[0];

  return (
    <VipLayout
      title={`${data.year} ${data.make} ${data.model}`}
      subtitle={`Plate ${data.plate}${data.vin ? ` · VIN ${data.vin}` : ""}`}
      right={
        <button
          onClick={() => navigate(`/vip/vehicles/${data.vehicleId}/history`)}
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] hover:bg-slate-700"
        >
          <Printer className="w-3.5 h-3.5" /> Printable history
        </button>
      }
    >
      <VehicleTabs vehicleId={data.vehicleId} current="profile" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          {
            label: "Services",
            value: kpis.services,
            icon: Wrench,
            tone: "text-emerald-300",
          },
          {
            label: "Charging sessions",
            value: kpis.charges,
            icon: Zap,
            tone: "text-cyan-300",
          },
          {
            label: "Lifetime spend",
            value: `₹${kpis.spend.toLocaleString()}`,
            icon: BadgeCheck,
            tone: "text-slate-200",
          },
          {
            label: "Open recalls",
            value: kpis.openRecalls,
            icon: AlertTriangle,
            tone:
              kpis.openRecalls > 0 ? "text-amber-300" : "text-slate-400",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                {k.label}
              </div>
              <k.icon className={`w-4 h-4 ${k.tone}`} />
            </div>
            <div className={`mt-2 text-2xl font-semibold ${k.tone}`}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <VipCard title="Identity" className="lg:col-span-1">
          <dl className="text-[13px] space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-400">Plate</dt>
              <dd className="font-mono text-cyan-200">{data.plate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">VIN</dt>
              <dd className="font-mono text-slate-300 text-[12px]">
                {data.vin ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Make · Model</dt>
              <dd>
                {data.make} {data.model}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Year</dt>
              <dd>{data.year}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Current owner</dt>
              <dd>{currentOwner}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Owners in chain</dt>
              <dd>{data.ownershipChain.length}</dd>
            </div>
            {lastEvent ? (
              <div className="flex justify-between">
                <dt className="text-slate-400">Last event</dt>
                <dd>{fmtDate(lastEvent.date)}</dd>
              </div>
            ) : null}
          </dl>
        </VipCard>

        <VipCard title="Recall status" className="lg:col-span-2">
          {data.recalls.length === 0 ? (
            <VipEmpty title="No recalls on file" icon={Car} />
          ) : (
            <ul className="space-y-2">
              {data.recalls.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 border-b border-slate-800 pb-2 last:border-0"
                >
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full ${r.status === "open" ? "bg-amber-400" : "bg-emerald-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]">{r.summary}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.oem} · issued {fmtDate(r.issuedAt)}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded ${
                      r.status === "open"
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </VipCard>

        <VipCard
          title="Recent activity"
          className="lg:col-span-3"
          action={
            <button
              onClick={() =>
                navigate(`/vip/vehicles/${data.vehicleId}/history`)
              }
              className="text-[11px] text-cyan-300 hover:text-cyan-200"
            >
              Full timeline →
            </button>
          }
        >
          {data.serviceHistory.length === 0 ? (
            <VipEmpty
              title="No history yet"
              hint="Sessions and services will appear here"
            />
          ) : (
            <ul className="divide-y divide-slate-800">
              {data.serviceHistory
                .slice()
                .sort((a, b) => (a.date > b.date ? -1 : 1))
                .slice(0, 5)
                .map((h) => (
                  <li
                    key={h.id}
                    className="py-2 flex items-center gap-3 text-[13px]"
                  >
                    <span className="text-[11px] text-slate-400 w-24 shrink-0">
                      {fmtDate(h.date)}
                    </span>
                    <span className="inline-block w-16 shrink-0 text-[11px] rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-center">
                      {HISTORY_LABEL[h.kind]}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {h.summary}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {h.providerName}
                    </span>
                    <span className="w-20 text-right tabular-nums">
                      {h.cost > 0 ? `₹${h.cost.toLocaleString()}` : "—"}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </VipCard>
      </div>
    </VipLayout>
  );
};

export default VipVehicleProfileScreen;
