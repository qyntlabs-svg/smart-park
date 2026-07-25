// Screen: DEV-06 · Primitives: Reservation, Session, Payment
// Logs & Debugger — request/response inspector.

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DevEmpty,
  DevLoading,
  DevPageBody,
  DevSection,
  DeveloperLayout,
} from "@/modules/developer/components/DeveloperLayout";
import {
  useDevApiKeys,
  useDevRequestLogs,
} from "@/modules/developer/hooks";
import { cn } from "@/lib/utils";
import type { DevRequestLog } from "@/modules/developer/types";

type StatusBucket = "all" | "2xx" | "4xx" | "5xx";

const DeveloperLogsScreen = () => {
  const logs = useDevRequestLogs();
  const keys = useDevApiKeys();

  const [status, setStatus] = useState<StatusBucket>("all");
  const [keyId, setKeyId] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<DevRequestLog | null>(null);

  const filtered = useMemo(() => {
    const list = (logs.data ?? []).slice();
    const query = q.trim().toLowerCase();
    return list.filter((l) => {
      if (status === "2xx" && !(l.statusCode >= 200 && l.statusCode < 300))
        return false;
      if (status === "4xx" && !(l.statusCode >= 400 && l.statusCode < 500))
        return false;
      if (status === "5xx" && l.statusCode < 500) return false;
      if (keyId !== "all" && l.keyId !== keyId) return false;
      if (query && !`${l.method} ${l.path}`.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [logs.data, status, keyId, q]);

  return (
    <DeveloperLayout
      title="Logs & Debugger"
      screenId="DEV-06"
      primitives={["Reservation", "Session", "Payment"]}
    >
      {logs.isLoading ? (
        <DevLoading />
      ) : (
        <DevPageBody>
          <DevSection
            title="Filters"
            subtitle={`${filtered.length} of ${(logs.data ?? []).length} requests`}
          >
            <div className="p-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Status
                </span>
                <div className="mt-1 flex gap-1">
                  {(["all", "2xx", "4xx", "5xx"] as StatusBucket[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setStatus(b)}
                      className={cn(
                        "h-8 px-2.5 rounded-md text-[11px] font-semibold border",
                        status === b
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-white text-slate-600 border-slate-200",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Key
                </span>
                <select
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="mt-1 h-8 rounded-md border border-slate-200 px-2 text-[12px]"
                >
                  <option value="all">All keys</option>
                  {(keys.data ?? []).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block flex-1 min-w-[220px]">
                <span className="text-[11px] uppercase text-slate-500 font-semibold">
                  Search
                </span>
                <div className="mt-1 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 text-[12px]"
                    placeholder="method or path"
                  />
                </div>
              </label>
            </div>
          </DevSection>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            <DevSection title="Requests">
              {filtered.length === 0 ? (
                <DevEmpty
                  title="No matching requests"
                  body="Adjust filters or wait for new traffic."
                />
              ) : (
                <div className="max-h-[65vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/60 sticky top-0">
                        <TableHead className="text-[11px]">Method</TableHead>
                        <TableHead className="text-[11px]">Path</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px]">Latency</TableHead>
                        <TableHead className="text-[11px]">Key</TableHead>
                        <TableHead className="text-[11px]">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((l) => (
                        <TableRow
                          key={l.id}
                          onClick={() => setSelected(l)}
                          className={cn(
                            "cursor-pointer text-[12px]",
                            selected?.id === l.id && "bg-violet-50",
                          )}
                        >
                          <TableCell className="py-2">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                                l.method === "GET"
                                  ? "bg-blue-50 text-blue-700"
                                  : l.method === "POST"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {l.method}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 font-mono">
                            {l.path}
                          </TableCell>
                          <TableCell className="py-2">
                            <span
                              className={cn(
                                "font-semibold",
                                l.statusCode >= 500
                                  ? "text-red-600"
                                  : l.statusCode >= 400
                                    ? "text-amber-600"
                                    : "text-emerald-600",
                              )}
                            >
                              {l.statusCode}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 font-mono">
                            {l.latencyMs}ms
                          </TableCell>
                          <TableCell className="py-2 font-mono truncate max-w-[120px]">
                            {l.keyId ?? "—"}
                          </TableCell>
                          <TableCell className="py-2 text-slate-500">
                            {new Date(l.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DevSection>

            <DevSection
              title={selected ? `${selected.method} ${selected.path}` : "Request inspector"}
              subtitle={
                selected
                  ? `${selected.statusCode} · ${selected.latencyMs}ms`
                  : "Click a row to inspect"
              }
              right={selected && <Filter className="w-4 h-4 text-slate-400" />}
            >
              {!selected ? (
                <DevEmpty
                  title="No request selected"
                  body="Click any row on the left to see its full request / response body."
                />
              ) : (
                <div className="p-4 space-y-3 text-[12px]">
                  <div>
                    <p className="uppercase text-[10px] tracking-wide font-semibold text-slate-500">
                      Request body
                    </p>
                    <pre className="mt-1 bg-slate-900 text-slate-100 rounded-md p-2 text-[11px] font-mono overflow-x-auto">
                      {selected.requestBody ?? "(none)"}
                    </pre>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] tracking-wide font-semibold text-slate-500">
                      Response body
                    </p>
                    <pre className="mt-1 bg-slate-900 text-slate-100 rounded-md p-2 text-[11px] font-mono overflow-x-auto">
                      {selected.responseBody ?? "(none)"}
                    </pre>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] tracking-wide font-semibold text-slate-500">
                      Meta
                    </p>
                    <ul className="mt-1 space-y-0.5 text-slate-600">
                      <li>
                        Request ID:{" "}
                        <span className="font-mono">{selected.id}</span>
                      </li>
                      <li>
                        Key ID:{" "}
                        <span className="font-mono">
                          {selected.keyId ?? "—"}
                        </span>
                      </li>
                      <li>
                        When:{" "}
                        <span className="font-mono">
                          {new Date(selected.createdAt).toISOString()}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </DevSection>
          </div>
        </DevPageBody>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperLogsScreen;
