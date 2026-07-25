// Screen: A-11 · Primitives: Pricing, Payment
// Route: /admin/pricing-rules

import { useState } from "react";
import { Percent, Loader2, Save, Gift, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import {
  usePromos,
  useSubsidies,
  useTakeRates,
  useToggleSubsidy,
  useTogglePromo,
  useUpdateTakeRate,
} from "./hooks";
import type { TakeRate } from "./types";

const KIND_LABEL: Record<TakeRate["kind"], string> = {
  parking: "Parking",
  ev: "EV",
  mechanic: "Mechanic",
  tow: "Tow / SOS",
  rental: "Rental",
};

const AdminPricingRulesScreen = () => {
  const { data: takes = [], isLoading: loadingTakes } = useTakeRates();
  const { data: subsidies = [] } = useSubsidies();
  const { data: promos = [] } = usePromos();
  const updateTake = useUpdateTakeRate();
  const toggleSub = useToggleSubsidy();
  const togglePromo = useTogglePromo();

  const [drafts, setDrafts] = useState<Record<string, TakeRate>>({});
  const getDraft = (t: TakeRate) => drafts[t.kind] ?? t;
  const setDraft = (kind: TakeRate["kind"], patch: Partial<TakeRate>) => {
    setDrafts((prev) => ({
      ...prev,
      [kind]: { ...(prev[kind] ?? takes.find((x) => x.kind === kind)!), ...patch },
    }));
  };

  const save = async (kind: TakeRate["kind"]) => {
    const draft = drafts[kind];
    if (!draft) return;
    await updateTake.mutateAsync({
      kind,
      patch: { percentage: draft.percentage, minFee: draft.minFee },
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[kind];
      return next;
    });
    toast.success(`${KIND_LABEL[kind]} take-rate saved`);
  };

  return (
    <AdminLayout
      title="Platform Pricing Rules"
      subtitle="Take-rates, subsidies, and promo campaigns"
    >
      {/* Take rates */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-primary" /> Platform take-rates
        </p>
        {loadingTakes ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {takes.map((t) => {
              const d = getDraft(t);
              const dirty = drafts[t.kind] != null;
              return (
                <div
                  key={t.kind}
                  className="p-3 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-body-sm font-bold text-foreground">
                      {KIND_LABEL[t.kind]}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Updated{" "}
                      {new Date(t.updatedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-caption text-muted-foreground">
                        % take
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={d.percentage}
                        onChange={(e) =>
                          setDraft(t.kind, { percentage: +e.target.value })
                        }
                        className="w-full h-10 mt-1 rounded-lg border border-border bg-card px-3 text-body-sm"
                      />
                    </div>
                    <div>
                      <label className="text-caption text-muted-foreground">
                        Min fee (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={d.minFee}
                        onChange={(e) =>
                          setDraft(t.kind, { minFee: +e.target.value })
                        }
                        className="w-full h-10 mt-1 rounded-lg border border-border bg-card px-3 text-body-sm"
                      />
                    </div>
                  </div>
                  {dirty && (
                    <MobileButton
                      size="sm"
                      className="mt-3 gap-1.5"
                      onClick={() => save(t.kind)}
                      loading={updateTake.isPending}
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </MobileButton>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subsidies */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" /> Subsidies
        </p>
        <div className="space-y-2">
          {subsidies.map((s) => {
            const spentPct = Math.min(100, Math.round((s.spent / s.budget) * 100));
            return (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-background border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-body-sm font-bold text-foreground truncate">
                      {s.name}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {s.description}
                    </p>
                    <p className="text-caption text-muted-foreground mt-1">
                      ₹{s.spent.toLocaleString()} / ₹{s.budget.toLocaleString()} spent
                    </p>
                  </div>
                  <Switch
                    checked={s.active}
                    onCheckedChange={() => {
                      toggleSub.mutate(s.id);
                    }}
                  />
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${
                      spentPct > 90 ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Promo campaigns */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-body-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> Promo campaigns
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Code</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-right px-3 py-2">Discount</th>
                <th className="text-right px-3 py-2">Redemptions</th>
                <th className="text-right px-3 py-2">Budget used</th>
                <th className="text-left px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-foreground">{p.code}</td>
                  <td className="px-3 py-2 text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-right text-foreground">
                    {p.discountPct}% (max ₹{p.maxOffAmount})
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">
                    {p.redemptions}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">
                    ₹{(p.redemptions * p.maxOffAmount).toLocaleString()} / ₹
                    {p.budget.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={p.active}
                      onCheckedChange={() => togglePromo.mutate(p.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPricingRulesScreen;
