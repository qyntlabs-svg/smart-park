// Screen: F-03 · Primitives: Identity, Review
// Driver Manager — roster + licenses + ratings + shifts calendar strip.

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";
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
  useFleetCostCenters,
  useFleetDrivers,
  useFleetShifts,
  useUpdateFleetDriver,
} from "@/modules/fleet/hooks";
import { DRIVER_STATUS_LABEL, type FleetDriverStatus } from "@/modules/fleet/types";
import { cn } from "@/lib/utils";

const FleetDriversScreen = () => {
  const drivers = useFleetDrivers();
  const shifts = useFleetShifts();
  const costCenters = useFleetCostCenters();
  const updateDriver = useUpdateFleetDriver();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<FleetDriverStatus | "all">("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (drivers.data ?? []).filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!term) return true;
      return (
        d.name.toLowerCase().includes(term) ||
        d.employeeCode.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term)
      );
    });
  }, [drivers.data, q, statusFilter]);

  const ccMap = useMemo(() => {
    const m = new Map<string, string>();
    (costCenters.data ?? []).forEach((c) => m.set(c.id, c.code));
    return m;
  }, [costCenters.data]);

  const shiftBuckets = useMemo(() => {
    // Group shifts by day (last 7 days) → for each driver, count.
    const now = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().slice(5, 10));
    }
    const perDriver = new Map<string, Record<string, number>>();
    (shifts.data ?? []).forEach((s) => {
      const key = new Date(s.startAt).toISOString().slice(5, 10);
      if (!days.includes(key)) return;
      const map = perDriver.get(s.driverId) ?? {};
      map[key] = (map[key] ?? 0) + 1;
      perDriver.set(s.driverId, map);
    });
    return { days, perDriver };
  }, [shifts.data]);

  const toggleStatus = async (id: string, current: FleetDriverStatus) => {
    const next: FleetDriverStatus = current === "active" ? "on_leave" : "active";
    await updateDriver.mutateAsync({ id, patch: { status: next } });
    toast.success(`Driver marked ${DRIVER_STATUS_LABEL[next].toLowerCase()}`);
  };

  if (drivers.isLoading)
    return (
      <FleetLayout title="Drivers" screenId="F-03" primitives={["Identity", "Review"]}>
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Drivers"
      screenId="F-03"
      primitives={["Identity", "Review"]}
    >
      <FleetPageBody>
        <FleetSection
          title={`Roster (${filtered.length})`}
          subtitle="Licenses, ratings, and last 7 days of shifts"
          right={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="pl-7 h-8 rounded-md border border-slate-200 text-[12px] w-52"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FleetDriverStatus | "all")}
                className="h-8 rounded-md border border-slate-200 bg-white text-[12px] px-2"
              >
                <option value="all">All statuses</option>
                {Object.entries(DRIVER_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <FleetEmpty title="No drivers" body="Try clearing filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Driver</TableHead>
                  <TableHead className="text-[11px]">Emp code</TableHead>
                  <TableHead className="text-[11px]">License</TableHead>
                  <TableHead className="text-[11px]">Expiry</TableHead>
                  <TableHead className="text-[11px]">Cost ctr</TableHead>
                  <TableHead className="text-[11px] text-right">Rating</TableHead>
                  <TableHead className="text-[11px] text-right">Trips</TableHead>
                  <TableHead className="text-[11px]">
                    Shifts (last 7)
                  </TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const shifts = shiftBuckets.perDriver.get(d.id) ?? {};
                  const expiryDate = new Date(d.licenseExpiry);
                  const daysToExpiry = Math.round(
                    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <TableRow key={d.id} className="text-[12px]">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                            {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {d.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {d.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 font-mono">{d.employeeCode}</TableCell>
                      <TableCell className="py-2 font-mono text-slate-600">
                        {d.licenseNumber}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "text-[11px] font-semibold rounded px-1.5 py-0.5",
                            daysToExpiry < 30
                              ? "bg-red-50 text-red-700"
                              : daysToExpiry < 90
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {d.licenseExpiry}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 font-mono">
                        {ccMap.get(d.costCenterId)}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {d.rating.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {d.totalTrips.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-0.5">
                          {shiftBuckets.days.map((day) => (
                            <div
                              key={day}
                              title={`${day} · ${shifts[day] ?? 0}`}
                              className={cn(
                                "w-3.5 h-3.5 rounded-sm",
                                (shifts[day] ?? 0) === 0
                                  ? "bg-slate-100"
                                  : (shifts[day] ?? 0) > 1
                                    ? "bg-blue-600"
                                    : "bg-blue-300",
                              )}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <button
                          onClick={() => toggleStatus(d.id, d.status)}
                          className="text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          {d.status === "active" ? "Mark on leave" : "Reinstate"}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </FleetSection>
      </FleetPageBody>
    </FleetLayout>
  );
};

const StatusBadge = ({ status }: { status: FleetDriverStatus }) => {
  const cls = {
    active: "bg-emerald-50 text-emerald-700",
    on_leave: "bg-slate-100 text-slate-600",
    suspended: "bg-red-50 text-red-700",
  }[status];
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wider font-bold rounded px-1.5 py-0.5",
        cls,
      )}
    >
      {DRIVER_STATUS_LABEL[status]}
    </span>
  );
};

export default FleetDriversScreen;
