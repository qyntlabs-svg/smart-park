import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Star, MapPin, EyeOff, ChevronRight, Search, ClipboardList, Bike } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getPublicShops, maskContact, VEHICLE_CATEGORIES, VehicleCategory } from "@/lib/mechanic";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

const MechanicsScreen = () => {
  const navigate = useNavigate();
  const shops = useMemo(() => getPublicShops(), []);
  const [filter, setFilter] = useState<VehicleCategory | "all">("all");
  const [query, setQuery] = useState("");

  const byCategory = filter === "all" ? shops : shops.filter((s) => s.categories.includes(filter));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? byCategory.filter(
        (s) =>
          s.shopName.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.services.some((sv) => sv.name.toLowerCase().includes(q)),
      )
    : byCategory;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h1 className="text-body font-bold text-foreground">Mechanics Nearby</h1>
        </div>
        <button
          onClick={() => navigate("/my-service-bookings")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-caption font-semibold"
        >
          <ClipboardList className="w-3.5 h-3.5" /> My Bookings
        </button>
      </header>

      {/* Mobile mechanic CTA */}
      <div className="px-4 pt-3">
        <button
          onClick={() => navigate("/mobile-mechanic")}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Bike className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-bold text-foreground">Need a mechanic at your doorstep?</p>
            <p className="text-caption text-muted-foreground">Request a mobile mechanic — first available accepts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop, area, or service…"
            className="h-11 pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-caption font-semibold whitespace-nowrap ${
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          All
        </button>
        {VEHICLE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-3 py-1.5 rounded-full text-caption font-semibold whitespace-nowrap ${
              filter === c.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {c.emoji} {c.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Mechanics List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 scrollbar-hide">
        {filtered.length === 0 && (
          <p className="text-center text-body-sm text-muted-foreground py-10">No shops in this category yet.</p>
        )}
        {filtered.map((shop, i) => {
          const priceMin = Math.min(...shop.services.map((s) => s.price));
          const priceMax = Math.max(...shop.services.map((s) => s.price));
          const topServices = shop.services.slice(0, 3).map((s) => s.name);
          return (
            <motion.button
              key={shop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/mechanics/${shop.id}${filter !== "all" ? `?cat=${filter}` : ""}`)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
            >
              <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-md text-caption font-semibold ${
                shop.open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}>
                {shop.open ? "Open" : "Closed"}
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {shop.photos[0] ? (
                    <img src={shop.photos[0]} alt={shop.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Wrench className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <p className="text-body-sm font-bold text-foreground truncate">{shop.shopName}</p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1 mt-0.5">
                    <EyeOff className="w-3 h-3" /> {maskContact(shop.ownerName)}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-caption text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-warning fill-warning" /> {shop.rating.toFixed(1)} ({shop.reviewCount})</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {shop.address.split(",")[0]}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {topServices.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-caption font-medium text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-body-sm font-bold text-primary">
                  {priceMin === priceMax ? `₹${priceMin}` : `₹${priceMin}–₹${priceMax}`}
                </span>
                <span className="flex items-center gap-1 text-caption font-semibold text-primary">
                  View shop <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default MechanicsScreen;
