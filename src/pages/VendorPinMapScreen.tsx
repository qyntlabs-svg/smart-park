import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Check } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const POPULAR_AREAS = [
  { name: "Tambaram", lat: 12.9249, lng: 80.1278 },
  { name: "Chromepet", lat: 12.9516, lng: 80.1462 },
  { name: "Velachery", lat: 12.9815, lng: 80.2180 },
  { name: "T. Nagar", lat: 13.0418, lng: 80.2341 },
  { name: "Adyar", lat: 13.0012, lng: 80.2565 },
  { name: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
];

const VendorPinMapScreen = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState("");

  const filteredAreas = POPULAR_AREAS.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    const location = selectedArea || customAddress || "Current Location";
    localStorage.setItem("vendorParkingLocation", location);
    toast.success(`Location set to ${location}`);
    navigate(-1);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setSelectedArea(null);
          setCustomAddress("Current GPS Location");
          toast.success("Using your current location");
        },
        () => toast.error("Location access denied")
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Pin on Map</h1>
      </header>

      {/* Mock map */}
      <div className="mx-4 mt-4 h-[200px] bg-secondary rounded-2xl border border-border relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-primary mx-auto" />
            <p className="mt-1 text-caption text-muted-foreground">
              {selectedArea || customAddress || "Select a location below"}
            </p>
          </div>
        </div>
        {selectedArea && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-[40%] left-[48%] w-6 h-6 rounded-full bg-primary border-2 border-primary-foreground shadow-lg"
          />
        )}
      </div>

      <div className="px-4 pt-4 space-y-3 flex-1 overflow-y-auto scrollbar-hide">
        {/* Current location */}
        <MobileButton variant="outline" fullWidth onClick={handleUseCurrentLocation}>
          <Navigation className="w-4 h-4" /> Use Current Location
        </MobileButton>

        {/* Search */}
        <Input
          placeholder="Search area or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-xl"
        />

        {/* Areas */}
        <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Popular Areas</p>
        <div className="space-y-2">
          {filteredAreas.map((area) => (
            <motion.button
              key={area.name}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedArea(area.name);
                setCustomAddress("");
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedArea === area.name
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <MapPin className={`w-5 h-5 ${selectedArea === area.name ? "text-primary" : "text-muted-foreground"}`} />
              <span className="flex-1 text-left text-body-sm font-semibold text-foreground">{area.name}</span>
              {selectedArea === area.name && <Check className="w-5 h-5 text-primary" />}
            </motion.button>
          ))}
        </div>

        {/* Custom address */}
        <div className="pt-2">
          <p className="text-caption font-semibold text-muted-foreground mb-2">Or enter full address</p>
          <Input
            placeholder="123, Main Road, Area, City..."
            value={customAddress}
            onChange={(e) => {
              setCustomAddress(e.target.value);
              setSelectedArea(null);
            }}
            className="h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="px-4 pb-8 pb-safe pt-4">
        <MobileButton
          fullWidth
          disabled={!selectedArea && !customAddress}
          onClick={handleConfirm}
        >
          Confirm Location
        </MobileButton>
      </div>
    </div>
  );
};

export default VendorPinMapScreen;
