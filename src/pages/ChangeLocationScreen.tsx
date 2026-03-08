import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Search, Navigation, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

const POPULAR_LOCATIONS = [
  { name: "Tambaram", area: "Chennai", pincode: "600045" },
  { name: "T. Nagar", area: "Chennai", pincode: "600017" },
  { name: "Anna Nagar", area: "Chennai", pincode: "600040" },
  { name: "Velachery", area: "Chennai", pincode: "600042" },
  { name: "Guindy", area: "Chennai", pincode: "600032" },
  { name: "Chromepet", area: "Chennai", pincode: "600044" },
  { name: "Adyar", area: "Chennai", pincode: "600020" },
  { name: "Porur", area: "Chennai", pincode: "600116" },
  { name: "Sholinganallur", area: "Chennai", pincode: "600119" },
  { name: "Perambur", area: "Chennai", pincode: "600011" },
];

const ChangeLocationScreen = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Tambaram");

  const filtered = POPULAR_LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.pincode.includes(search)
  );

  const handleSelect = (name: string) => {
    setSelected(name);
    // In production, this would update global state/context
    setTimeout(() => navigate(-1), 300);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Change Location</h1>
        <div className="w-[44px]" />
      </header>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search area or pincode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-12 rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {/* Use current location */}
      <button className="mx-4 mt-3 flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Navigation className="w-5 h-5 text-primary" />
        <div className="text-left">
          <p className="text-body-sm font-bold text-primary">Use Current Location</p>
          <p className="text-caption text-muted-foreground">Detect your location automatically</p>
        </div>
      </button>

      {/* Popular locations */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 mt-4 pb-8">
        <h3 className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-3">Popular Areas</h3>
        <div className="space-y-1">
          {filtered.map((loc, i) => (
            <motion.button
              key={loc.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(loc.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selected === loc.name ? "bg-primary/10 border border-primary/20" : "active:bg-secondary"}`}
            >
              <MapPin className={`w-4 h-4 ${selected === loc.name ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex-1 text-left">
                <p className={`text-body-sm font-semibold ${selected === loc.name ? "text-primary" : "text-foreground"}`}>{loc.name}</p>
                <p className="text-caption text-muted-foreground">{loc.area} – {loc.pincode}</p>
              </div>
              {selected === loc.name && <Check className="w-4 h-4 text-primary" />}
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-body-sm text-muted-foreground py-8">No locations found for "{search}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeLocationScreen;
