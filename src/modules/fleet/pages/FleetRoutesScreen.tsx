// Screen: F-09 · Primitives: Location, Availability, Reservation
// Route Planner (fleet) — optimize routes across charging stops on a map.

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Route as RouteIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  FleetLayout,
  FleetLoading,
  FleetPageBody,
  FleetSection,
} from "@/modules/fleet/components/FleetLayout";
import {
  useFleetDepots,
  useFleetRoutes,
  useReoptimizeRoute,
} from "@/modules/fleet/hooks";
import { cn } from "@/lib/utils";

// leaflet default icons don't ship in a bundler-friendly way; force URLs.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const depotIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);"></div>`,
  iconAnchor: [11, 11],
});
const waypointIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
  iconAnchor: [7, 7],
});

const FleetRoutesScreen = () => {
  const routes = useFleetRoutes();
  const depots = useFleetDepots();
  const reopt = useReoptimizeRoute();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () =>
      routes.data?.find((r) => r.id === selectedId) ?? routes.data?.[0] ?? null,
    [routes.data, selectedId],
  );

  useEffect(() => {
    if (!selectedId && routes.data?.length) setSelectedId(routes.data[0].id);
  }, [routes.data, selectedId]);

  const positions = useMemo(
    () => (selected?.waypoints ?? []).map((w) => [w.lat, w.lng] as [number, number]),
    [selected],
  );

  const originDepot = useMemo(
    () => depots.data?.find((d) => d.id === selected?.originDepotId),
    [selected, depots.data],
  );

  const mapCenter: [number, number] = originDepot
    ? [originDepot.lat, originDepot.lng]
    : [13.0426, 80.2331];

  const reoptimize = async () => {
    if (!selected) return;
    try {
      await reopt.mutateAsync(selected.id);
      toast.success("Route re-optimized — distance reduced");
    } catch {
      toast.error("Re-optimization failed");
    }
  };

  if (routes.isLoading || depots.isLoading)
    return (
      <FleetLayout
        title="Route planner"
        screenId="F-09"
        primitives={["Location", "Availability", "Reservation"]}
      >
        <FleetLoading />
      </FleetLayout>
    );

  return (
    <FleetLayout
      title="Route planner"
      screenId="F-09"
      primitives={["Location", "Availability", "Reservation"]}
      actions={
        <button
          onClick={reoptimize}
          disabled={!selected || reopt.isPending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Re-optimize
        </button>
      }
    >
      <FleetPageBody>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <FleetSection title="Routes" subtitle={`${routes.data?.length ?? 0} configured`}>
            <ul className="divide-y divide-slate-100">
              {routes.data?.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors",
                      selected?.id === r.id ? "bg-blue-50/60" : "hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RouteIcon
                        className={cn(
                          "w-4 h-4",
                          selected?.id === r.id ? "text-blue-600" : "text-slate-400",
                        )}
                      />
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {r.name}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {r.distanceKm} km · {r.waypoints.length} stops ·{" "}
                      {r.chargingStops.length} charge
                    </p>
                    {r.optimizedAt && (
                      <p className="mt-0.5 text-[10px] text-emerald-600">
                        Optimized {new Date(r.optimizedAt).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </FleetSection>

          <FleetSection
            title={selected?.name ?? "Route"}
            subtitle={
              selected
                ? `${selected.distanceKm} km · ${selected.chargingStops.length} charging stops`
                : ""
            }
          >
            <div className="h-[480px]">
              <MapContainer
                center={mapCenter}
                zoom={11}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {positions.length > 1 && (
                  <Polyline positions={positions} pathOptions={{ color: "#2563eb", weight: 4 }} />
                )}
                {selected?.waypoints.map((w, i) => (
                  <Marker
                    key={i}
                    position={[w.lat, w.lng]}
                    icon={i === 0 ? depotIcon : waypointIcon}
                  >
                    <Popup>
                      <span style={{ fontSize: 12 }}>
                        <b>#{i + 1}</b> {w.label}
                      </span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </FleetSection>
        </div>
      </FleetPageBody>
    </FleetLayout>
  );
};

export default FleetRoutesScreen;
