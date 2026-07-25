// Screen: DEV-04 · Primitives: Reservation, Session, Payment
// Docs & Reference — static interactive API docs. Endpoint list + example JSON.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Search } from "lucide-react";
import {
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import { cn } from "@/lib/utils";

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  category: "Reservations" | "Sessions" | "Stations" | "Payments" | "Webhooks";
  summary: string;
  scopes: string[];
  request: string;
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "post-reservations",
    method: "POST",
    path: "/v1/reservations",
    category: "Reservations",
    summary: "Create a reservation on a parking or charging station.",
    scopes: ["reservations.write"],
    request: `{
  "stationId": "ev-omr-01",
  "chargerType": "ccs",
  "startAt": "2026-03-14T22:00:00Z",
  "durationMinutes": 60,
  "vehicleId": "veh_9f2a"
}`,
    response: `{
  "id": "res_01H8ABCD",
  "status": "confirmed",
  "stationId": "ev-omr-01",
  "chargerId": "ev-omr-01-c1",
  "amount": 600,
  "currency": "INR",
  "expiresAt": "2026-03-14T22:10:00Z"
}`,
  },
  {
    id: "get-reservation",
    method: "GET",
    path: "/v1/reservations/:id",
    category: "Reservations",
    summary: "Retrieve a reservation by ID.",
    scopes: ["reservations.read"],
    request: "",
    response: `{
  "id": "res_01H8ABCD",
  "status": "in_use",
  "sessionId": "sess_A72",
  "amount": 600,
  "currency": "INR"
}`,
  },
  {
    id: "post-session-start",
    method: "POST",
    path: "/v1/sessions/:id/start",
    category: "Sessions",
    summary: "Remote-start a session for a confirmed reservation.",
    scopes: ["sessions.write"],
    request: `{
  "connectorId": "ev-omr-01-c1"
}`,
    response: `{
  "id": "sess_A72",
  "status": "in_progress",
  "startedAt": "2026-03-14T22:03:11Z"
}`,
  },
  {
    id: "post-session-stop",
    method: "POST",
    path: "/v1/sessions/:id/stop",
    category: "Sessions",
    summary: "Remote-stop an active session.",
    scopes: ["sessions.write"],
    request: `{}`,
    response: `{
  "id": "sess_A72",
  "status": "completed",
  "kwhDelivered": 34.2,
  "amount": 748
}`,
  },
  {
    id: "get-stations",
    method: "GET",
    path: "/v1/stations",
    category: "Stations",
    summary: "Paginated station index. Supports geo filters.",
    scopes: ["stations.read"],
    request: "",
    response: `{
  "data": [
    { "id": "ev-omr-01", "name": "OMR Sipcot Hub", "status": "online" }
  ],
  "hasMore": true,
  "cursor": "cur_02"
}`,
  },
  {
    id: "post-payment-refund",
    method: "POST",
    path: "/v1/payments/:id/refunds",
    category: "Payments",
    summary: "Issue a refund up to the original amount.",
    scopes: ["payments.read"],
    request: `{
  "amount": 400,
  "reason": "duplicate_charge"
}`,
    response: `{
  "id": "rfnd_9f",
  "paymentId": "pay_A88",
  "amount": 400,
  "status": "refunded"
}`,
  },
  {
    id: "post-webhook",
    method: "POST",
    path: "/v1/webhooks",
    category: "Webhooks",
    summary: "Subscribe an endpoint to lifecycle events.",
    scopes: ["webhooks.write"],
    request: `{
  "url": "https://ops.example.com/hooks/smartpark",
  "events": ["reservation.confirmed", "session.completed"]
}`,
    response: `{
  "id": "wh_01H8",
  "secret": "whsec_live_****3f81",
  "active": true
}`,
  },
];

const METHOD_STYLES: Record<Method, string> = {
  GET: "bg-blue-50 text-blue-700",
  POST: "bg-emerald-50 text-emerald-700",
  PUT: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

const DeveloperDocsScreen = () => {
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENDPOINTS;
    return ENDPOINTS.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [query]);

  const selected = ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <DeveloperLayout
      title="Docs & Reference"
      screenId="DEV-04"
      primitives={["Reservation", "Session", "Payment"]}
    >
      <DevPageBody>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <DevSection title="Endpoints" subtitle={`${filtered.length} of ${ENDPOINTS.length}`}>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  placeholder="Search endpoints…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 text-[12px]"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-slate-500">
                No endpoints match.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 flex items-start gap-2",
                        e.id === selectedId ? "bg-violet-50" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase rounded px-1.5 py-0.5 mt-0.5",
                          METHOD_STYLES[e.method],
                        )}
                      >
                        {e.method}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="text-[12px] font-mono font-semibold text-slate-900 truncate">
                          {e.path}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {e.category}
                        </p>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DevSection>

          <DevSection
            title={`${selected.method}  ${selected.path}`}
            subtitle={selected.summary}
            right={
              <div className="flex flex-wrap gap-1">
                {selected.scopes.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono bg-slate-100 text-slate-700 rounded px-1.5 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>
            }
          >
            <div className="p-4 space-y-4">
              {selected.request && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                      Request body
                    </p>
                    <button
                      onClick={() => copy(selected.request)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="text-[12px] font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                    {selected.request}
                  </pre>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                    200 Response
                  </p>
                  <button
                    onClick={() => copy(selected.response)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="text-[12px] font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">
                  {selected.response}
                </pre>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12px] text-slate-600">
                <span className="font-semibold text-slate-800">Auth:</span>{" "}
                <code className="text-[11px] bg-white border border-slate-200 rounded px-1 py-0.5">
                  Authorization: Bearer sk_live_...
                </code>{" "}
                · Idempotency-Key optional but recommended on POSTs · rate limit
                headers on every response.
              </div>
            </div>
          </DevSection>
        </div>
      </DevPageBody>
    </DeveloperLayout>
  );
};

export default DeveloperDocsScreen;
