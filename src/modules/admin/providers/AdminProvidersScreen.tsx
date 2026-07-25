// Screen: A-04 · Primitives: Provider
// Route: /admin/providers

import { useState } from "react";
import {
  Building2,
  Loader2,
  Search,
  Star,
  Pause,
  Play,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { MobileButton } from "@/components/ui/mobile-button";
import AdminLayout from "@/modules/admin/components/AdminLayout";
import { useProviders, useSetProviderState } from "./hooks";
import {
  STATE_LABEL,
  TAB_LABEL,
  type ProviderState,
  type ProviderTab,
} from "./types";

const AdminProvidersScreen = () => {
  const [tab, setTab] = useState<ProviderTab>("parking");
  const [query, setQuery] = useState("");
  const { data: providers = [], isLoading, isError } = useProviders(tab, query);
  const setState = useSetProviderState();

  const toggle = async (id: string, current: ProviderState) => {
    const next: ProviderState = current === "active" ? "paused" : "active";
    await setState.mutateAsync({ id, state: next });
    toast.success(`Provider ${next}`);
  };

  const suspend = async (id: string) => {
    if (!window.confirm("Suspend this provider? They will not receive bookings."))
      return;
    await setState.mutateAsync({
      id,
      state: "suspended",
      note: "Suspended pending review — contact support.",
    });
    toast.success("Provider suspended");
  };

  return (
    <AdminLayout
      title="Provider Directory"
      subtitle="Searchable directory of every supply-side account"
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(TAB_LABEL) as ProviderTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold border ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, or phone"
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-body-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-body-sm text-destructive">
          Couldn't load provider directory
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 rounded-2xl border border-dashed border-border text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            No providers match your search
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="bg-secondary/60 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Provider</th>
                  <th className="text-left px-4 py-3">City</th>
                  <th className="text-left px-4 py-3">Listings</th>
                  <th className="text-left px-4 py-3">Rating</th>
                  <th className="text-right px-4 py-3">GMV (30d)</th>
                  <th className="text-left px-4 py-3">State</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-caption text-muted-foreground truncate">
                        {p.contact}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.city}</td>
                    <td className="px-4 py-3 text-foreground">{p.listings}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {p.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      ₹{p.gmv30d.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={p.state} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {p.state !== "suspended" && (
                          <MobileButton
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => toggle(p.id, p.state)}
                            loading={setState.isPending}
                          >
                            {p.state === "active" ? (
                              <>
                                <Pause className="w-3.5 h-3.5" /> Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" /> Activate
                              </>
                            )}
                          </MobileButton>
                        )}
                        {p.state !== "suspended" && (
                          <MobileButton
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => suspend(p.id)}
                            loading={setState.isPending}
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </MobileButton>
                        )}
                        {p.state === "suspended" && (
                          <MobileButton
                            size="sm"
                            variant="success"
                            className="gap-1"
                            onClick={() => toggle(p.id, p.state)}
                            loading={setState.isPending}
                          >
                            <Play className="w-3.5 h-3.5" /> Reinstate
                          </MobileButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const StateBadge = ({ state }: { state: ProviderState }) => {
  const map: Record<ProviderState, string> = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    suspended: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full ${map[state]}`}>
      {STATE_LABEL[state]}
    </span>
  );
};

export default AdminProvidersScreen;
