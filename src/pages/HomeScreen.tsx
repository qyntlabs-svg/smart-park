import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Bell,
  User,
  MapPin,
  RefreshCw,
  ChevronDown,
  Car,
  Navigation,
  Map,
  List,
  ClipboardList,
  CalendarCheck,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import BottomNav from "@/components/BottomNav";
import SideDrawer from "@/components/SideDrawer";
import ParkingMap from "@/components/ParkingMap";
import { useParkingFacilities, type ParkingFacility } from "@/api/parking";
import { useVehicles } from "@/api/vehicles";
import { useProfile } from "@/api/user";
import { useNotifications } from "@/api/notifications";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Geolocation } from "@capacitor/geolocation";

const HomeScreen = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"map" | "list">("map");
  const [vehicleSheet, setVehicleSheet] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParking, setSelectedParking] = useState<string | null>(null);

  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  // Location search
  const {
    query,
    setQuery,
    suggestions,
    isSearching,
    error: searchError,
    clear: clearSearch,
  } = useLocationSearch();
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(
    null,
  );
  const [searchLabel, setSearchLabel] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when tapping outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectSuggestion = (s: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setSearchCenter([lat, lon]);
    setSearchLabel(s.display_name.split(",")[0]);
    setQuery(s.display_name.split(",")[0]);
    setQueryLat(lat);
    setQueryLng(lon);
    setShowSuggestions(false);
    setSelectedParking(null);
  };

  const handleClearSearch = () => {
    clearSearch();
    setSearchCenter(null);
    setSearchLabel("");
    // Restore to user's GPS location
    setQueryLat(userLat);
    setQueryLng(userLng);
    setSelectedParking(null);
  };

  // Real user location — fallback to Chennai center while waiting
  const [userLat, setUserLat] = useState(13.002);
  const [userLng, setUserLng] = useState(80.21);
  const [locationReady, setLocationReady] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Stable coords for API query — only update once GPS resolves, don't re-query on every render
  const [queryLat, setQueryLat] = useState(13.002);
  const [queryLng, setQueryLng] = useState(80.21);

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Request permission first (required on Android)
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== "granted") {
          setLocationReady(true);
          return;
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
        });
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setQueryLat(latitude);
        setQueryLng(longitude);
        setLocationReady(true);
        // Reverse geocode to get area name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = data.address;
          const label =
            addr?.suburb ??
            addr?.neighbourhood ??
            addr?.village ??
            addr?.town ??
            addr?.city ??
            addr?.state_district ??
            addr?.state ??
            null;
          if (label) setLocationLabel(label);
        } catch {
          /* silently fail */
        }
      } catch {
        setLocationReady(true);
      }
    };
    getLocation();
  }, []);

  const { data: profile } = useProfile();
  const { data: vehicles } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  const defaultVehicle = vehicles?.find((v) => v.is_default) ?? vehicles?.[0];
  const selectedVehicle = selectedVehicleId
    ? (vehicles?.find((v) => v.id === selectedVehicleId) ?? defaultVehicle)
    : defaultVehicle;

  const {
    data: parkingList,
    isLoading,
    refetch,
  } = useParkingFacilities({
    lat: queryLat,
    lng: queryLng,
    radius_km: 50, // wide radius — shows all Chennai facilities regardless of user's exact location
    ...(selectedVehicle?.vehicle_type
      ? { vehicle_type: selectedVehicle.vehicle_type }
      : {}),
  });

  const parking = parkingList?.find((p) => p.id === selectedParking);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border z-10">
        <button
          onClick={() => setDrawerOpen(true)}
          className="touch-target flex items-center justify-center"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-1.5">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">Auto Doc</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/booking-history")}
            className="touch-target flex items-center justify-center"
          >
            <ClipboardList className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => navigate("/notifications")}
            className="touch-target flex items-center justify-center relative"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-white leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="touch-target flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="px-4 py-4 bg-card">
        <h2 className="text-heading-md text-foreground">
          Hi {profile?.name ?? "there"}! 👋
        </h2>
        <div className="mt-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" />
          <p className="text-body-sm text-muted-foreground">
            {locationLabel ?? profile?.city ?? "Locating…"}
          </p>
          <button
            onClick={() => navigate("/change-location")}
            className="ml-1 text-caption text-primary font-semibold"
          >
            Change
          </button>
        </div>
      </div>

      {/* Monthly Pass Banner */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/monthly-pass/active")}
        className="mx-4 mt-3 flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-body-sm font-bold text-foreground">
            Monthly Parking Pass
          </p>
          <p className="text-caption text-muted-foreground">
            Get unlimited access from ₹1,500/mo
          </p>
        </div>
      </motion.button>

      {/* Vehicle selector */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setVehicleSheet(true)}
        className="mx-4 mt-3 flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
            Booking For
          </p>
          <p className="text-body-sm font-bold text-foreground mt-0.5">
            {selectedVehicle?.registration_number ?? "No vehicle added"}
          </p>
        </div>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      {/* Vehicle selector — inline dropdown, appears right below Booking For button */}
      <AnimatePresence>
        {vehicleSheet && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mx-4 mt-1 bg-card border border-border rounded-2xl shadow-lg overflow-hidden z-10"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-body-sm font-bold text-foreground">
                Select Vehicle
              </h3>
              <button
                onClick={() => setVehicleSheet(false)}
                className="text-muted-foreground text-body-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto scrollbar-hide">
              {(vehicles ?? []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicleId(v.id);
                    setVehicleSheet(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all ${
                    (selectedVehicle?.id ?? defaultVehicle?.id) === v.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-body-sm font-bold text-foreground truncate">
                      {v.registration_number}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {v.nickname || v.model || "Vehicle"}
                      {v.is_default ? " · Default" : ""}
                    </p>
                  </div>
                  {(selectedVehicle?.id ?? defaultVehicle?.id) === v.id && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setVehicleSheet(false);
                  navigate("/add-vehicle");
                }}
                className="w-full h-12 border-2 border-dashed border-border rounded-xl text-body-sm font-semibold text-muted-foreground"
              >
                + Add New Vehicle
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar */}
      <div ref={searchRef} className="mx-4 mt-3 relative z-20">
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-3 py-2.5 shadow-sm">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search area, street or landmark…"
            className="flex-1 bg-transparent text-body-sm text-foreground placeholder-muted-foreground outline-none"
          />
          {query.length > 0 && (
            <button onClick={handleClearSearch} className="shrink-0 p-0.5">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || searchError) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
            >
              {searchError && (
                <p className="px-4 py-3 text-body-sm text-destructive">
                  {searchError}
                </p>
              )}
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 active:bg-secondary text-left"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-foreground truncate">
                      {s.display_name.split(",")[0]}
                    </p>
                    <p className="text-caption text-muted-foreground truncate">
                      {s.display_name.split(",").slice(1, 3).join(",")}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View toggle */}
      <div className="mx-4 mt-3 flex">
        <div className="inline-flex bg-secondary rounded-xl p-1 shadow-sm">
          {[
            { key: "map" as const, icon: Map, label: "Map View" },
            { key: "list" as const, icon: List, label: "List View" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-body-sm font-semibold transition-all duration-200 ${
                view === key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map / List area — shrinks when parking card is shown */}
      <div
        className="relative mt-3 mx-4 rounded-2xl overflow-hidden border border-border transition-all duration-300"
        style={{
          height: selectedParking && view === "map" ? "38vh" : "55vh",
          minHeight: selectedParking && view === "map" ? 240 : 320,
        }}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : view === "map" ? (
          <div className="w-full h-full relative">
            {!locationReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-caption text-muted-foreground">
                    Getting your location…
                  </p>
                </div>
              </div>
            )}
            <ParkingMap
              userLat={userLat}
              userLng={userLng}
              facilities={parkingList ?? []}
              selectedId={selectedParking}
              onSelect={setSelectedParking}
              searchCenter={searchCenter}
              searchLabel={searchLabel}
            />
            {/* Map controls */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    const pos = await Geolocation.getCurrentPosition({
                      enableHighAccuracy: true,
                    });
                    setUserLat(pos.coords.latitude);
                    setUserLng(pos.coords.longitude);
                  } catch {
                    /* permission denied */
                  }
                }}
                className="w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center border border-border"
              >
                <Navigation className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => refetch()}
                className="w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center border border-border"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-4 space-y-3 bg-background">
            {(parkingList ?? [])
              .slice()
              .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
              .map((p, i) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedParking(p.id)}
                  className={`w-full flex gap-3 p-4 bg-card border-2 rounded-2xl text-left transition-colors ${
                    selectedParking === p.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <div className="w-[80px] h-[80px] shrink-0 rounded-xl bg-secondary flex items-center justify-center relative">
                    <Car className="w-8 h-8 text-primary/40" />
                    {i === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full">
                        NEAREST
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold text-foreground truncate">
                      {p.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-caption text-muted-foreground">
                        {p.distance_km ? `${p.distance_km} km away` : "Nearby"}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className="text-body-sm font-bold text-primary">
                        ₹{p.hourly_rate}/hr
                      </p>
                      <span
                        className={`text-caption font-semibold px-1.5 py-0.5 rounded-lg ${
                          p.available_slots > 0
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {p.available_slots > 0
                          ? `${p.available_slots} free`
                          : "Full"}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
          </div>
        )}
      </div>

      {/* Parking preview card — slides in below map, no overlap */}
      <motion.div
        initial={false}
        animate={
          selectedParking && parking
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 20 }
        }
        transition={{ duration: 0.2 }}
        className="mx-4 mt-2 mb-24"
        style={{ pointerEvents: selectedParking && parking ? "auto" : "none" }}
      >
        {parking && (
          <div className="p-4 bg-card border border-border rounded-2xl shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-body font-bold text-foreground truncate">
                  {parking.name}
                </h3>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {parking.address ?? ""}
                  {parking.distance_km
                    ? ` · ${parking.distance_km} km away`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedParking(null)}
                className="ml-2 p-1 text-muted-foreground shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-heading-sm text-primary">
                ₹{parking.hourly_rate}/hr
              </span>
              <span className="text-caption text-muted-foreground capitalize px-2 py-1 bg-secondary rounded-lg">
                {parking.parking_type} parking
              </span>
            </div>
            <MobileButton
              fullWidth
              className="mt-3"
              onClick={() =>
                navigate(`/parking/${parking.id}/slots`, {
                  state: {
                    vehicleId: selectedVehicle?.id,
                    vehicleRegistration: selectedVehicle?.registration_number,
                    vehicleType: selectedVehicle?.vehicle_type,
                  },
                })
              }
            >
              View Available Slots
            </MobileButton>
          </div>
        )}
      </motion.div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BottomNav />
    </div>
  );
};

export default HomeScreen;
