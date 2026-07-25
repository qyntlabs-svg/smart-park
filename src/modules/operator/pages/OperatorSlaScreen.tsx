// Screen: CO-06 · Primitives: Availability, Notification
// Uptime & SLA Dashboard — which chargers down, how long, SLA penalties.

import { useMemo } from "react";
import { ShieldAlert, Timer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  OperatorKpiCard,
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
  useOperatorKpis,
  useSlaIncidents,
  useStationSummaries,
} from "@/modules/operator/hooks";
import { cn } from "@/lib/utils";

const OperatorSlaScreen = () => {
  const incidents = useSlaIncidents();
  const kpis = useOperatorKpis();
  const summaries = useStationSummaries();

  const stationMap = useMemo(() => {
    const m = new Map<string, string>();
    (summaries.data ?? []).forEach((s) => m.set(s.stationId, s.name));
    return m;
  }, [summaries.data]);

  const totalPenalty = useMemo(
    () => (incidents.data ?? []).reduce((n, i) => n + i.penalty, 0),
    [incidents.data],
  );

  const perStation = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number; penalty: number }>();
    (incidents.data ?? []).forEach((i) => {
      const rec = map.get(i.stationId) ?? { count: 0, minutes: 0, penalty: 0 };
      rec.count += 1;
      rec.minutes += i.durationMinutes;
      rec.penalty += i.penalty;
      map.set(i.stationId, rec);
    });
    return Array.from(map.entries()).map(([stationId, rec]) => ({
      stationId,
      name: stationMap.get(stationId) ?? stationId,
      ...rec,
    }));
  }, [incidents.data, stationMap]);

  const open = (incidents.data ?? []).filter((i) => !i.closedAt);

  if (incidents.isLoading || kpis.isLoading)
    return (
      <OperatorLayout title="Uptime / SLA" screenId="CO-06" primitives={["Availability", "Notification"]}>
        <OperatorLoading />
      </OperatorLayout>
    );

  return (
    <OperatorLayout
      title="Uptime & SLA"
      screenId="CO-06"
      primitives={["Availability", "Notification"]}
    >
      <OperatorPageBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OperatorKpiCard
            label="Uptime (30d)"
            value={`${kpis.data?.uptimePct ?? 0}%`}
            hint="SLA target: 99.0%"
            icon={ShieldAlert}
            tone={(kpis.data?.uptimePct ?? 0) < 99 ? "warning" : "success"}
          />
          <OperatorKpiCard
            label="Open incidents"
            value={String(open.length)}
            hint={`${(incidents.data ?? []).length} total 30d`}
            tone={open.length > 0 ? "danger" : "success"}
            icon={ShieldAlert}
          />
          <OperatorKpiCard
            label="Penalties (30d)"
            value={`₹${totalPenalty.toLocaleString()}`}
            hint="Contract clause 4.2"
            icon={Timer}
          />
          <OperatorKpiCard
            label="MTTR"
            value={`${Math.round(
              (incidents.data ?? [])
                .filter((i) => i.closedAt)
                .reduce((n, i) => n + i.durationMinutes, 0) /
                Math.max(1, (incidents.data ?? []).filter((i) => i.closedAt).length),
            )}m`}
            hint="Mean time to restore"
            icon={Timer}
          />
        </div>

        <OperatorSection title="Minutes offline per station (30d)">
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perStation}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-8} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="minutes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OperatorSection>

        <OperatorSection
          title={`Incidents (${(incidents.data ?? []).length})`}
          subtitle="Charger-offline, station-offline, and power-dip events"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Opened</TableHead>
                <TableHead className="text-[11px]">Station</TableHead>
                <TableHead className="text-[11px]">Connector</TableHead>
                <TableHead className="text-[11px]">Reason</TableHead>
                <TableHead className="text-[11px]">Duration</TableHead>
                <TableHead className="text-[11px] text-right">Penalty</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(incidents.data ?? []).map((i) => (
                <TableRow key={i.id} className="text-[12px]">
                  <TableCell className="py-2">
                    {new Date(i.openedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">
                    {stationMap.get(i.stationId) ?? i.stationId}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-slate-500">
                    {i.connectorId ?? "—"}
                  </TableCell>
                  <TableCell className="py-2">{i.reason.replace("_", " ")}</TableCell>
                  <TableCell className="py-2 font-mono">
                    {i.durationMinutes >= 60
                      ? `${(i.durationMinutes / 60).toFixed(1)}h`
                      : `${i.durationMinutes}m`}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono font-semibold text-red-700">
                    {i.penalty ? `₹${i.penalty}` : "—"}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        i.closedAt
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700",
                      )}
                    >
                      {i.closedAt ? "Closed" : "Open"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OperatorSection>
      </OperatorPageBody>
    </OperatorLayout>
  );
};

export default OperatorSlaScreen;
