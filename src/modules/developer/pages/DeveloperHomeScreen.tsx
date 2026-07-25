// Screen: DEV-01 · Primitives: Identity, Provider
// Developer Portal Home — getting-started cards, quick links, key metrics.

import { Link } from "react-router-dom";
import {
  ArrowRight,
  Book,
  Code2,
  KeyRound,
  Package,
  Terminal,
  Webhook,
  Zap,
} from "lucide-react";
import {
  DevKpi,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useDevApiKeys,
  useDevRequestLogs,
  useDevUsage,
  useDevWebhooks,
} from "@/modules/developer/hooks";

const GETTING_STARTED = [
  {
    icon: KeyRound,
    title: "1 · Create a test key",
    body: "Grab a sandbox key scoped to reservations.read + reservations.write.",
    to: "/developer/keys",
    action: "Go to keys",
  },
  {
    icon: Terminal,
    title: "2 · Fire a sandbox reservation",
    body: "Book a fake charger and see the payment flow end-to-end without a card.",
    to: "/developer/sandbox",
    action: "Open sandbox",
  },
  {
    icon: Webhook,
    title: "3 · Subscribe to a webhook",
    body: "Get reservation.confirmed + session.completed pushed to your endpoint.",
    to: "/developer/webhooks",
    action: "Add webhook",
  },
  {
    icon: Book,
    title: "4 · Read the reference",
    body: "9 endpoints. All requests idempotent. Bearer-token auth. Rate-limit headers on every response.",
    to: "/developer/docs",
    action: "Read the docs",
  },
];

const DeveloperHomeScreen = () => {
  const keys = useDevApiKeys();
  const webhooks = useDevWebhooks();
  const logs = useDevRequestLogs();
  const usage = useDevUsage();

  const isLoading = keys.isLoading || webhooks.isLoading || usage.isLoading;

  const totalRequests7d = (usage.data ?? [])
    .filter((d) => Date.parse(d.date) >= Date.now() - 7 * 86400000)
    .reduce((s, d) => s + d.requests, 0);
  const totalErrors7d = (usage.data ?? [])
    .filter((d) => Date.parse(d.date) >= Date.now() - 7 * 86400000)
    .reduce((s, d) => s + d.errors, 0);
  const activeKeys = (keys.data ?? []).filter((k) => !k.revoked).length;
  const activeHooks = (webhooks.data ?? []).filter((w) => w.active).length;

  return (
    <DeveloperLayout
      title="Developer Portal"
      screenId="DEV-01"
      primitives={["Identity", "Provider"]}
      actions={
        <a
          href="/developer/docs"
          className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-semibold"
        >
          <Book className="w-3.5 h-3.5" /> Read the docs
        </a>
      }
    >
      {isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white p-6">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-widest text-violet-200 font-semibold">
                SmartPark Public API · v1
              </p>
              <h2 className="mt-1 text-2xl font-bold leading-tight">
                Build reservations, sessions, and payouts on top of the SmartPark
                mobility grid.
              </h2>
              <p className="mt-2 text-[13px] text-violet-100">
                REST + webhooks. HMAC-signed events. First 10,000 requests / month
                free.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/developer/keys"
                  className="inline-flex items-center gap-1 h-9 px-4 rounded-md bg-white/95 hover:bg-white text-violet-700 text-[13px] font-semibold"
                >
                  <KeyRound className="w-4 h-4" /> Get a test key
                </Link>
                <Link
                  to="/developer/sandbox"
                  className="inline-flex items-center gap-1 h-9 px-4 rounded-md bg-white/10 hover:bg-white/20 border border-white/30 text-[13px] font-semibold"
                >
                  <Terminal className="w-4 h-4" /> Try the sandbox
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DevKpi label="Active keys" value={String(activeKeys)} hint="live + test" />
            <DevKpi label="Active webhooks" value={String(activeHooks)} />
            <DevKpi label="Requests · 7d" value={totalRequests7d.toLocaleString()} />
            <DevKpi
              label="Errors · 7d"
              value={totalErrors7d.toLocaleString()}
              hint={
                totalRequests7d > 0
                  ? `${((totalErrors7d / totalRequests7d) * 100).toFixed(2)}% rate`
                  : undefined
              }
            />
          </div>

          <DevSection title="Getting started" subtitle="Four steps and you're live">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {GETTING_STARTED.map((s) => (
                <Link
                  to={s.to}
                  key={s.title}
                  className="group border border-slate-200 hover:border-violet-300 hover:shadow-sm rounded-lg p-4 flex gap-3 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-900">
                      {s.title}
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{s.body}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-700 group-hover:underline">
                      {s.action} <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </DevSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DevSection
              title="Latest requests"
              subtitle="Live from the request logger"
              right={
                <Link
                  to="/developer/logs"
                  className="text-[11px] font-semibold text-violet-700 hover:underline"
                >
                  All logs →
                </Link>
              }
            >
              <ul className="divide-y divide-slate-100">
                {(logs.data ?? []).slice(0, 6).map((l) => (
                  <li
                    key={l.id}
                    className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
                  >
                    <span
                      className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                        l.method === "GET"
                          ? "bg-blue-50 text-blue-700"
                          : l.method === "POST"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {l.method}
                    </span>
                    <span className="font-mono truncate flex-1">{l.path}</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        l.statusCode >= 500
                          ? "text-red-600"
                          : l.statusCode >= 400
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {l.statusCode}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {l.latencyMs}ms
                    </span>
                  </li>
                ))}
              </ul>
            </DevSection>

            <DevSection
              title="Docs shortcuts"
              subtitle="Jump straight into the reference"
            >
              <div className="p-4 grid grid-cols-1 gap-2">
                {[
                  {
                    icon: Code2,
                    label: "POST /v1/reservations",
                    hint: "Create a reservation on any station.",
                  },
                  {
                    icon: Zap,
                    label: "POST /v1/sessions/:id/start",
                    hint: "Kick off charging remotely.",
                  },
                  {
                    icon: Package,
                    label: "GET /v1/stations",
                    hint: "Paginated station index.",
                  },
                  {
                    icon: Webhook,
                    label: "POST /v1/webhooks",
                    hint: "Subscribe to lifecycle events.",
                  },
                ].map((x) => (
                  <Link
                    key={x.label}
                    to="/developer/docs"
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
                  >
                    <x.icon className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-mono font-semibold text-slate-900 truncate">
                        {x.label}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {x.hint}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </DevSection>
          </div>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperHomeScreen;
