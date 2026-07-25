// Screen: F-02 · Primitives: Vehicle, Identity, Review
// Vehicle Fleet Manager — dense table with telematics/health, per-row drawer.

import { useMemo, useState } from "react";
import { Battery, Search, Signal, WifiOff } from "lucide-react";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
  FleetEmpty,
  FleetError,
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
  useFleetDepots,
  useFleetDrivers,
  useFleetVehicles,
} from "@/modules/fleet/hooks";
import {
  FUEL_LABEL,
  VEHICLE_STATUS_LABEL,
  type FleetVehicle,
  type FleetVehicleStatus,
} from "@/modules/fleet/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<FleetVehicleStatus, string> = {
  in_service: "bg-emerald-50 text-emerald-700",
  idle: "bg-slate-100 text-slate-600",
  charging: "bg-blue-50 text-blue-700",
  maintenance: "bg-amber-50 text-amber-700",
  offline: "bg-red-50 text-red-700",
};

const FleetVehiclesScreen = () => {
  const vehicles = useFleetVehicles();
  const drivers = useFleetDrivers();
  const costCenters = useFleetCostCenters();
  const depots = useFleetDepots();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<FleetVehicleStatus | "all">(
    "all",
  );
  const [selected, setSelected] = useState<FleetVehicle | null>(null);

  const rows = useMemo(() => {
    const list = vehicles.data ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!term) return true;
      return (
        v.plate.toLowerCase().includes(term) ||
        v.make.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term)
      );
    });
  }, [vehicles.data, q, statusFilter]);

  const driverMap = useMemo(() => {
    const m = new Map<string, string>();
    (drivers.data ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [drivers.data]);

  const ccMap = useMemo(() => {
    const m = new Map<string, string>();
    (costCenters.data ?? []).forEach((c) => m.set(c.id, c.code));
    return m;
  }, [costCenters.data]);

  const depotMap = useMemo(() => {
    const m = new Map<string, string>();
    (depots.data ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [depots.data]);

  if (vehicles.isLoading)
    return (
      <FleetLayout title="Vehicles" screenId="F-02" primitives={["Vehicle", "Identity", "Review"]}>
        <FleetLoading />
      </FleetLayout>
    );

  if (vehicles.isError)
    return (
      <FleetLayout title="Vehicles" screenId="F-02" primitives={["Vehicle", "Identity", "Review"]}>
        <FleetError onRetry={() => vehicles.refetch()} />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Vehicles"
      screenId="F-02"
      primitives={["Vehicle", "Identity", "Review"]}
    >
      <FleetPageBody>
        <FleetSection
          title={`Fleet roster (${rows.length})`}
          subtitle="Telematics + health scores from mock telemetry"
          right={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Plate, make, model"
                  className="pl-7 h-8 rounded-md border border-slate-200 text-[12px] w-52"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FleetVehicleStatus | "all")}
                className="h-8 rounded-md border border-slate-200 bg-white text-[12px] px-2"
              >
                <option value="all">All statuses</option>
                {Object.entries(VEHICLE_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {rows.length === 0 ? (
            <FleetEmpty title="No vehicles match" body="Try clearing filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">Plate</TableHead>
                  <TableHead className="text-[11px]">Vehicle</TableHead>
                  <TableHead className="text-[11px]">Fuel</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                  <TableHead className="text-[11px]">Telematics</TableHead>
                  <TableHead className="text-[11px] text-right">SOC</TableHead>
                  <TableHead className="text-[11px] text-right">Odo (km)</TableHead>
                  <TableHead className="text-[11px] text-right">Health</TableHead>
                  <TableHead className="text-[11px]">Driver</TableHead>
                  <TableHead className="text-[11px]">Cost ctr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer text-[12px]"
                    onClick={() => setSelected(v)}
                  >
                    <TableCell className="font-mono font-semibold py-2">
                      {v.plate}
                    </TableCell>
                    <TableCell className="py-2">
                      {v.make} {v.model}
                      <span className="text-slate-400"> · {v.year}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                        {FUEL_LABEL[v.fuel]}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusPill status={v.status} />
                    </TableCell>
                    <TableCell className="py-2">
                      <TelemetryBadge online={v.telematics.online} bars={v.telematics.signalStrength} />
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {v.currentSocPct != null ? `${v.currentSocPct}%` : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {v.odometerKm.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <HealthBadge score={v.healthScore} />
                    </TableCell>
                    <TableCell className="py-2 truncate max-w-[140px]">
                      {v.assignedDriverId ? driverMap.get(v.assignedDriverId) ?? "—" : "—"}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-[11px] font-mono text-slate-600">
                        {ccMap.get(v.costCenterId) ?? "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </FleetSection>
      </FleetPageBody>

      {/* Detail drawer */}
      {selected && (
        <VehicleDrawer
          vehicle={selected}
          driverName={selected.assignedDriverId ? driverMap.get(selected.assignedDriverId) ?? "Unassigned" : "Unassigned"}
          depotName={depotMap.get(selected.depotId) ?? "—"}
          costCenterCode={ccMap.get(selected.costCenterId) ?? "—"}
          onClose={() => setSelected(null)}
        />
      )}
    </FleetLayout>
  );
};

const StatusPill = ({ status }: { status: FleetVehicleStatus }) => (
  <span
    className={cn(
      "text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5",
      STATUS_COLOR[status],
    )}
  >
    {VEHICLE_STATUS_LABEL[status]}
  </span>
);

const TelemetryBadge = ({ online, bars }: { online: boolean; bars: 0 | 1 | 2 | 3 | 4 }) =>
  online ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
      <Signal className="w-3.5 h-3.5" />
      <span className="font-semibold">{bars}/4</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-red-700">
      <WifiOff className="w-3.5 h-3.5" />
      Offline
    </span>
  );

const HealthBadge = ({ score }: { score: number }) => {
  const cls =
    score >= 85
      ? "bg-emerald-50 text-emerald-700"
      : score >= 70
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={cn("text-[11px] font-bold rounded px-1.5 py-0.5", cls)}>
      {score}
    </span>
  );
};

const VehicleDrawer = ({
  vehicle,
  driverName,
  depotName,
  costCenterCode,
  onClose,
}: {
  vehicle: FleetVehicle;
  driverName: string;
  depotName: string;
  costCenterCode: string;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-40 flex justify-end">
    <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
    <div className="relative w-full sm:w-[420px] h-full bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500">Vehicle · {vehicle.id}</p>
          <h3 className="text-[15px] font-bold text-slate-900">{vehicle.plate}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-[13px]"
        >
          Close
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Cell label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
          <Cell label="Year" value={String(vehicle.year)} />
          <Cell label="Fuel" value={FUEL_LABEL[vehicle.fuel]} />
          <Cell label="Status" value={VEHICLE_STATUS_LABEL[vehicle.status]} />
          <Cell label="Battery" value={vehicle.batteryKwh ? `${vehicle.batteryKwh} kWh` : "N/A"} />
          <Cell label="SOC" value={vehicle.currentSocPct != null ? `${vehicle.currentSocPct}%` : "—"} />
          <Cell label="Odometer" value={`${vehicle.odometerKm.toLocaleString()} km`} />
          <Cell label="Next service in" value={`${vehicle.nextServiceKm.toLocaleString()} km`} />
          <Cell label="Depot" value={depotName} />
          <Cell label="Cost center" value={costCenterCode} />
          <Cell label="Driver" value={driverName} />
          <Cell label="Health" value={String(vehicle.healthScore)} />
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
            Telematics
          </p>
          <div className="mt-1 flex items-center gap-3">
            {vehicle.telematics.online ? (
              <Signal className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <p className="text-[12px] text-slate-700">
              {vehicle.telematics.online ? "Online" : "Offline"} · signal{" "}
              {vehicle.telematics.signalStrength}/4
            </p>
            <span className="ml-auto text-[11px] text-slate-500">
              last ping {new Date(vehicle.telematics.lastPingAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        {vehicle.fuel === "ev" && vehicle.currentSocPct != null && (
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-blue-600" />
              <p className="text-[12px] font-semibold text-slate-800">
                Battery {vehicle.currentSocPct}%
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full",
                  vehicle.currentSocPct < 20
                    ? "bg-red-500"
                    : vehicle.currentSocPct < 50
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
                style={{ width: `${vehicle.currentSocPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Cell = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </p>
    <p className="text-[13px] text-slate-800">{value}</p>
  </div>
);

export default FleetVehiclesScreen;
