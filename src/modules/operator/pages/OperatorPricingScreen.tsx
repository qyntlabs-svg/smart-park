// Screen: CO-05 · Primitives: Pricing
// Pricing Rules Console — time-of-day + surge + per-connector pricing.

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Sliders } from "lucide-react";
import {
  OperatorEmpty,
  OperatorLayout,
  OperatorLoading,
  OperatorPageBody,
  OperatorSection,
} from "@/modules/operator/components/OperatorLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeletePricingRule,
  usePricingRules,
  useTogglePricingRule,
  useUpsertPricingRule,
} from "@/modules/operator/hooks";
import type { PricingRule, PricingRuleKind } from "@/modules/operator/types";
import { cn } from "@/lib/utils";
import { makeId } from "@/shared/lib/storage";

const OperatorPricingScreen = () => {
  const rules = usePricingRules();
  const toggle = useTogglePricingRule();
  const upsert = useUpsertPricingRule();
  const remove = useDeletePricingRule();

  const [drawer, setDrawer] = useState<PricingRule | null>(null);

  const openNew = () =>
    setDrawer({
      id: makeId("pr"),
      stationId: "all",
      kind: "time_of_day",
      label: "",
      active: true,
      fromHour: 17,
      toHour: 22,
      perKwh: 20,
      multiplier: 1.25,
      utilizationThresholdPct: 80,
      createdAt: new Date().toISOString(),
    });

  const save = async () => {
    if (!drawer) return;
    if (!drawer.label.trim()) return toast.error("Give the rule a label");
    await upsert.mutateAsync(drawer);
    toast.success("Pricing rule saved");
    setDrawer(null);
  };

  return (
    <OperatorLayout
      title="Pricing rules"
      screenId="CO-05"
      primitives={["Pricing"]}
      actions={
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700"
        >
          <Plus className="w-3.5 h-3.5" /> New rule
        </button>
      }
    >
      {rules.isLoading ? (
        <OperatorLoading />
      ) : (
        <OperatorPageBody>
          <OperatorSection
            title={`Pricing rules (${rules.data?.length ?? 0})`}
            subtitle="Rules stack; the highest-precedence match wins per session"
          >
            {(rules.data ?? []).length === 0 ? (
              <OperatorEmpty title="No rules" body="Start with the default per-kWh rate on each station." icon={Sliders} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Rule</TableHead>
                    <TableHead className="text-[11px]">Kind</TableHead>
                    <TableHead className="text-[11px]">Scope</TableHead>
                    <TableHead className="text-[11px]">Window / Trigger</TableHead>
                    <TableHead className="text-[11px]">Effect</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.data?.map((r) => (
                    <TableRow key={r.id} className="text-[12px]">
                      <TableCell className="py-2 font-semibold text-slate-800">
                        {r.label}
                      </TableCell>
                      <TableCell className="py-2">
                        <KindPill kind={r.kind} />
                      </TableCell>
                      <TableCell className="py-2 font-mono">
                        {r.stationId === "all" ? "all stations" : r.stationId}
                      </TableCell>
                      <TableCell className="py-2 text-slate-600">
                        {r.kind === "time_of_day"
                          ? `${String(r.fromHour).padStart(2, "0")}:00 → ${String(
                              r.toHour,
                            ).padStart(2, "0")}:00`
                          : r.kind === "surge"
                            ? `util > ${r.utilizationThresholdPct}%`
                            : `${r.connectorType?.toUpperCase()} only`}
                      </TableCell>
                      <TableCell className="py-2">
                        {r.kind === "surge"
                          ? `× ${r.multiplier}`
                          : `₹${r.perKwh}/kWh`}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => toggle.mutateAsync(r.id)}
                          className={cn(
                            "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                            r.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {r.active ? "Active" : "Off"}
                        </button>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => setDrawer(r)}
                            className="text-[11px] font-semibold text-blue-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              const ok = window.confirm(`Delete "${r.label}"?`);
                              if (!ok) return;
                              await remove.mutateAsync(r.id);
                              toast.success("Rule deleted");
                            }}
                            className="text-[11px] font-semibold text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </OperatorSection>
        </OperatorPageBody>
      )}

      {drawer && (
        <RuleDrawer
          rule={drawer}
          onChange={setDrawer}
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      )}
    </OperatorLayout>
  );
};

const KindPill = ({ kind }: { kind: PricingRuleKind }) => {
  const map: Record<PricingRuleKind, string> = {
    time_of_day: "bg-blue-50 text-blue-700",
    surge: "bg-purple-50 text-purple-700",
    connector: "bg-emerald-50 text-emerald-700",
  };
  const label = {
    time_of_day: "Time of day",
    surge: "Surge",
    connector: "Connector",
  }[kind];
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
        map[kind],
      )}
    >
      {label}
    </span>
  );
};

