// Screen: CO-11 · Primitives: Provider
// Firmware & OTA — push firmware to chargers (mock queue).

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Monitor, Rocket, Upload } from "lucide-react";
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
  useAdvanceFirmwareJobs,
  useFirmwareBundles,
  useFirmwareJobs,
  useQueueFirmwareJob,
  useStationSummaries,
} from "@/modules/operator/hooks";
import type { FirmwareJobStatus } from "@/modules/operator/types";
import { cn } from "@/lib/utils";

const OperatorFirmwareScreen = () => {
  const bundles = useFirmwareBundles();
  const jobs = useFirmwareJobs();
  const stations = useStationSummaries();
  const queue = useQueueFirmwareJob();
  const advance = useAdvanceFirmwareJobs();

  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [selectedStations, setSelectedStations] = useState<Set<string>>(new Set());

  // CO-11: animate progress of any queued/in_progress firmware jobs every second.
  const hasActive = (jobs.data ?? []).some(
    (j) => j.status === "in_progress" || j.status === "queued",
  );
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => {
      advance.mutate();
    }, 1000);
    return () => clearInterval(t);
    // Recreate the interval whenever we transition between "has active" and "no active".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  const stationMap = useMemo(() => {
    const m = new Map<string, string>();
    (stations.data ?? []).forEach((s) => m.set(s.stationId, s.name));
    return m;
  }, [stations.data]);

  const bundleMap = useMemo(() => {
    const m = new Map<string, { version: string; channel: string }>();
    (bundles.data ?? []).forEach((b) =>
      m.set(b.id, { version: b.version, channel: b.channel }),
    );
    return m;
  }, [bundles.data]);

  const pushToStations = async () => {
    if (!selectedBundle) return toast.error("Pick a firmware bundle");
    if (selectedStations.size === 0) return toast.error("Pick at least one station");
    for (const stationId of selectedStations) {
      await queue.mutateAsync({ stationId, bundleId: selectedBundle });
    }
    toast.success(`Queued OTA push to ${selectedStations.size} station(s)`);
    setSelectedStations(new Set());
  };

  if (bundles.isLoading || jobs.isLoading || stations.isLoading)
    return (
      <OperatorLayout title="Firmware / OTA" screenId="CO-11" primitives={["Provider"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  return (
    <OperatorLayout
      title="Firmware & OTA"
      screenId="CO-11"
      primitives={["Provider"]}
      actions={
        <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
          Phase 3 preview
        </span>
      }
    >
      <OperatorPageBody>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          <OperatorSection title="Available bundles" subtitle="Stable + beta channels">
            <ul className="divide-y divide-slate-100">
              {bundles.data?.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => setSelectedBundle(b.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors",
                      selectedBundle === b.id
                        ? "bg-emerald-50/60"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-900">
                        v{b.version}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                          b.channel === "stable"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {b.channel}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      {b.releaseNotes}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Released {new Date(b.releasedAt).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => toast.success("Bundle upload accepted (mock)")}
                className="w-full h-9 rounded-md border border-dashed border-slate-300 text-[12px] font-semibold text-slate-500 inline-flex items-center justify-center gap-1.5 hover:bg-slate-50"
              >
                <Upload className="w-3.5 h-3.5" /> Upload new bundle
              </button>
            </div>
          </OperatorSection>

          <OperatorSection
            title="Push to stations"
            subtitle={selectedBundle ? `Selected: v${bundleMap.get(selectedBundle)?.version}` : "Pick a bundle first"}
            right={
              <button
                onClick={pushToStations}
                disabled={!selectedBundle || selectedStations.size === 0}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                <Rocket className="w-3.5 h-3.5" /> Push ({selectedStations.size})
              </button>
            }
          >
            <ul className="divide-y divide-slate-100">
              {(stations.data ?? []).map((s) => {
                const on = selectedStations.has(s.stationId);
                return (
                  <li key={s.stationId}>
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => {
                          const next = new Set(selectedStations);
                          if (e.target.checked) next.add(s.stationId);
                          else next.delete(s.stationId);
                          setSelectedStations(next);
                        }}
                        className="accent-emerald-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {s.connectorsTotal} connectors · uptime {s.uptimePct}%
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </OperatorSection>
        </div>

        <OperatorSection
          title={`OTA queue (${jobs.data?.length ?? 0})`}
          subtitle="Rolling deploy · rollback on failure"
        >
          {(jobs.data ?? []).length === 0 ? (
            <OperatorEmpty title="Queue empty" body="Push a bundle to queue a job." icon={Monitor} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Job</TableHead>
                  <TableHead className="text-[11px]">Station</TableHead>
                  <TableHead className="text-[11px]">Bundle</TableHead>
                  <TableHead className="text-[11px]">Progress</TableHead>
                  <TableHead className="text-[11px]">Started</TableHead>
                  <TableHead className="text-[11px]">Finished</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.data?.map((j) => (
                  <TableRow key={j.id} className="text-[12px]">
                    <TableCell className="py-2 font-mono">{j.id.slice(-6)}</TableCell>
                    <TableCell className="py-2">{stationMap.get(j.stationId) ?? j.stationId}</TableCell>
                    <TableCell className="py-2 font-mono">
                      v{bundleMap.get(j.bundleId)?.version}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            j.status === "failed"
                              ? "bg-red-500"
                              : j.status === "installed"
                                ? "bg-emerald-500"
                                : "bg-blue-500",
                          )}
                          style={{ width: `${j.progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{j.progressPct}%</p>
                    </TableCell>
                    <TableCell className="py-2 text-slate-500">
                      {j.startedAt ? new Date(j.startedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-slate-500">
                      {j.finishedAt ? new Date(j.finishedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusPill status={j.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </OperatorSection>
      </OperatorPageBody>
    </OperatorLayout>
  );
};

const StatusPill = ({ status }: { status: FirmwareJobStatus }) => {
  const map: Record<FirmwareJobStatus, string> = {
    queued: "bg-slate-100 text-slate-600",
    in_progress: "bg-blue-50 text-blue-700",
    installed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    rolled_back: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
        map[status],
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
};

export default OperatorFirmwareScreen;
