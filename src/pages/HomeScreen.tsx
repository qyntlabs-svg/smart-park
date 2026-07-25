import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AnimatedPage,
  AnimatedList,
  AnimatedListItem,
  hoverLift,
  hoverCapable,
} from "@/shared/motion";
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
  Zap,
  Warehouse,
  Check,
  CircleDashed,
  ChevronRight,
  Route,
  Siren,
  Timer,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import BottomNav from "@/components/BottomNav";
import SideDrawer from "@/components/SideDrawer";
import ParkingMap from "@/components/ParkingMap";
import { useParkingFacilities } from "@/api/parking";
import { useVehicles } from "@/api/vehicles";
import { useProfile } from "@/api/user";
import { useNotifications } from "@/api/notifications";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Geolocation } from "@capacitor/geolocation";
import {
  useEvStations,
  useEvVehicleProfiles,
  useUserEvSessions,
} from "@/modules/ev/hooks";
import { useAuthStore } from "@/store/auth.store";
import { formatKm } from "@/shared/lib/geo";
import { readJson, writeJson } from "@/shared/lib/storage";
import {
  ProactiveCard,
  useProactiveSuggestions,
  useDismissProactiveSuggestion,
} from "@/modules/consumer/ai";
import { useActiveParkingSession } from "@/modules/consumer/parking-session";

const HomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
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

  // Consumer Extended additions ---------------------------------------------
  const userIdForConsumer = user?.id ?? user?.phone ?? "guest";
  const { data: activeParkingSession } = useActiveParkingSession(userIdForConsumer);
  const { data: proactiveSuggestions = [] } = useProactiveSuggestions();
  const dismissProactive = useDismissProactiveSuggestion();

  // Active EV session (for the floater banner) — read the same user's sessions
  // and surface any that are currently `active`. Also resolve the station name.
  const { data: userEvSessions = [] } = useUserEvSessions(userIdForConsumer);
  const activeEvSession = userEvSessions.find((s) => s.status === "active");
  const { data: evStationsAll = [] } = useEvStations({ onlyOpen: false });
  const activeEvStationName = activeEvSession
    ? (evStationsAll.find((s) => s.id === activeEvSession.stationId)?.name ??
      "Charging station")
    : null;

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
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

      {/* Active parking session banner — CONSUMER_EXT (C-21) */}
      {activeParkingSession && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            navigate(`/parking/session/${activeParkingSession.id}`)
          }
          className="mx-4 mt-3 flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-2xl shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-caption font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              You're parked
            </p>
            <p className="text-body-sm font-bold truncate">
              {activeParkingSession.facilityName}
            </p>
            <p className="text-caption opacity-90">
              {formatElapsed(activeParkingSession.startedAt)} • ₹
              {Math.round(activeParkingSession.runningCost)} running
            </p>
          </div>
          <ChevronRight className="w-4 h-4 opacity-90 shrink-0" />
        </motion.button>
      )}

      {/* Active EV session banner — CONSUMER_EXT (mirrors parking session banner) */}
      {activeEvSession && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/ev/session/${activeEvSession.id}`)}
          className="mx-4 mt-3 flex items-center gap-3 p-4 bg-emerald-600 text-white rounded-2xl shadow-md"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-caption font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              Charging now
            </p>
            <p className="text-body-sm font-bold truncate">
              {activeEvStationName}
            </p>
            <p className="text-caption opacity-90">
              {activeEvSession.kwhDelivered.toFixed(1)} kWh · ₹
              {Math.round(activeEvSession.cost)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 opacity-90 shrink-0" />
        </motion.button>
      )}

      {/* AI Proactive carousel — CONSUMER_EXT (C-44 inline) */}
      {proactiveSuggestions.length > 0 && (
        <div className="mt-3 pl-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pr-4 pb-1 snap-x snap-mandatory">
            <AnimatePresence initial={false}>
              {proactiveSuggestions.slice(0, 3).map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="snap-start shrink-0"
                >
                  <ProactiveCard
                    suggestion={s}
                    variant="compact"
                    onDismiss={(id) => dismissProactive.mutate(id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* EV Charging hero — Phase 0 wedge landing */}
      <EvChargingHero />

      {/* Activation checklist (G-03) — new users only */}
      <ActivationChecklist />

      {/* Monthly Pass Banner */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/monthly-pass/active")}
        className="mx-4 mt-3 flex items-center gap-3 p-4 bg-card border border-border rounded-2xl"
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

      {/* Quick access — Rent-a-Spot + Journey (EV promoted to hero above) */}
      <AnimatedList className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <AnimatedListItem>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={hoverCapable ? hoverLift : undefined}
            onClick={() => navigate("/rentals")}
            className="w-full flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-bold text-foreground">
                Rent a spot
              </p>
              <p className="text-caption text-muted-foreground">
                Daily · weekly · monthly
              </p>
            </div>
          </motion.button>
        </AnimatedListItem>

        {/* CONSUMER_EXT — Journey planner (C-45) */}
        <AnimatedListItem>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={hoverCapable ? hoverLift : undefined}
            onClick={() => navigate("/journey")}
            className="w-full flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-bold text-foreground">
                Plan a journey
              </p>
              <p className="text-caption text-muted-foreground">
                Charge + park in one tap
              </p>
            </div>
          </motion.button>
        </AnimatedListItem>
      </AnimatedList>

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

      {/* CONSUMER_EXT — SOS floating action button (C-41).
          Wrapped in a max-w-md pointer-none column so it aligns with the
          mobile shell on desktop viewports and stays above BottomNav. */}
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-md h-[100dvh] pointer-events-none">
          {/* Idle micro-pulse ring — draws the eye without being noisy */}
          <motion.div
            className="pointer-events-none absolute right-4 bottom-[92px] w-14 h-14 rounded-full bg-destructive/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [1, 1.04, 1] }}
            transition={{
              opacity: { duration: 0.4 },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              },
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={hoverCapable ? { scale: 1.08 } : undefined}
            onClick={() => navigate("/sos")}
            aria-label="Emergency SOS"
            className="pointer-events-auto absolute right-4 bottom-[92px] w-14 h-14 rounded-full bg-destructive text-white shadow-2xl flex flex-col items-center justify-center border-4 border-background"
          >
            <Siren className="w-5 h-5" strokeWidth={2.4} />
            <span className="text-[9px] font-bold tracking-wider">SOS</span>
          </motion.button>
        </div>
      </div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BottomNav />
    </AnimatedPage>
  );
};

// Small helper for the CONSUMER_EXT active parking banner label.
function formatElapsed(startedAtIso: string): string {
  const started = new Date(startedAtIso).getTime();
  const mins = Math.max(0, Math.floor((Date.now() - started) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------- EV hero + activation checklist ----------

/**
 * Phase 0 wedge landing: promotes EV charging above parking. Shows the
 * closest 1–2 stations as inline chips or, if the user has no EV in their
 * garage, a stronger G-02 empty state.
 */
const EvChargingHero = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 5000 })
      .then((p) =>
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      )
      .catch(() => setOrigin({ lat: 13.0827, lng: 80.2707 }));
  }, []);

  const { data: profiles = [] } = useEvVehicleProfiles();
  const { data: stations = [] } = useEvStations(
    { onlyOpen: true },
    origin ?? undefined,
  );

  const hasEv = profiles.length > 0;
  const topStations = stations.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      className="mx-4 mt-3 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md relative"
    >
      {/* Subtle sweeping shimmer over the CTA */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-4 rounded-2xl"
        style={{
          background:
            "linear-gradient(120deg, transparent 30%, hsl(var(--primary) / 0.18) 50%, transparent 70%)",
        }}
        initial={{ x: "-30%" }}
        animate={{ x: "130%" }}
        transition={{
          duration: 3.4,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1.2,
        }}
      />
      <button
        onClick={() =>
          hasEv
            ? navigate("/ev")
            : navigate("/add-vehicle?type=ev&next=/ev")
        }
        className="relative w-full text-left bg-gradient-to-br from-primary/15 via-primary/8 to-emerald-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-primary" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-bold text-foreground">
              {hasEv
                ? "Reserve a charger near you"
                : "Add your EV to unlock charging"}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {hasEv
                ? "Skip the queue · pay via UPI"
                : "One tap. Connector + battery. That's it."}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary mt-1 shrink-0" />
        </div>

        {hasEv && topStations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topStations.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur px-3 py-1.5 border border-primary/20"
              >
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-caption font-bold text-foreground truncate max-w-[120px]">
                  {s.name.split("—")[1]?.trim() ?? s.name}
                </span>
                {typeof s.distanceKm === "number" && (
                  <span className="text-caption text-muted-foreground">
                    · {formatKm(s.distanceKm)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </button>
    </motion.div>
  );
};

const CHECKLIST_KEY = "smartpark_activation_checklist";

interface ChecklistState {
  dismissed: boolean;
}

const ActivationChecklist = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?.phone ?? "guest";

  const { data: profiles = [] } = useEvVehicleProfiles();
  const { data: sessions = [] } = useUserEvSessions(userId);

  const [state, setState] = useState<ChecklistState>(() =>
    readJson<ChecklistState>(CHECKLIST_KEY, { dismissed: false }),
  );

  const hasEv = profiles.length > 0;
  const hasPaid = sessions.some(
    (s) => s.status === "active" || s.status === "completed",
  );
  const hasReserved = sessions.length > 0;

  const completeCount = useMemo(
    () => [hasEv, hasPaid, hasReserved].filter(Boolean).length,
    [hasEv, hasPaid, hasReserved],
  );
  const total = 3;

  const allDone = completeCount === total;
  if (state.dismissed || allDone) return null;

  const dismiss = () => {
    const next = { ...state, dismissed: true };
    setState(next);
    writeJson(CHECKLIST_KEY, next);
  };

  const steps: Array<{
    key: string;
    label: string;
    done: boolean;
    onClick: () => void;
  }> = [
    {
      key: "ev",
      label: "Add your EV vehicle",
      done: hasEv,
      onClick: () => navigate("/add-vehicle?type=ev&next=/home"),
    },
    {
      key: "upi",
      label: "Add UPI payment method",
      done: hasPaid,
      onClick: () => navigate("/ev"),
    },
    {
      key: "reserve",
      label: "Reserve your first charger",
      done: hasReserved,
      onClick: () => navigate("/ev"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div>
          <p className="text-body-sm font-bold text-foreground">
            Get set up
          </p>
          <p className="text-caption text-muted-foreground">
            {completeCount}/{total} complete
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1 text-muted-foreground text-caption"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-3 h-1 bg-primary/10">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(completeCount / total) * 100}%` }}
        />
      </div>
      <div className="p-3 space-y-1">
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={step.done ? undefined : step.onClick}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors ${
              step.done ? "" : "active:bg-secondary"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {step.done ? (
                <Check className="w-3 h-3" />
              ) : (
                <CircleDashed className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-body-sm flex-1 text-left ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}
            >
              {step.label}
            </span>
            {!step.done && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default HomeScreen;
