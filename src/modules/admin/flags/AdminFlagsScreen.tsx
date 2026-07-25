// Screen: A-10 · Primitives: — (config domain)
// Route: /admin/flags

import { Flag, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import { useAdminFlags, useUpdateAdminFlag } from "./hooks";
import { ALL_CITIES, type FeatureFlag } from "./types";

const AdminFlagsScreen = () => {
  const updatedBy = useAuthStore((s) => s.user?.name ?? s.user?.id ?? "admin");
  const { data: flags = [], isLoading, isError } = useAdminFlags();
  const update = useUpdateAdminFlag();

  const setFlag = async (key: string, patch: Partial<FeatureFlag>) => {
    await update.mutateAsync({ key, patch, updatedBy });
    toast.success("Flag updated");
  };

  return (
    <AdminLayout
      title="Feature Flags"
      subtitle="Toggle features and roll out per city"
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-body-sm text-destructive">Couldn't load flags</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {flags.map((f) => (
            <div key={f.key} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {f.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {f.description}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    {f.key}
                  </p>
                </div>
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(v) => setFlag(f.key, { enabled: v })}
                />
              </div>

              {f.kind === "rollout" && f.enabled && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-caption text-muted-foreground">
                      Rollout
                    </p>
                    <p className="text-body-sm font-bold text-foreground">
                      {f.rolloutPct ?? 0}%
                    </p>
                  </div>
                  <Slider
                    value={[f.rolloutPct ?? 0]}
                    max={100}
                    step={5}
                    className="mt-2"
                    onValueChange={(v) =>
                      setFlag(f.key, { rolloutPct: v[0] })
                    }
                  />
                </div>
              )}

              {f.kind === "city_list" && f.enabled && (
                <div className="mt-3">
                  <p className="text-caption text-muted-foreground mb-1.5">
                    Rolled out to cities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CITIES.map((c) => {
                      const on = f.cities?.includes(c);
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            const cities = on
                              ? (f.cities ?? []).filter((x) => x !== c)
                              : [...(f.cities ?? []), c];
                            setFlag(f.key, { cities });
                          }}
                          className={`text-caption font-semibold px-2 py-1 rounded-lg border ${
                            on
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-card border-border text-muted-foreground"
                          }`}
                        >
                          {on && <Check className="w-3 h-3 inline mr-1" />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-3">
                Updated{" "}
                {new Date(f.updatedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {f.updatedBy ? ` by ${f.updatedBy}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFlagsScreen;
