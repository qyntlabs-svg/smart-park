// Screen: CO-04 · Primitives: Reservation, Identity
// Remote Start/Stop — standalone support view to intervene on any active session.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Play, Search, StopCircle, Terminal } from "lucide-react";
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
import { useStationSummaries } from "@/modules/operator/hooks";
import { getStationSessions } from "@/modules/ev/store";
import type { EvSession } from "@/modules/ev/types";
import { useEndEvSession, useStartEvSession } from "@/modules/ev/hooks";
import { CONNECTOR_LABEL } from "@/modules/ev/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const OperatorRemoteScreen = () => {
  const navigate = useNavigate();
  const summaries = useStationSummaries();
  const endSession = useEndEvSession();
  const startSession = useStartEvSession();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ sessionId: string; kind: "start" | "stop" } | null>(
    null,
  );

  const stationIds = useMemo(
    () => (summaries.data ?? []).map((s) => s.stationId),
    [summaries.data],
  );

  const sessionsQ = useQuery<EvSession[]>({
    queryKey: ["operator-remote-sessions", stationIds.join("|")],
    queryFn: async () => {
      const all = await Promise.all(stationIds.map((id) => getStationSessions(id)));
      return all.flat();
    },
    enabled: stationIds.length > 0,
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (endSession.isSuccess || startSession.isSuccess) sessionsQ.refetch();
  }, [endSession.isSuccess, startSession.isSuccess, sessionsQ]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (sessionsQ.data ?? []).filter((s) => {
      if (!term) return true;
      return (
        s.id.toLowerCase().includes(term) ||
        s.userId.toLowerCase().includes(term) ||
        s.stationId.toLowerCase().includes(term)
      );
    });
  }, [sessionsQ.data, q]);

  const active = filtered.filter((s) => s.status === "active");
  const scheduled = filtered.filter((s) => s.status === "scheduled");

  const stationMap = useMemo(() => {
    const m = new Map<string, string>();
    (summaries.data ?? []).forEach((s) => m.set(s.stationId, s.name));
    return m;
  }, [summaries.data]);

  const perform = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "stop") {
        await endSession.mutateAsync(confirm.sessionId);
        toast.success("Session stopped remotely");
      } else {
        // start requires the reservation id, not the session id — best-effort.
        const s = (sessionsQ.data ?? []).find((x) => x.id === confirm.sessionId);
        if (s) {
          await startSession.mutateAsync(s.reservationId);
          toast.success("Session started remotely");
        }
      }
    } finally {
      setConfirm(null);
    }
  };

  return (
    <OperatorLayout
      title="Remote start / stop"
      screenId="CO-04"
      primitives={["Reservation", "Identity"]}
    >
      {summaries.isLoading || sessionsQ.isLoading ? (
        <OperatorLoading />
      ) : (
        <OperatorPageBody>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <Terminal className="w-4 h-4 text-amber-700 mt-0.5" />
            <p className="text-[12px] text-amber-800">
              Support-only. Every intervention here appears in the consumer app
              and audit log with a "manual override" tag.
            </p>
          </div>

          <OperatorSection
            title={`Active sessions (${active.length})`}
            subtitle="Live kW draw from EV session ledger"
            right={
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Session, user, station…"
                  className="pl-7 h-8 rounded-md border border-slate-200 text-[12px] w-60"
                />
              </div>
            }
          >
            {active.length === 0 ? (
              <OperatorEmpty
                title="No active sessions"
                body="Everything currently plugged in is running normally."
                icon={Play}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Session</TableHead>
                    <TableHead className="text-[11px]">Station</TableHead>
                    <TableHead className="text-[11px]">Connector</TableHead>
                    <TableHead className="text-[11px]">User</TableHead>
                    <TableHead className="text-[11px] text-right">kW now</TableHead>
                    <TableHead className="text-[11px] text-right">kWh</TableHead>
                    <TableHead className="text-[11px] text-right">Cost</TableHead>
                    <TableHead className="text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((s) => (
                    <TableRow key={s.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{s.id.slice(-8)}</TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => navigate(`/operator/stations/${s.stationId}`)}
                          className="text-blue-700 hover:underline text-left"
                        >
                          {stationMap.get(s.stationId) ?? s.stationId}
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        {CONNECTOR_LABEL[s.connectorType]} · {s.ratedKw}kW
                      </TableCell>
                      <TableCell className="py-2 font-mono text-slate-500">
                        {s.userId.slice(-6)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold text-emerald-700">
                        {s.currentKw.toFixed(1)}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {s.kwhDelivered.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono">
                        ₹{s.cost}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          onClick={() =>
                            setConfirm({ sessionId: s.id, kind: "stop" })
                          }
                          className="text-[11px] font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                        >
                          <StopCircle className="w-3 h-3" /> Stop
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </OperatorSection>

          <OperatorSection
            title={`Scheduled (${scheduled.length})`}
            subtitle="Consumer has a plug-in code, but hasn't started yet"
          >
            {scheduled.length === 0 ? (
              <OperatorEmpty
                title="No scheduled sessions"
                body="Nothing waiting to plug in."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Session</TableHead>
                    <TableHead className="text-[11px]">Station</TableHead>
                    <TableHead className="text-[11px]">Scheduled for</TableHead>
                    <TableHead className="text-[11px]">User</TableHead>
                    <TableHead className="text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((s) => (
                    <TableRow key={s.id} className="text-[12px]">
                      <TableCell className="py-2 font-mono">{s.id.slice(-8)}</TableCell>
                      <TableCell className="py-2">
                        {stationMap.get(s.stationId) ?? s.stationId}
                      </TableCell>
                      <TableCell className="py-2">
                        {new Date(s.scheduledFor).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-slate-500">
                        {s.userId.slice(-6)}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          onClick={() =>
                            setConfirm({ sessionId: s.id, kind: "start" })
                          }
                          className="text-[11px] font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Force start
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </OperatorSection>
        </OperatorPageBody>
      )}

      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-slate-600" />
              <h3 className="text-[15px] font-bold text-slate-900">
                {confirm.kind === "stop" ? "Remote stop" : "Force start"} session {confirm.sessionId.slice(-8)}
              </h3>
            </div>
            <p className="text-[12px] text-slate-600">
              {confirm.kind === "stop"
                ? "The consumer will see the session end. Any unbilled kWh is captured."
                : "A start event is dispatched. Only use when the consumer is at the site and the physical plug is engaged."}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={perform}
                className={cn(
                  "h-8 px-3 rounded-md text-white text-[12px] font-semibold",
                  confirm.kind === "stop"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700",
                )}
              >
                {confirm.kind === "stop" ? "Stop session" : "Start session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OperatorLayout>
  );
};

export default OperatorRemoteScreen;
