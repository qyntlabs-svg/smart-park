import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Star, MapPin, EyeOff, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getPublicShops, maskContact, VEHICLE_CATEGORIES, VehicleCategory } from "@/lib/mechanic";
import { useMemo, useState } from "react";

const MechanicsScreen = () => {
  const navigate = useNavigate();
  const shops = useMemo(() => getPublicShops(), []);
  const [filter, setFilter] = useState<VehicleCategory | "all">("all");

  const filtered = filter === "all" ? shops : shops.filter((s) => s.categories.includes(filter));

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h1 className="text-body font-bold text-foreground">Mechanics Nearby</h1>
        </div>
      </header>

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
              onClick={() => navigate(`/mechanics/${shop.id}`)}
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
