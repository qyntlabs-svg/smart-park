// Screen: DEV-09 · Primitives: Provider, Identity
// App Store / Integrations — partner-built apps on top of the SmartPark API.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Star, Store } from "lucide-react";
import {
  DevEmpty,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import { useDevPartnerApps } from "@/modules/developer/hooks";
import { SCOPE_LABEL, type ApiKeyScope } from "@/modules/developer/types";
import { cn } from "@/lib/utils";

const DeveloperAppsScreen = () => {
  const apps = useDevPartnerApps();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((apps.data ?? []).map((a) => a.category)))],
    [apps.data],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (apps.data ?? []).filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (
        query &&
        !`${a.name} ${a.publisher} ${a.description}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      return true;
    });
  }, [apps.data, q, category]);

  const featured = filtered.filter((a) => a.featured);
  const others = filtered.filter((a) => !a.featured);

  return (
    <DeveloperLayout
      title="App Store"
      screenId="DEV-09"
      primitives={["Provider", "Identity"]}
    >
      {apps.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <DevSection title="Browse partner apps" subtitle={`${(apps.data ?? []).length} listings`}>
            <div className="p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, publisher, description…"
                  className="w-full h-9 pl-8 pr-3 rounded-md border border-slate-200 text-[13px]"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "h-8 px-3 rounded-md text-[12px] font-semibold border shrink-0",
                      category === c
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-slate-600 border-slate-200",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </DevSection>

          {featured.length > 0 && (
            <DevSection title="Featured" subtitle="Hand-picked by the SmartPark team">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {featured.map((a) => (
                  <AppCard key={a.id} app={a} />
                ))}
              </div>
            </DevSection>
          )}

          {others.length > 0 ? (
            <DevSection title="All apps">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {others.map((a) => (
                  <AppCard key={a.id} app={a} />
                ))}
              </div>
            </DevSection>
          ) : filtered.length === 0 ? (
            <DevSection title="No results">
              <DevEmpty
                title="Nothing matches those filters"
                body="Try clearing search or picking a different category."
              />
            </DevSection>
          ) : null}
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

const AppCard = ({
  app,
}: {
  app: {
    id: string;
    name: string;
    publisher: string;
    category: string;
    installs: number;
    rating: number;
    description: string;
    logoColor: string;
    scopes: ApiKeyScope[];
  };
}) => (
  <div className="rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-sm transition p-4 flex gap-3">
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0"
      style={{ background: app.logoColor }}
    >
      <Store className="w-6 h-6" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900 truncate">
            {app.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            by {app.publisher} · {app.category}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold shrink-0">
          <Star className="w-3 h-3 fill-current" /> {app.rating.toFixed(1)}
        </div>
      </div>
      <p className="text-[12px] text-slate-600 mt-2 line-clamp-3">
        {app.description}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {app.scopes.slice(0, 3).map((s) => (
          <span
            key={s}
            className="text-[10px] font-mono bg-slate-100 text-slate-700 rounded px-1.5 py-0.5"
          >
            {SCOPE_LABEL[s]}
          </span>
        ))}
        {app.scopes.length > 3 && (
          <span className="text-[10px] text-slate-500">
            +{app.scopes.length - 3} more
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {app.installs.toLocaleString()} installs
        </span>
        <button
          onClick={() => toast.success(`${app.name} · install queued`)}
          className="h-7 px-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold"
        >
          Install
        </button>
      </div>
    </div>
  </div>
);

export default DeveloperAppsScreen;
