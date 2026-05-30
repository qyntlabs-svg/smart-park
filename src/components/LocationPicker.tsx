import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Navigation, Loader2, Search, X } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY as string;

interface LatLng {
  lat: number;
  lng: number;
}

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

// ── LocationIQ reverse geocode: coords → address ──────────────────────────
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.locationiq.com/v1/reverse?key=${LIQ_KEY}&lat=${lat}&lon=${lng}&format=json`,
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

// ── LocationIQ autocomplete: query → suggestions ──────────────────────────
const forwardGeocode = async (query: string): Promise<Suggestion[]> => {
  try {
    const res = await fetch(
      `https://api.locationiq.com/v1/autocomplete?key=${LIQ_KEY}&q=${encodeURIComponent(query)}&limit=5&format=json&countrycodes=in`,
    );
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

// ── Recenter map when position changes ───────────────────────────────────
const RecenterMap = ({ pos }: { pos: LatLng }) => {
  const map = useMap();
  const prev = useRef<LatLng | null>(null);
  useEffect(() => {
    if (
      !prev.current ||
      prev.current.lat !== pos.lat ||
      prev.current.lng !== pos.lng
    ) {
      map.flyTo([pos.lat, pos.lng], 16, { duration: 0.6 });
      prev.current = pos;
    }
  }, [pos, map]);
  return null;
};

// ── Click handler ─────────────────────────────────────────────────────────
const ClickHandler = ({ onPick }: { onPick: (pos: LatLng) => void }) => {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

interface Props {
  lat: number;
  lng: number;
  address: string;
  onChange: (lat: number, lng: number, address: string) => void;
}

const LocationPicker = ({ lat, lng, address, onChange }: Props) => {
  const [pos, setPos] = useState<LatLng>({ lat, lng });
  const [searchText, setSearchText] = useState(address);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync search text when address prop changes externally
  useEffect(() => {
    if (address && address !== searchText) setSearchText(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const applyPosition = useCallback(
    async (newPos: LatLng, knownAddress?: string) => {
      setPos(newPos);
      setSuggestions([]);
      if (knownAddress) {
        setSearchText(knownAddress);
        onChange(newPos.lat, newPos.lng, knownAddress);
      } else {
        setGeocoding(true);
        const addr = await reverseGeocode(newPos.lat, newPos.lng);
        setGeocoding(false);
        setSearchText(addr);
        onChange(newPos.lat, newPos.lng, addr);
      }
    },
    [onChange],
  );

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      const results = await forwardGeocode(val);
      setSearching(false);
      setSuggestions(results);
    }, 300);
  };

  const handleSuggestionPick = (s: Suggestion) => {
    const newPos = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    applyPosition(newPos, s.display_name);
  };

  const handleMapClick = (newPos: LatLng) => applyPosition(newPos);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        applyPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 h-12 px-3 bg-card border border-border rounded-xl">
          {searching ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type your parking address…"
            className="flex-1 bg-transparent text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSuggestions([]);
              }}
              className="shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[2000] mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => handleSuggestionPick(s)}
                className="w-full text-left px-4 py-3 text-body-sm text-foreground active:bg-secondary border-b border-border last:border-0 leading-snug"
              >
                <p className="font-semibold truncate">
                  {s.display_name.split(",")[0]}
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {s.display_name.split(",").slice(1, 3).join(",")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ height: 220 }}
      >
        <MapContainer
          center={[pos.lat, pos.lng]}
          zoom={16}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://locationiq.com">LocationIQ</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LIQ_KEY}`}
            subdomains={["us1", "eu1"]}
            errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap pos={pos} />
          <ClickHandler onPick={handleMapClick} />
          <Marker position={[pos.lat, pos.lng]} />
        </MapContainer>

        {/* GPS button */}
        <button
          type="button"
          onClick={handleGps}
          disabled={locating}
          className="absolute bottom-3 right-3 z-[1000] w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
        >
          {locating ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Geocoding overlay */}
        {geocoding && (
          <div className="absolute inset-0 z-[1000] bg-background/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      <p className="text-caption text-muted-foreground text-center">
        Search or tap map to pin · {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
      </p>
    </div>
  );
};

export default LocationPicker;
