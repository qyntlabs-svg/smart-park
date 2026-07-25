import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  Navigation,
  Loader2,
  Search,
  X,
  Check,
  MapPin,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { usePartnerSetup, useUpdateSetup } from "@/api/partner";

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

const ClickHandler = ({ onPick }: { onPick: (pos: LatLng) => void }) => {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

const DEFAULT_POS: LatLng = { lat: 13.002, lng: 80.21 };

const PartnerPinMapScreen = () => {
  const navigate = useNavigate();
  const { data: setup, isLoading: loadingSetup } = usePartnerSetup();
  const updateSetup = useUpdateSetup();

  const [pos, setPos] = useState<LatLng>(DEFAULT_POS);
  const [address, setAddress] = useState("");
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Populate from existing facility data once loaded
  useEffect(() => {
    if (!setup) return;
    const lat = setup.latitude ?? DEFAULT_POS.lat;
    const lng = setup.longitude ?? DEFAULT_POS.lng;
    const addr = setup.address ?? "";
    setPos({ lat, lng });
    setAddress(addr);
    setSearchText(addr.split(",")[0] ?? "");
  }, [setup]);

  const applyPosition = useCallback(
    async (newPos: LatLng, knownAddress?: string) => {
      setPos(newPos);
      setSuggestions([]);
      setDirty(true);
      if (knownAddress) {
        setAddress(knownAddress);
        setSearchText(knownAddress.split(",")[0]);
      } else {
        setGeocoding(true);
        const addr = await reverseGeocode(newPos.lat, newPos.lng);
        setGeocoding(false);
        setAddress(addr);
        setSearchText(addr.split(",")[0]);
      }
    },
    [],
  );

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await forwardGeocode(val);
      setSearching(false);
      setSuggestions(results);
    }, 300);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        applyPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Location access denied");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSave = async () => {
    if (!address) {
      toast.error("Please select a location first");
      return;
    }
    try {
      await updateSetup.mutateAsync({
        address,
        latitude: pos.lat,
        longitude: pos.lng,
      });
      toast.success("Location updated");
      setDirty(false);
      navigate(-1);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message || "Failed to update location",
      );
    }
  };

  if (loadingSetup) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-body font-semibold text-foreground">
          No facility set up yet
        </p>
        <p className="text-body-sm text-muted-foreground mt-1">
          Complete your parking setup first to pin your location.
        </p>
        <MobileButton
          className="mt-6"
          onClick={() => navigate("/partner/setup")}
        >
          Go to Setup
        </MobileButton>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
          Facility Location
        </h1>
      </header>

      {/* Facility name pill */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <p className="text-body-sm font-semibold text-foreground truncate">
            {setup.name ?? "Your Facility"}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-2 pb-1 relative z-20">
        <div className="flex items-center gap-2 h-12 px-3 bg-card border border-border rounded-xl shadow-sm">
          {searching ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search area, street or landmark…"
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

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-[2000]">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() =>
                  applyPosition(
                    { lat: parseFloat(s.lat), lng: parseFloat(s.lon) },
                    s.display_name,
                  )
                }
                className="w-full text-left px-4 py-3 border-b border-border last:border-0 active:bg-secondary"
              >
                <p className="text-body-sm font-semibold text-foreground truncate">
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
        className="mx-4 relative rounded-2xl overflow-hidden border border-border"
        style={{ height: 340 }}
      >
        <MapContainer
          center={[pos.lat, pos.lng]}
          zoom={15}
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
          <ClickHandler onPick={applyPosition} />
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

      {/* Current address */}
      {address && (
        <div className="mx-4 mt-3 flex items-start gap-2 p-3 bg-card border border-border rounded-xl">
          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">
              Pinned location
            </p>
            <p className="text-body-sm text-foreground leading-snug mt-0.5">
              {address}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-caption text-muted-foreground mt-2 px-4">
        Search or tap the map to update your facility pin
      </p>

      <div className="px-4 pb-8 pb-safe pt-4 mt-auto">
        <MobileButton
          fullWidth
          disabled={!dirty || !address}
          loading={updateSetup.isPending}
          onClick={handleSave}
        >
          Save Location
        </MobileButton>
      </div>
    </div>
  );
};

export default PartnerPinMapScreen;
