// Screen: MI-02 · Primitives: Location, Availability
// Route: /intel/heatmap
// Where do people search for chargers/parking and not find? — heatmap-style
// circle-marker overlay on leaflet.

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import {
  IntelCard,
  IntelEmpty,
  IntelError,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelHeatmap } from "../hooks";
import type { DateRange, IntelCity } from "../types";

// leaflet CSS is loaded globally via existing map components.

const CITY_CENTER: Record<IntelCity | "all", [number, number]> = {
  chennai: [13.03, 80.22],
  bengaluru: [12.96, 77.65],
  hyderabad: [17.44, 78.4],
  mumbai: [19.05, 72.85],
  all: [13.03, 80.22],
};

// Refit bounds when city selection changes.
const FitCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12, { animate: true });
  }, [map, center]);
  return null;
};

const IntelHeatmapScreen = () => {
  const [city, setCity] = useState<IntelCity | "all">("chennai");
  const [range, setRange] = useState<DateRange>("30d");
  const { data, isLoading, isError } = useIntelHeatmap(city, range);

  const maxUnmet = useMemo(
    () => Math.max(1, ...(data ?? []).map((d) => d.unmet)),
    [data],
  );

  return (
    <IntelLayout
      title="Demand heatmap"
      subtitle="Circle size = search volume, colour = unmet-demand ratio"
      city={city}
      onCityChange={setCity}
      range={range}
      onRangeChange={setRange}
    >
      {isLoading ? (
        <IntelLoading />
      ) : isError ? (
        <IntelError msg="Failed to load heatmap." />
      ) : !data || data.length === 0 ? (
        <IntelEmpty title="No demand recorded for this city" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <IntelCard className="lg:col-span-2 !p-0">
            <div className="h-[540px] rounded-lg overflow-hidden">
              <MapContainer
                center={CITY_CENTER[city]}
                zoom={12}
                style={{ height: "100%", width: "100%", background: "#0a0f1c" }}
                scrollWheelZoom
              >
                <FitCenter center={CITY_CENTER[city]} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {data.map((d) => {
                  const radius = 10 + (d.sessions + d.unmet) / (maxUnmet / 8);
                  const hue = Math.max(0, 120 - d.gapPct * 3); // green→amber→red
                  const fill = `hsl(${hue}, 85%, 55%)`;
                  return (
                    <CircleMarker
                      key={d.zone.id}
                      center={[d.zone.lat, d.zone.lng]}
                      radius={Math.min(40, radius)}
                      pathOptions={{
                        color: fill,
                        weight: 1,
                        fillColor: fill,
                        fillOpacity: 0.35,
                      }}
                    >
                      <Popup>
                        <div style={{ fontSize: 12 }}>
                          <b>{d.zone.name}</b>
                          <br />
                          Sessions: {d.sessions.toLocaleString()}
                          <br />
                          Unmet: {d.unmet.toLocaleString()} ({d.gapPct}%)
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </IntelCard>

          <IntelCard title="Top gaps in this window">
            <ul className="divide-y divide-slate-800">
              {data
                .slice()
                .sort((a, b) => b.unmet - a.unmet)
                .slice(0, 10)
                .map((d) => (
                  <li
                    key={d.zone.id}
                    className="py-2 flex items-center gap-2 text-[12px]"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{
                        background: `hsl(${Math.max(0, 120 - d.gapPct * 3)}, 85%, 55%)`,
                      }}
                    />
                    <span className="flex-1 truncate">{d.zone.name}</span>
                    <span className="text-rose-300 tabular-nums">
                      {d.unmet.toLocaleString()}
                    </span>
                    <span className="text-slate-400 tabular-nums w-10 text-right">
                      {d.gapPct}%
                    </span>
                  </li>
                ))}
            </ul>
          </IntelCard>
        </div>
      )}
    </IntelLayout>
  );
};

export default IntelHeatmapScreen;
