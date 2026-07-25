// Screen: F-05 · Primitives: Vehicle, Reservation, Provider
// Maintenance Scheduler — predictive + calendar-based, auto-book to mechanic.

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Wrench, Zap } from "lucide-react";
import {
  FleetEmpty,
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFleetMaintenance,
  useFleetVehicles,
  useScheduleMaintenance,
  useUpdateMaintenanceStatus,
} from "@/modules/fleet/hooks";
import type { FleetMaintenanceOrder } from "@/modules/fleet/types";
import { cn } from "@/lib/utils";

const FleetMaintenanceScreen = () => {
  const maintenance = useFleetMaintenance();
  const vehicles = useFleetVehicles();
  const schedule = useScheduleMaintenance();
  const updateStatus = useUpdateMaintenanceStatus();

  const [autoBookOpen, setAutoBookOpen] = useState(false);

  const vehicleMap = useMemo(() => {
    const m = new Map<string, string>();
    (vehicles.data ?? []).forEach((v) => m.set(v.id, v.plate));
    return m;
  }, [vehicles.data]);

  const orders = useMemo(() => {
    return [...(maintenance.data ?? [])].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [maintenance.data]);

  const buckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setDate(today.getDate() + 7);
    const later = [] as FleetMaintenanceOrder[];
    const thisWeek = [] as FleetMaintenanceOrder[];
    const overdue = [] as FleetMaintenanceOrder[];
    const done = [] as FleetMaintenanceOrder[];
    orders.forEach((o) => {
      if (o.status === "completed") return done.push(o);
      const at = new Date(o.scheduledAt);
      if (at < today) overdue.push(o);
      else if (at < week) thisWeek.push(o);
      else later.push(o);
    });
    return { overdue, thisWeek, later, done };
  }, [orders]);

  const predictive = useMemo(
    () =>
      (vehicles.data ?? []).filter(
        (v) => v.nextServiceKm < 1200 || v.healthScore < 70,
      ),
    [vehicles.data],
  );

  const autoBookAll = async () => {
    setAutoBookOpen(false);
    try {
      for (const v of predictive.slice(0, 4)) {
        const scheduled = new Date();
        scheduled.setDate(scheduled.getDate() + 2);
        await schedule.mutateAsync({
          vehicleId: v.id,
          reason: v.nextServiceKm < 1200 ? "Scheduled service due" : "Predictive: health score low",
          scheduledAt: scheduled.toISOString(),
          estCost: 2500,
        });
      }
      toast.success(`${predictive.slice(0, 4).length} work orders auto-booked`);
    } catch {
      toast.error("Auto-book failed");
    }
  };

  const advance = async (id: string, status: FleetMaintenanceOrder["status"]) => {
    await updateStatus.mutateAsync({ id, status });
    toast.success(`Marked ${status.replace("_", " ")}`);
  };

  if (maintenance.isLoading)
    return (
      <FleetLayout
        title="Maintenance"
        screenId="F-05"
        primitives={["Vehicle", "Reservation", "Provider"]}
      >
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Maintenance"
      screenId="F-05"
      primitives={["Vehicle", "Reservation", "Provider"]}
      actions={
        <button
          onClick={() => setAutoBookOpen(true)}
          disabled={predictive.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Auto-book predictive ({predictive.length})
        </button>
      }
    >
      <FleetPageBody>
        <FleetSection
          title="Predictive alerts"
          subtitle="Health score <70 or next service <1,200 km"
        >
          {predictive.length === 0 ? (
            <FleetEmpty
              title="No predictive alerts"
              body="Every vehicle in the fleet is inside its health envelope."
            />
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {predictive.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">
                        {v.plate}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {v.make} {v.model} · health {v.healthScore}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
                      {v.nextServiceKm < 1200 ? "Service due" : "Health low"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Next service in <span className="font-semibold">{v.nextServiceKm.toLocaleString()} km</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </FleetSection>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {(["overdue", "thisWeek", "later", "done"] as const).map((b) => (
            <FleetSection
              key={b}
              title={
                b === "overdue"
                  ? "Overdue"
                  : b === "thisWeek"
                    ? "This week"
                    : b === "later"
                      ? "Upcoming"
                      : "Completed"
              }
              subtitle={`${buckets[b].length} orders`}
            >
              {buckets[b].length === 0 ? (
                <div className="p-6 text-center text-[11px] text-slate-400">
                  Empty
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {buckets[b].slice(0, 6).map((o) => (
                    <li
                      key={o.id}
                      className="px-3 py-2.5 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">
                          {o.reason}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {vehicleMap.get(o.vehicleId) ?? o.vehicleId} ·{" "}
                          {new Date(o.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                      {b !== "done" && (
                        <button
                          onClick={() =>
                            advance(
                              o.id,
                              o.status === "requested"
                                ? "booked"
                                : o.status === "booked"
                                  ? "in_progress"
                                  : "completed",
                            )
                          }
                          className="text-[10px] font-bold uppercase text-blue-700 hover:underline shrink-0"
                        >
                          Advance
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </FleetSection>
          ))}
        </div>

        <FleetSection
          title={`All work orders (${orders.length})`}
          subtitle="Chronological · click Advance to progress state machine"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-[11px]">Vehicle</TableHead>
                <TableHead className="text-[11px]">Reason</TableHead>
                <TableHead className="text-[11px]">Type</TableHead>
                <TableHead className="text-[11px]">Scheduled</TableHead>
                <TableHead className="text-[11px]">Shop</TableHead>
                <TableHead className="text-[11px] text-right">Cost</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="text-[12px]">
                  <TableCell className="py-2 font-mono font-semibold">
                    {vehicleMap.get(o.vehicleId) ?? o.vehicleId}
                  </TableCell>
                  <TableCell className="py-2">{o.reason}</TableCell>
                  <TableCell className="py-2 uppercase text-[10px] font-bold text-slate-600">
                    {o.type}
                  </TableCell>
                  <TableCell className="py-2">
                    {new Date(o.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2 text-slate-500">
                    {o.mechanicShopId ?? "—"}
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold">
                    ₹{o.estCost.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                        o.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : o.status === "in_progress"
                            ? "bg-blue-50 text-blue-700"
                            : o.status === "booked"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {o.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </FleetSection>
      </FleetPageBody>

      {autoBookOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h3 className="text-[15px] font-bold text-slate-900">
                Auto-book to preferred shop
              </h3>
            </div>
            <p className="text-[12px] text-slate-600">
              We'll schedule <span className="font-semibold">{Math.min(4, predictive.length)}</span>{" "}
              service jobs at <span className="font-semibold">mech-1 (Preferred partner)</span> for the
              vehicles with the lowest health score.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setAutoBookOpen(false)}
                className="h-8 px-3 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={autoBookAll}
                disabled={schedule.isPending}
                className="h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-70"
              >
                <CalendarClock className="w-3.5 h-3.5" /> Book
              </button>
            </div>
          </div>
        </div>
      )}
    </FleetLayout>
  );
};

export default FleetMaintenanceScreen;
