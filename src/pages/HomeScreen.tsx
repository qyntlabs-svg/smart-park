import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Menu, Bell, User, MapPin, RefreshCw, ChevronDown,
  Car, Navigation, Map, List
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";

// Mock parking data
const MOCK_PARKING = [
  { id: "1", name: "Phoenix Mall Parking", distance: "0.8 km", available: 45, total: 60, price: 40, rating: 4.5, lat: 13.002, lng: 80.21 },
  { id: "2", name: "Tambaram Station Parking", distance: "1.2 km", available: 12, total: 50, price: 25, rating: 4.0, lat: 12.923, lng: 80.127 },
  { id: "3", name: "Grand Square Mall", distance: "2.1 km", available: 8, total: 40, price: 50, rating: 4.8, lat: 13.011, lng: 80.209 },
  { id: "4", name: "Selaiyur Metro Parking", distance: "3.0 km", available: 0, total: 30, price: 20, rating: 3.8, lat: 12.913, lng: 80.22 },
  { id: "5", name: "Chromepet Market Parking", distance: "1.5 km", available: 22, total: 35, price: 30, rating: 4.2, lat: 12.952, lng: 80.141 },
];

const getMarkerColor = (available: number, total: number) => {
  const pct = available / total;
  if (pct === 0) return "bg-muted-foreground";
  if (pct < 0.2) return "bg-destructive";
  if (pct < 0.5) return "bg-warning";
  return "bg-success";
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"map" | "list">("map");
  const [vehicleSheet, setVehicleSheet] = useState(false);
  const [selectedParking, setSelectedParking] = useState<string | null>(null);

  const parking = MOCK_PARKING.find((p) => p.id === selectedParking);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border z-10">
        <button className="touch-target flex items-center justify-center">
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-1.5">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-body font-bold text-foreground">Auto Doc</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="touch-target flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
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
        <h2 className="text-heading-md text-foreground">Hi there! 👋</h2>
        <div className="mt-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" />
          <p className="text-body-sm text-muted-foreground">Tambaram, Chennai</p>
          <button className="ml-1 text-caption text-primary font-semibold">Change</button>
        </div>
      </div>

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
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Booking For</p>
          <p className="text-body-sm font-bold text-foreground mt-0.5">TN 01 AB 1234</p>
        </div>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </motion.button>

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

      {/* Map / List area */}
      <div className="flex-1 relative mt-3 mx-4 mb-4 rounded-2xl overflow-hidden border border-border">
        {view === "map" ? (
          <div className="w-full h-full min-h-[400px] bg-secondary relative">
            {/* Mock map background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                <p className="mt-2 text-body-sm text-muted-foreground/50">Map View</p>
              </div>
            </div>

            {/* Mock markers */}
            {MOCK_PARKING.map((p, i) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 1.2 }}
                onClick={() => setSelectedParking(p.id)}
                className="absolute"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${15 + i * 16}%`,
                }}
              >
                <div className={`w-10 h-10 rounded-full ${getMarkerColor(p.available, p.total)} flex items-center justify-center shadow-lg`}>
                  <span className="text-caption font-bold text-primary-foreground">{p.available}</span>
                </div>
              </motion.button>
            ))}

            {/* User location */}
            <div className="absolute top-[45%] left-[45%]">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground shadow-lg animate-pulse-dot" />
            </div>

            {/* Map controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button className="w-12 h-12 rounded-full bg-card shadow-lg flex items-center justify-center border border-border">
                <Navigation className="w-5 h-5 text-primary" />
              </button>
              <button className="w-12 h-12 rounded-full bg-card shadow-lg flex items-center justify-center border border-border">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full min-h-[400px] overflow-y-auto p-4 space-y-3 bg-background">
            {MOCK_PARKING.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedParking(p.id)}
                className="w-full flex gap-3 p-4 bg-card border border-border rounded-2xl text-left"
              >
                <div className="w-[80px] h-[80px] shrink-0 rounded-xl bg-secondary flex items-center justify-center">
                  <Car className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">{p.name}</p>
                  <p className="mt-0.5 text-caption text-muted-foreground">{p.distance} away</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getMarkerColor(p.available, p.total)}`}
                        style={{ width: `${(p.available / p.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-caption font-semibold text-foreground">{p.available}/{p.total}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-body-sm font-bold text-primary">₹{p.price}/hr</span>
                    <span className="text-caption text-muted-foreground">⭐ {p.rating}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Parking Preview Bottom Sheet */}
      <BottomSheet
        open={!!selectedParking}
        onClose={() => setSelectedParking(null)}
        snapPoints={[0.35]}
      >
        {parking && (
          <div>
            <h3 className="text-heading-sm text-foreground">{parking.name}</h3>
            <p className="mt-1 text-body-sm text-muted-foreground">{parking.distance} away</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${getMarkerColor(parking.available, parking.total)}`}
                  style={{ width: `${(parking.available / parking.total) * 100}%` }}
                />
              </div>
              <span className="text-body-sm font-semibold text-foreground">
                {parking.available}/{parking.total} slots
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-heading-sm text-primary">₹{parking.price}/hr</span>
              <span className="text-body-sm text-muted-foreground">⭐ {parking.rating}</span>
            </div>
            <MobileButton
              fullWidth
              className="mt-6"
              disabled={parking.available === 0}
              onClick={() => navigate(`/parking/${parking.id}/slots`)}
            >
              {parking.available === 0 ? "Fully Booked" : "View Available Slots"}
            </MobileButton>
          </div>
        )}
      </BottomSheet>

      {/* Vehicle selector sheet */}
      <BottomSheet open={vehicleSheet} onClose={() => setVehicleSheet(false)} snapPoints={[0.5]}>
        <h3 className="text-heading-sm text-foreground">Select Vehicle</h3>
        <div className="mt-4 space-y-3">
          <button className="w-full flex items-center gap-3 p-4 border-2 border-primary bg-primary/5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-body-sm font-bold text-foreground">TN 01 AB 1234</p>
              <p className="text-caption text-muted-foreground">My Car</p>
            </div>
          </button>
        </div>
        <button
          onClick={() => { setVehicleSheet(false); navigate("/add-vehicle"); }}
          className="mt-4 w-full h-14 border-2 border-dashed border-border rounded-xl text-body-sm font-semibold text-muted-foreground"
        >
          + Add New Vehicle
        </button>
        <MobileButton fullWidth className="mt-4" onClick={() => setVehicleSheet(false)}>
          Apply Selection
        </MobileButton>
      </BottomSheet>
    </div>
  );
};

export default HomeScreen;
