// Screen: V-20 · Primitives: Pricing
// Route: /partner/pricing-rules

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Percent,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  Gift,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import { Switch } from "@/components/ui/switch";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  useDeleteTimeRule,
  usePricingConfigs,
  useUpdatePricingConfig,
  useUpsertTimeRule,
} from "./hooks";
import {
  DAYS_SHORT,
  KIND_LABEL,
  type ListingKind,
  type PricingConfig,
  type TimeOfDayRule,
} from "./types";

const PartnerPricingRulesScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: configs = [], isLoading, isError } = usePricingConfigs(partnerId);
  const updateConfig = useUpdatePricingConfig();
  const upsertRule = useUpsertTimeRule();
  const deleteRule = useDeleteTimeRule();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | ListingKind>("all");

  const filtered =
    kindFilter === "all"
      ? configs
      : configs.filter((c) => c.kind === kindFilter);

  const toggleSurge = async (cfg: PricingConfig, enabled: boolean) => {
    await updateConfig.mutateAsync({
      partnerId,
      listingId: cfg.listingId,
      patch: { surgeEnabled: enabled },
    });
  };

  const toggleSubsidy = async (cfg: PricingConfig, enabled: boolean) => {
    await updateConfig.mutateAsync({
      partnerId,
      listingId: cfg.listingId,
      patch: { subsidyEnabled: enabled },
    });
  };

  const addRule = async (cfg: PricingConfig) => {
    await upsertRule.mutateAsync({
      partnerId,
      listingId: cfg.listingId,
      rule: {
        label: "New window",
        startHour: 17,
        endHour: 22,
        multiplier: 1.25,
        daysOfWeek: [1, 2, 3, 4, 5],
        enabled: true,
      },
    });
    toast.success("Time window added");
  };

  const removeRule = async (cfg: PricingConfig, ruleId: string) => {
    if (!window.confirm("Remove this time-of-day rule?")) return;
    await deleteRule.mutateAsync({
      partnerId,
      listingId: cfg.listingId,
      ruleId,
    });
    toast.success("Rule removed");
  };

  const toggleRule = async (
    cfg: PricingConfig,
    rule: TimeOfDayRule,
    enabled: boolean,
  ) => {
    await upsertRule.mutateAsync({
      partnerId,
      listingId: cfg.listingId,
      rule: { ...rule, enabled },
    });
  };

  return (
    <PartnerScreenLayout title="Pricing Rules" icon={Percent}>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(["all", "parking", "ev", "rental"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setKindFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold border ${
              kindFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : KIND_LABEL[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load pricing configs
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <Percent className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No listings to configure pricing for
          </p>
        </div>
      ) : (
        filtered.map((cfg) => (
          <motion.div
            layout
            key={cfg.listingId}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedId((prev) => (prev === cfg.listingId ? null : cfg.listingId))
              }
              className="w-full text-left p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {cfg.listingName}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    {KIND_LABEL[cfg.kind]} · ₹{cfg.basePrice}/{cfg.baseUnit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {cfg.surgeEnabled && (
                    <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                      Surge
                    </span>
                  )}
                  {cfg.subsidyEnabled && (
                    <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">
                      Subsidy
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedId === cfg.listingId ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedId === cfg.listingId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border bg-secondary/40"
                >
                  <div className="p-4 space-y-4">
                    <ToggleRow
                      icon={TrendingUp}
                      label="Surge multiplier"
                      hint={`Auto-raises up to ${cfg.surgeMaxMultiplier}× during peak demand`}
                      value={cfg.surgeEnabled}
                      onChange={(v) => toggleSurge(cfg, v)}
                    />
                    <ToggleRow
                      icon={Gift}
                      label={cfg.subsidyLabel}
                      hint={`${cfg.subsidyDiscountPct}% off during promotion windows`}
                      value={cfg.subsidyEnabled}
                      onChange={(v) => toggleSubsidy(cfg, v)}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                          Time-of-day windows
                        </p>
                        <button
                          onClick={() => addRule(cfg)}
                          className="text-caption font-semibold text-primary flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      {cfg.timeOfDay.length === 0 ? (
                        <p className="text-caption text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                          No time windows configured
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {cfg.timeOfDay.map((r) => (
                            <div
                              key={r.id}
                              className="p-3 rounded-xl bg-card border border-border"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-body-sm font-bold text-foreground truncate">
                                    {r.label}
                                  </p>
                                  <p className="text-caption text-muted-foreground">
                                    {formatHour(r.startHour)} – {formatHour(r.endHour)} ·{" "}
                                    {r.multiplier}×
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={r.enabled}
                                    onCheckedChange={(v) => toggleRule(cfg, r, v)}
                                  />
                                  <button
                                    onClick={() => removeRule(cfg, r.id)}
                                    className="p-2 text-destructive"
                                    aria-label="Delete rule"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {DAYS_SHORT.map((d, i) => (
                                  <span
                                    key={d}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                      r.daysOfWeek.includes(i)
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <MobileButton
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() =>
                        toast.success(
                          `Preview: base ₹${cfg.basePrice}, peak up to ₹${Math.round(cfg.basePrice * cfg.surgeMaxMultiplier)}`,
                        )
                      }
                    >
                      Simulate current price
                    </MobileButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      )}
    </PartnerScreenLayout>
  );
};

const ToggleRow = ({
  icon: Icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: typeof Percent;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-body-sm font-bold text-foreground truncate">{label}</p>
        <p className="text-caption text-muted-foreground">{hint}</p>
      </div>
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

const formatHour = (h: number) =>
  `${String(h).padStart(2, "0")}:00`;

export default PartnerPricingRulesScreen;
