import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ParkingFacility } from "@/api/parking";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const priceIcon = (price: number, selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background:${selected ? "#1a1a2e" : "#FFC700"};
      color:${selected ? "#FFC700" : "#1a1a2e"};
      padding:4px 8px;border-radius:20px;
      font-size:12px;font-weight:700;white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      border:2px solid ${selected ? "#FFC700" : "#fff"};
      transform: scale(${selected ? 1.15 : 1});
      transition: transform 0.15s;
    ">&#8377;${price}</div>`,
    iconAnchor: [24, 12],
  });

const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;background:#3b82f6;
    border:3px solid #fff;border-radius:50%;
    box-shadow:0 0 0 4px rgba(59,130,246,0.3);
  "></div>`,
  iconAnchor: [8, 8],
});

const searchPinIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;background:#ef4444;
    border:3px solid #fff;border-radius:50%;
    box-shadow:0 2px 8px rgba(239,68,68,0.5);
  "></div>`,
  iconAnchor: [10, 10],
});

// Fly to a new center when searchCenter changes
const MapController = ({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom: number;
}) => {
  const map = useMap();
  const prevCenter = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!center) return;
    if (
      prevCenter.current?.[0] === center[0] &&
      prevCenter.current?.[1] === center[1]
    )
      return;
    prevCenter.current = center;
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);

  return null;
};

// Fit bounds once when facilities first load
const FitBounds = ({
  userLat,
  userLng,
  facilities,
  searchCenter,
}: {
  userLat: number;
  userLng: number;
  facilities: ParkingFacility[];
  searchCenter: [number, number] | null;
}) => {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    // Don't auto-fit if user has searched — MapController handles that
    if (fitted.current || facilities.length === 0 || searchCenter) return;
    fitted.current = true;

    const points: [number, number][] = [[userLat, userLng]];
    facilities.forEach((f) => {
      if (f.latitude && f.longitude) points.push([f.latitude, f.longitude]);
    });

    if (points.length <= 1) {
      map.setView([userLat, userLng], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
    }
  }, [facilities.length, map, userLat, userLng, searchCenter]);

  return null;
};

interface Props {
  userLat: number;
  userLng: number;
  facilities: ParkingFacility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchCenter?: [number, number] | null;
  searchLabel?: string;
}

const ParkingMap = ({
  userLat,
  userLng,
  facilities,
  selectedId,
  onSelect,
  searchCenter = null,
  searchLabel,
}: Props) => {
  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={12}
      style={{ width: "100%", height: "100%", minHeight: 420 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds
        userLat={userLat}
        userLng={userLng}
        facilities={facilities}
        searchCenter={searchCenter}
      />

      {/* Fly to search location */}
      <MapController center={searchCenter} zoom={14} />

      {/* User location dot */}
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Search pin */}
      {searchCenter && (
        <Marker position={searchCenter} icon={searchPinIcon}>
          <Popup>{searchLabel ?? "Searched location"}</Popup>
        </Marker>
      )}

      {/* Parking markers */}
      {facilities
        .filter((p) => p.latitude && p.longitude)
        .map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={priceIcon(p.hourly_rate, selectedId === p.id)}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              &#8377;{p.hourly_rate}/hr
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default ParkingMap;
