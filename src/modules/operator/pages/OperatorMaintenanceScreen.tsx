// Screen: CO-10 · Primitives: Provider
// Maintenance Log — field-tech visits, work orders.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";
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
  useAdvanceMaintenance,
  useCreateMaintenanceOrder,
  useMaintenanceOrders,
  useStationSummaries,
} from "@/modules/operator/hooks";
import type {
  MaintenanceStatus,
  MaintenanceWorkOrder,
} from "@/modules/operator/types";
import { cn } from "@/lib/utils";

const OperatorMaintenanceScreen = () => {
  const orders = useMaintenanceOrders();
  const stations = useStationSummaries();
  const advance = useAdvanceMaintenance();
  const create = useCreateMaintenanceOrder();

  const [creating, setCreating] = useState(false);
  const [stationId, setStationId] = useState("");
  const [issue, setIssue] = useState("");
  const [severity, setSeverity] = useState<MaintenanceWorkOrder["severity"]>("medium");

  const stationMap = useMemo(() => {
    const m = new Map<string, string>();
    (stations.data ?? []).forEach((s) => m.set(s.stationId, s.name));
    return m;
  }, [stations.data]);

  const groups: Record<MaintenanceStatus, MaintenanceWorkOrder[]> = useMemo(() => {
    const g: Record<MaintenanceStatus, MaintenanceWorkOrder[]> = {
      open: [],
      dispatched: [],
      on_site: [],
      resolved: [],
    };
    (orders.data ?? []).forEach((o) => g[o.status].push(o));
    return g;
  }, [orders.data]);

  const next: Record<MaintenanceStatus, MaintenanceStatus> = {
    open: "dispatched",
    dispatched: "on_site",
    on_site: "resolved",
    resolved: "resolved",
  };

  const submit = async () => {
    if (!stationId || !issue.trim()) {
      return toast.error("Pick a station and describe the issue");
    }
    await create.mutateAsync({ stationId, issue: issue.trim(), severity });
    toast.success("Work order opened");
    setCreating(false);
    setStationId("");
    setIssue("");
  };

  return (
    <OperatorLayout
      title="Maintenance"
      screenId="CO-10"
      primitives={["Provider"]}
      actions={
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700"
        >
          <Plus className="w-3.5 h-3.5" /> Log issue
        </button>
      }
    >
      {orders.isLoading ? (
        <OperatorLoading />
      ) : (
        <OperatorPageBody>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
            {(["open", "dispatched", "on_site", "resolved"] as MaintenanceStatus[]).map((s) => (
              <OperatorSection
                key={s}
                title={
                  s === "open"
                    ? "Open"
                    : s === "dispatched"
                      ? "Tech dispatched"
                      : s === "on_site"
                        ? "On site"
                        : "Resolved"
                }
                subtitle={`${groups[s].length} orders`}
              >
                {groups[s].length === 0 ? (
                  <p className="p-6 text-center text-[11px] text-slate-400">Empty</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {groups[s].slice(0, 6).map((o) => (
                      <li key={o.id} className="px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-slate-800 truncate">
                              {o.issue}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {stationMap.get(o.stationId) ?? o.stationId}
                            </p>
                          </div>
                          <SevBadge sev={o.severity} />
                        </div>
                        {s !== "resolved" && (
                          <button
                            onClick={() => advance.mutateAsync({ id: o.id, status: next[s] })}
                            className="mt-1.5 text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            → {next[s].replace("_", " ")}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </OperatorSection>
            ))}
          </div>

          <OperatorSection
            title={`All work orders (${(orders.data ?? []).length})`}
            subtitle="Chronological; SLA target 240 min per issue"
          >
            {(orders.data ?? []).length === 0 ? (
              <OperatorEmpty title="No work orders" body="File one via Log issue." icon={Wrench} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Opened</TableHead>
                    <TableHead className="text-[11px]">Station</TableHead>
                    <TableHead className="text-[11px]">Issue</TableHead>
                    <TableHead className="text-[11px]">Severity</TableHead>
                    <TableHead className="text-[11px]">Tech</TableHead>
                    <TableHead className="text-[11px]">Parts</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data?.map((o) => (
                    <TableRow key={o.id} className="text-[12px]">
                      <TableCell className="py-2">
                        {new Date(o.openedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2">
                        {stationMap.get(o.stationId) ?? o.stationId}
                      </TableCell>
                      <TableCell className="py-2 max-w-[260px] truncate">
                        {o.issue}
                      </TableCell>
                      <TableCell className="py-2">
                        <SevBadge sev={o.severity} />
                      </TableCell>
                      <TableCell className="py-2">{o.fieldTech ?? "—"}</TableCell>
                      <TableCell className="py-2 text-slate-500">
                        {o.partsUsed.length ? o.partsUsed.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                            o.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700"
                              : o.status === "open"
                                ? "bg-red-50 text-red-700"
                                : o.status === "on_site"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </OperatorSection>
        </OperatorPageBody>
      )}

      {creating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[15px] font-bold text-slate-900">Log a maintenance issue</h3>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Station
                </span>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-[13px]"
                >
                  <option value="">Select a station</option>
                  {stations.data?.map((s) => (
                    <option key={s.stationId} value={s.stationId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Issue
                </span>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-[13px]"
                  placeholder="e.g. Cable retractor jammed on CCS gun 1"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                  Severity
                </span>
                <div className="mt-1 flex gap-1.5">
                  {(["low", "medium", "high"] as MaintenanceWorkOrder["severity"][]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "h-8 px-3 rounded-md text-[11px] font-semibold border",
                        severity === s
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-200",
                      )}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setCreating(false)}
                className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold"
              >
                Open order
              </button>
            </div>
          </div>
        </div>
      )}
    </OperatorLayout>
  );
};

const SevBadge = ({ sev }: { sev: MaintenanceWorkOrder["severity"] }) => {
  const map = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
  } as const;
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
        map[sev],
      )}
    >
      {sev}
    </span>
  );
};

export default OperatorMaintenanceScreen;
