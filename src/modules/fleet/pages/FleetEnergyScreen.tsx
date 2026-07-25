// Screen: F-04 · Primitives: Payment, Vehicle
// Energy / Fuel Analytics — kWh + fuel cost per vehicle / route / driver.

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
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
  useFleetRoutes,
  useFleetShifts,
  useFleetVehicles,
} from "@/modules/fleet/hooks";
import { FUEL_LABEL } from "@/modules/fleet/types";

const FleetEnergyScreen = () => {
  const vehicles = useFleetVehicles();
  const drivers = useFleetDrivers();
  const routes = useFleetRoutes();
  const shifts = useFleetShifts();
  const costCenters = useFleetCostCenters();

  const [dim, setDim] = useState<"vehicle" | "route" | "driver">("vehicle");

  // Deterministic mock energy series: kWh + fuel cost per day for last 14 days.
  const dailySeries = useMemo(() => {
    const days: Array<{ day: string; kwh: number; fuel: number; cost: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const base = 380 + Math.round(80 * Math.sin(i / 2.5));
      const kwh = base + Math.round(Math.random() * 60);
      const fuel = 220 - Math.round(50 * Math.sin(i / 3));
      const cost = Math.round(kwh * 17 + fuel * 105);
      days.push({ day: d.toISOString().slice(5, 10), kwh, fuel, cost });
    }
    return days;
  }, []);

  const totals = useMemo(() => {
    return dailySeries.reduce(
      (acc, d) => ({
        kwh: acc.kwh + d.kwh,
        fuel: acc.fuel + d.fuel,
        cost: acc.cost + d.cost,
      }),
      { kwh: 0, fuel: 0, cost: 0 },
    );
  }, [dailySeries]);

  const groupedRows = useMemo(() => {
    if (dim === "vehicle") {
      return (vehicles.data ?? []).slice(0, 20).map((v) => {
        const kwh =
          v.fuel === "ev"
            ? Math.round(120 + (v.healthScore % 60) * 4)
            : Math.round((v.healthScore % 30) * 2);
        const fuel = v.fuel === "ev" ? 0 : Math.round(60 + (v.healthScore % 40) * 3);
        return {
          key: v.id,
          label: `${v.plate}`,
          sub: `${v.make} ${v.model}`,
          kwh,
          fuel,
          cost: Math.round(kwh * 17 + fuel * 105),
          fuelBadge: FUEL_LABEL[v.fuel],
        };
      });
    }
    if (dim === "route") {
      return (routes.data ?? []).map((r) => {
        const kwh = Math.round(r.distanceKm * 3.4 + 40);
        const fuel = Math.round(r.distanceKm * 0.9);
        return {
          key: r.id,
          label: r.name,
          sub: `${r.distanceKm} km`,
          kwh,
          fuel,
          cost: Math.round(kwh * 17 + fuel * 105),
          fuelBadge: `${r.chargingStops.length} stops`,
        };
      });
    }
    // driver
    return (drivers.data ?? []).slice(0, 20).map((d) => {
      const trips = d.totalTrips;
      const kwh = Math.round(trips * 0.4);
      const fuel = Math.round(trips * 0.18);
      return {
        key: d.id,
        label: d.name,
        sub: d.employeeCode,
        kwh,
        fuel,
        cost: Math.round(kwh * 17 + fuel * 105),
        fuelBadge: `${d.totalKm.toLocaleString()} km`,
      };
    });
  }, [dim, vehicles.data, routes.data, drivers.data]);

  const ccBar = useMemo(() => {
    return (costCenters.data ?? []).map((c) => ({
      code: c.code,
      spend: Math.round(c.monthlySpend / 1000),
      budget: Math.round(c.monthlyBudget / 1000),
    }));
  }, [costCenters.data]);

  const loading =
    vehicles.isLoading || drivers.isLoading || routes.isLoading || shifts.isLoading;

  return (
    <FleetLayout
      title="Energy & fuel"
      screenId="F-04"
      primitives={["Payment", "Vehicle"]}
    >
      {loading ? (
        <FleetLoading />
      ) : (
        <FleetPageBody>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <FleetSection
              title="Daily consumption (last 14 days)"
              subtitle="kWh · litres · total cost"
              className="lg:col-span-2"
            >
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySeries}>
                    <CartesianGrid stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="kwh"
                      name="kWh"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="fuel"
                      name="Fuel (L)"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      name="Cost (₹)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </FleetSection>

            <FleetSection title="Totals (last 14 days)">
              <div className="p-4 space-y-3">
                <Metric
                  label="Energy delivered"
                  value={`${totals.kwh.toLocaleString()} kWh`}
                />
                <Metric label="Fuel burned" value={`${totals.fuel.toLocaleString()} L`} />
                <Metric
                  label="Total spend"
                  value={`₹${(totals.cost / 1000).toFixed(1)}k`}
                />
                <Metric
                  label="Avg cost / km"
                  value={`₹${(totals.cost / (totals.kwh * 4 + totals.fuel * 12)).toFixed(2)}`}
                />
              </div>
            </FleetSection>
          </div>

          <FleetSection
            title="Cost center: spend vs budget (₹k)"
            subtitle="Current month"
          >
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ccBar}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spend" name="Spend" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FleetSection>

          <FleetSection
            title="Breakdown"
            subtitle={`Grouped by ${dim}`}
            right={
              <select
                value={dim}
                onChange={(e) => setDim(e.target.value as typeof dim)}
                className="h-8 rounded-md border border-slate-200 bg-white text-[12px] px-2"
              >
                <option value="vehicle">Per vehicle</option>
                <option value="route">Per route</option>
                <option value="driver">Per driver</option>
              </select>
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60">
                  <TableHead className="text-[11px]">
                    {dim === "vehicle"
                      ? "Vehicle"
                      : dim === "route"
                        ? "Route"
                        : "Driver"}
                  </TableHead>
                  <TableHead className="text-[11px]">Meta</TableHead>
                  <TableHead className="text-[11px] text-right">kWh</TableHead>
                  <TableHead className="text-[11px] text-right">Fuel (L)</TableHead>
                  <TableHead className="text-[11px] text-right">Cost (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedRows.map((r) => (
                  <TableRow key={r.key} className="text-[12px]">
                    <TableCell className="py-2 font-semibold text-slate-800">
                      {r.label}
                    </TableCell>
                    <TableCell className="py-2 text-slate-500">
                      <span className="text-[11px] font-semibold bg-slate-100 rounded px-1.5 py-0.5 mr-2">
                        {r.fuelBadge}
                      </span>
                      {r.sub}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {r.kwh.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 text-right">{r.fuel}</TableCell>
                    <TableCell className="py-2 text-right font-semibold text-slate-900">
                      ₹{r.cost.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FleetSection>
        </FleetPageBody>
      )}
    </FleetLayout>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
    <span className="text-[12px] text-slate-500">{label}</span>
    <span className="text-[14px] font-bold text-slate-900">{value}</span>
  </div>
);

export default FleetEnergyScreen;
