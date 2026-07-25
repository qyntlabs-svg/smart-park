// Screen: F-10 · Primitives: Pricing, Identity, Payment
// Policy & Approval Rules — driver spending caps + mandatory stops.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ShieldCheck } from "lucide-react";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  useFleetCostCenters,
  useFleetPolicies,
  useTogglePolicy,
  useUpsertPolicy,
} from "@/modules/fleet/hooks";
import type { FleetPolicy } from "@/modules/fleet/types";
import { cn } from "@/lib/utils";
import { makeId } from "@/shared/lib/storage";

const FleetPoliciesScreen = () => {
  const policies = useFleetPolicies();
  const centers = useFleetCostCenters();
  const toggle = useTogglePolicy();
  const upsert = useUpsertPolicy();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () =>
      policies.data?.find((p) => p.id === selectedId) ??
      policies.data?.[0] ??
      null,
    [policies.data, selectedId],
  );

  const doToggle = async (p: FleetPolicy) => {
    await toggle.mutateAsync(p.id);
    toast.success(`${p.name} ${p.enabled ? "disabled" : "enabled"}`);
  };

  const addPolicy = async () => {
    const next: FleetPolicy = {
      id: makeId("pol"),
      name: "New policy",
      scope: "cost_center",
      scopeId: centers.data?.[0]?.id,
      maxSessionSpend: 1200,
      dailySpendCap: 3500,
      monthlySpendCap: 60000,
      requireApprovalOver: 2000,
      mandatoryStops: [],
      allowedFuelTypes: ["ev", "hybrid", "ice"],
      enabled: false,
    };
    await upsert.mutateAsync(next);
    setSelectedId(next.id);
    toast.success("Policy created (disabled)");
  };

  if (policies.isLoading || centers.isLoading)
    return (
      <FleetLayout
        title="Policies"
        screenId="F-10"
        primitives={["Pricing", "Identity", "Payment"]}
      >
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Policies & approvals"
      screenId="F-10"
      primitives={["Pricing", "Identity", "Payment"]}
      actions={
        <button
          onClick={addPolicy}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
        >
          <Plus className="w-3.5 h-3.5" /> New policy
        </button>
      }
    >
      <FleetPageBody>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <FleetSection
            title={`Policies (${policies.data?.length ?? 0})`}
            subtitle="Scoped globally, per cost center, or per driver"
          >
            <ul className="divide-y divide-slate-100">
              {policies.data?.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors",
                      selected?.id === p.id ? "bg-blue-50/60" : "hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {p.name}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                          p.enabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {p.enabled ? "Active" : "Off"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                      {p.scope === "global"
                        ? "Global"
                        : p.scope === "cost_center"
                          ? `Cost center · ${p.scopeId}`
                          : `Driver · ${p.scopeId}`}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </FleetSection>

          {selected ? (
            <PolicyDetail
              policy={selected}
              onToggle={() => doToggle(selected)}
              onSave={async (p) => {
                await upsert.mutateAsync(p);
                toast.success("Policy saved");
              }}
            />
          ) : (
            <FleetSection title="Select a policy">
              <div className="p-6 text-[12px] text-slate-500">
                Pick a policy on the left to view its rules.
              </div>
            </FleetSection>
          )}
        </div>
      </FleetPageBody>
    </FleetLayout>
  );
};

const PolicyDetail = ({
  policy,
  onToggle,
  onSave,
}: {
  policy: FleetPolicy;
  onToggle: () => void;
  onSave: (p: FleetPolicy) => Promise<void>;
}) => {
  const [local, setLocal] = useState<FleetPolicy>(policy);

  // Reset local state when the parent switches selection.
  if (local.id !== policy.id) setLocal(policy);

  const update = <K extends keyof FleetPolicy>(k: K, v: FleetPolicy[K]) =>
    setLocal((prev) => ({ ...prev, [k]: v }));

  return (
    <FleetSection
      title={policy.name}
      subtitle="Editing draft — click Save to persist"
      right={
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "h-8 px-3 rounded-md text-[12px] font-semibold border",
              policy.enabled
                ? "border-red-200 text-red-700 hover:bg-red-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
            )}
          >
            {policy.enabled ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => onSave(local)}
            className="h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Policy name">
          <input
            className="input"
            value={local.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Scope">
          <input
            className="input bg-slate-50"
            value={
              local.scope === "global"
                ? "Global default"
                : `${local.scope} · ${local.scopeId ?? ""}`
            }
            readOnly
          />
        </Field>
        <Field label="Per-session max spend (₹)">
          <input
            type="number"
            className="input"
            value={local.maxSessionSpend}
            onChange={(e) => update("maxSessionSpend", Number(e.target.value))}
          />
        </Field>
        <Field label="Daily cap (₹)">
          <input
            type="number"
            className="input"
            value={local.dailySpendCap}
            onChange={(e) => update("dailySpendCap", Number(e.target.value))}
          />
        </Field>
        <Field label="Monthly cap (₹)">
          <input
            type="number"
            className="input"
            value={local.monthlySpendCap}
            onChange={(e) => update("monthlySpendCap", Number(e.target.value))}
          />
        </Field>
        <Field label="Require approval over (₹)">
          <input
            type="number"
            className="input"
            value={local.requireApprovalOver}
            onChange={(e) => update("requireApprovalOver", Number(e.target.value))}
          />
        </Field>
        <Field label="Allowed fuel types">
          <div className="flex flex-wrap gap-1.5">
            {(["ev", "hybrid", "ice"] as const).map((f) => {
              const on = local.allowedFuelTypes.includes(f);
              return (
                <button
                  key={f}
                  onClick={() =>
                    update(
                      "allowedFuelTypes",
                      on
                        ? local.allowedFuelTypes.filter((x) => x !== f)
                        : [...local.allowedFuelTypes, f],
                    )
                  }
                  className={cn(
                    "h-7 px-2 rounded-md text-[11px] font-semibold border",
                    on
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200",
                  )}
                >
                  {f.toUpperCase()}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Mandatory charging stops">
          <input
            className="input"
            value={local.mandatoryStops.join(", ")}
            onChange={(e) =>
              update(
                "mandatoryStops",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="stationId, stationId, ..."
          />
        </Field>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          Policies compound with the global default. A driver's effective rule is
          the intersection of all matching scopes.
        </div>
      </div>
    </FleetSection>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
      {label}
    </span>
    <div className="mt-1 [&_.input]:w-full [&_.input]:h-9 [&_.input]:rounded-md [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:text-[13px]">
      {children}
    </div>
  </label>
);

export default FleetPoliciesScreen;