const RuleDrawer = ({
  rule,
  onChange,
  onClose,
  onSave,
}: {
  rule: PricingRule;
  onChange: (r: PricingRule) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const set = <K extends keyof PricingRule>(k: K, v: PricingRule[K]) =>
    onChange({ ...rule, [k]: v });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:w-[440px] h-full bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500">Pricing rule</p>
            <h3 className="text-[15px] font-bold text-slate-900">{rule.label || "New rule"}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-[13px]"
          >
            Close
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Label">
            <input
              className="input"
              value={rule.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. Evening peak"
            />
          </Field>

          <Field label="Kind">
            <div className="flex gap-1.5">
              {(["time_of_day", "surge", "connector"] as PricingRuleKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => set("kind", k)}
                  className={cn(
                    "h-8 px-3 rounded-md text-[11px] font-semibold border",
                    rule.kind === k
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-700 border-slate-200",
                  )}
                >
                  {k === "time_of_day" ? "Time of day" : k === "surge" ? "Surge" : "Connector"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Station scope">
            <input
              className="input"
              value={rule.stationId}
              onChange={(e) => set("stationId", e.target.value || "all")}
              placeholder="stationId or all"
            />
          </Field>

          {rule.kind === "time_of_day" && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="From hour">
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="input"
                  value={rule.fromHour ?? 0}
                  onChange={(e) => set("fromHour", Number(e.target.value))}
                />
              </Field>
              <Field label="To hour">
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="input"
                  value={rule.toHour ?? 0}
                  onChange={(e) => set("toHour", Number(e.target.value))}
                />
              </Field>
              <Field label="₹ / kWh">
                <input
                  type="number"
                  className="input"
                  value={rule.perKwh ?? 0}
                  onChange={(e) => set("perKwh", Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {rule.kind === "surge" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Utilization threshold (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={rule.utilizationThresholdPct ?? 80}
                  onChange={(e) => set("utilizationThresholdPct", Number(e.target.value))}
                />
              </Field>
              <Field label="Multiplier">
                <input
                  type="number"
                  step="0.05"
                  className="input"
                  value={rule.multiplier ?? 1.25}
                  onChange={(e) => set("multiplier", Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {rule.kind === "connector" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Connector type">
                <select
                  className="input"
                  value={rule.connectorType ?? "ccs"}
                  onChange={(e) => set("connectorType", e.target.value)}
                >
                  <option value="ccs">CCS</option>
                  <option value="chademo">CHAdeMO</option>
                  <option value="type2">Type 2</option>
                  <option value="gbt">GB/T</option>
                  <option value="bharat_ac_001">Bharat AC-001</option>
                  <option value="bharat_dc_001">Bharat DC-001</option>
                </select>
              </Field>
              <Field label="₹ / kWh">
                <input
                  type="number"
                  className="input"
                  value={rule.perKwh ?? 0}
                  onChange={(e) => set("perKwh", Number(e.target.value))}
                />
              </Field>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold"
          >
            Save rule
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </span>
    <div className="mt-1 [&_.input]:w-full [&_.input]:h-9 [&_.input]:rounded-md [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:text-[13px]">
      {children}
    </div>
  </label>
);

export default OperatorPricingScreen;
