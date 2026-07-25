// Screen: CO-02 · Primitives: Location, Provider, Availability
// Station List & Map — all stations table + toggle to map view.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, MapPin, Search } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { listStations } from "@/modules/ev/store";
import type { EvStation } from "@/modules/ev/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const upIcon = (uptime: number) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${uptime >= 95 ? "#10b981" : uptime >= 80 ? "#f59e0b" : "#ef4444"};
      color:white;font-weight:700;font-size:11px;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
    ">${uptime}</div>`,
    iconAnchor: [14, 14],
  });

const OperatorStationsScreen = () => {
  const navigate = useNavigate();
  const summaries = useStationSummaries();
  const stationsQ = useQuery<EvStation[]>({
    queryKey: ["ev-stations-raw"],
    queryFn: () => listStations(),
  });

  const [view, setView] = useState<"table" | "map">("table");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (summaries.data ?? []).filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term)
      );
    });
  }, [summaries.data, q, statusFilter]);

  const raw = stationsQ.data ?? [];
  const rawMap = useMemo(() => {
    const m = new Map<string, EvStation>();
    raw.forEach((s) => m.set(s.id, s));
    return m;
  }, [raw]);

  const center: [number, number] = raw[0] ? [raw[0].lat, raw[0].lng] : [13.05, 80.23];

  return (
    <OperatorLayout
      title="Stations"
      screenId="CO-02"
      primitives={["Location", "Provider", "Availability"]}
      actions={
        <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
          <button
            onClick={() => setView("table")}
            className={cn(
              "h-8 px-3 text-[12px] font-semibold inline-flex items-center gap-1.5",
              view === "table" ? "bg-slate-900 text-white" : "bg-white text-slate-700",
            )}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "h-8 px-3 text-[12px] font-semibold inline-flex items-center gap-1.5",
              view === "map" ? "bg-slate-900 text-white" : "bg-white text-slate-700",
            )}
          >
            <MapPin className="w-3.5 h-3.5" /> Map
          </button>
        </div>
      }
    >
      {summaries.isLoading || stationsQ.isLoading ? (
        <OperatorLoading />
      ) : (
        <OperatorPageBody>
          <OperatorSection
            title={`Stations (${list.length})`}
            subtitle="Live status derived from EV connector telemetry"
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
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-8 rounded-md border border-slate-200 bg-white text-[12px] px-2"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            }
          >
            {list.length === 0 ? (
              <OperatorEmpty title="No stations" body="Adjust filters or add a station in the EV Charging setup flow." />
            ) : view === "table" ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="text-[11px]">Station</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px] text-right">Uptime</TableHead>
                    <TableHead className="text-[11px] text-right">Connectors</TableHead>
                    <TableHead className="text-[11px] text-right">Active</TableHead>
                    <TableHead className="text-[11px] text-right">Today ₹</TableHead>
                    <TableHead className="text-[11px] text-right">Today kWh</TableHead>
                    <TableHead className="text-[11px] text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((s) => (
                    <TableRow
                      key={s.stationId}
                      className="text-[12px] cursor-pointer"
                      onClick={() => navigate(`/operator/stations/${s.stationId}`)}
                    >
                      <TableCell className="py-2">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                          {s.address}
                        </p>
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                            s.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : s.status === "paused"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span
                          className={cn(
                            "font-bold",
                            s.uptimePct === 100
                              ? "text-emerald-700"
                              : s.uptimePct >= 90
                                ? "text-amber-700"
                                : "text-red-700",
                          )}
                        >
                          {s.uptimePct}%
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {s.connectorsAvailable} / {s.connectorsTotal}
                        {s.connectorsOffline > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-red-700">
                            · {s.connectorsOffline} offline
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right font-semibold">
                        {s.activeSessions}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono font-semibold">
                        ₹{s.todayRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono">
                        {s.todayKwh}
                      </TableCell>
                      <TableCell className="py-2 text-right">{s.utilizationPct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-[520px]">
                <MapContainer
                  center={center}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  {list.map((s) => {
                    const rawStation = rawMap.get(s.stationId);
                    if (!rawStation) return null;
                    return (
                      <Marker
                        key={s.stationId}
                        position={[rawStation.lat, rawStation.lng]}
                        icon={upIcon(s.uptimePct)}
                        eventHandlers={{
                          click: () => navigate(`/operator/stations/${s.stationId}`),
                        }}
                      >
                        <Popup>
                          <div style={{ fontSize: 12 }}>
                            <strong>{s.name}</strong>
                            <br />
                            {s.connectorsAvailable}/{s.connectorsTotal} available
                            <br />
                            ₹{s.todayRevenue.toLocaleString()} · {s.todaySessions} today
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            )}
          </OperatorSection>
        </OperatorPageBody>
      )}
    </OperatorLayout>
  );
};

export default OperatorStationsScreen;
