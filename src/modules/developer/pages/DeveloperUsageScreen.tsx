// Screen: DEV-07 · Primitives: Provider, Notification
// Usage & Rate Limits — per-key consumption charts (recharts).

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DevKpi,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useDevActivePlan,
  useDevApiKeys,
  useDevUsage,
} from "@/modules/developer/hooks";
import { cn } from "@/lib/utils";

const KEY_COLORS = ["#7c3aed", "#0ea5e9", "#22c55e", "#f97316", "#ef4444"];

const DeveloperUsageScreen = () => {
  const usage = useDevUsage();
  const keys = useDevApiKeys();
  const plan = useDevActivePlan();
  const [range, setRange] = useState<"7d" | "30d">("30d");

  const days = range === "7d" ? 7 : 30;

  const byDay = useMemo(() => {
    const list = usage.data ?? [];
    const cutoff = Date.now() - days * 86400000;
    const dateMap = new Map<string, Record<string, number>>();
    list
      .filter((u) => Date.parse(u.date) >= cutoff)
      .forEach((u) => {
        const row = dateMap.get(u.date) ?? { date: u.date };
        row[u.keyId] = (row[u.keyId] ?? 0) + u.requests;
        dateMap.set(u.date, row);
      });
    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [usage.data, days]);

  const perKey = useMemo(() => {
    const list = usage.data ?? [];
    const cutoff = Date.now() - days * 86400000;
    const map = new Map<
      string,
      { requests: number; errors: number; rateLimited: number }
    >();
    list
      .filter((u) => Date.parse(u.date) >= cutoff)
      .forEach((u) => {
        const cur = map.get(u.keyId) ?? { requests: 0, errors: 0, rateLimited: 0 };
        cur.requests += u.requests;
        cur.errors += u.errors;
        cur.rateLimited += u.rateLimitedCount;
        map.set(u.keyId, cur);
      });
    return Array.from(map.entries()).map(([keyId, v]) => ({ keyId, ...v }));
  }, [usage.data, days]);

  const totalRequests = perKey.reduce((s, k) => s + k.requests, 0);
  const totalErrors = perKey.reduce((s, k) => s + k.errors, 0);
  const totalRateLimited = perKey.reduce((s, k) => s + k.rateLimited, 0);
  const included = plan.data?.requestsIncluded ?? 250000;
  const utilization = Math.min(1, totalRequests / included);
  const overage = Math.max(0, totalRequests - included);

  const keyLabel = (id: string) =>
    keys.data?.find((k) => k.id === id)?.label ?? id;

  const keyIds = Array.from(new Set(perKey.map((k) => k.keyId)));

  return (
    <DeveloperLayout
      title="Usage & rate limits"
      screenId="DEV-07"
      primitives={["Provider", "Notification"]}
      actions={
        <div className="flex gap-1">
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "h-8 px-3 rounded-md text-[12px] font-semibold border",
                range === r
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      {usage.isLoading || keys.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DevKpi label="Requests" value={totalRequests.toLocaleString()} />
            <DevKpi
              label="Errors"
              value={totalErrors.toLocaleString()}
              hint={
                totalRequests > 0
                  ? `${((totalErrors / totalRequests) * 100).toFixed(2)}%`
                  : undefined
              }
            />
            <DevKpi
              label="Rate-limited"
              value={totalRateLimited.toLocaleString()}
              hint="HTTP 429"
            />
            <DevKpi
              label="Included budget"
              value={`${(utilization * 100).toFixed(0)}%`}
              hint={overage > 0 ? `Overage ${overage.toLocaleString()}` : "Within plan"}
            />
          </div>

          <DevSection
            title="Requests over time"
            subtitle={`Stacked by API key · last ${days} days`}
          >
            {byDay.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-slate-500">
                No usage yet in this window.
              </div>
            ) : (
              <div className="p-4">
                <div className="w-full h-72">
                  <ResponsiveContainer>
                    <LineChart data={byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {keyIds.map((k, i) => (
                        <Line
                          key={k}
                          type="monotone"
                          dataKey={k}
                          name={keyLabel(k)}
                          stroke={KEY_COLORS[i % KEY_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </DevSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DevSection title="Per-key breakdown">
              {perKey.length === 0 ? (
                <div className="p-10 text-center text-[13px] text-slate-500">
                  No traffic yet.
                </div>
              ) : (
                <div className="p-4 w-full h-64">
                  <ResponsiveContainer>
                    <BarChart
                      data={perKey.map((p) => ({
                        key: keyLabel(p.keyId),
                        Requests: p.requests,
                        Errors: p.errors,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Requests" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </DevSection>

            <DevSection title="Rate limits" subtitle="Per-key hard ceilings">
              <ul className="divide-y divide-slate-100">
                {(keys.data ?? []).map((k, i) => {
                  const total =
                    perKey.find((p) => p.keyId === k.id)?.requests ?? 0;
                  const limit = k.env === "live" ? 20000 : 5000;
                  const pct = Math.min(1, total / (limit * days));
                  return (
                    <li key={k.id} className="px-4 py-3">
                      <div className="flex items-center justify-between text-[12px]">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {k.label}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {limit.toLocaleString()} req/day ·{" "}
                            {k.env === "live" ? "live" : "test"}
                          </p>
                        </div>
                        <p className="text-[12px] font-mono text-slate-700">
                          {total.toLocaleString()} / {(limit * days).toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{
                            width: `${pct * 100}%`,
                            background:
                              KEY_COLORS[i % KEY_COLORS.length],
                          }}
                          className="h-full"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </DevSection>
          </div>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperUsageScreen;
