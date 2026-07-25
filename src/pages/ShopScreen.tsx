import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Search, Filter, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { AnimatedPage, AnimatedList, AnimatedListItem } from "@/shared/motion";

const CATEGORIES = [
  { label: "Spare Parts", emoji: "🔧" },
  { label: "Accessories", emoji: "🎨" },
  { label: "Tyres", emoji: "🛞" },
  { label: "Oils & Fluids", emoji: "🛢️" },
  { label: "Batteries", emoji: "🔋" },
  { label: "Lights", emoji: "💡" },
];

const MOCK_PRODUCTS = [
  { id: "1", name: "Bosch Brake Pads (Front)", category: "Spare Parts", price: 1200, mrp: 1500, rating: 4.6, image: "🔧" },
  { id: "2", name: "3M Car Dashboard Polish", category: "Accessories", price: 350, mrp: 450, rating: 4.4, image: "✨" },
  { id: "3", name: "Amaron Battery 45Ah", category: "Batteries", price: 4500, mrp: 5200, rating: 4.8, image: "🔋" },
  { id: "4", name: "Castrol Engine Oil 1L", category: "Oils & Fluids", price: 550, mrp: 650, rating: 4.5, image: "🛢️" },
  { id: "5", name: "LED Headlight Bulb H4", category: "Lights", price: 800, mrp: 1100, rating: 4.3, image: "💡" },
  { id: "6", name: "MRF Tyre 165/80 R14", category: "Tyres", price: 3200, mrp: 3800, rating: 4.7, image: "🛞" },
];

const ShopScreen = () => {
  const navigate = useNavigate();

  const notifyComingSoon = (label: string) =>
    toast.info(`${label} launches with our shop — coming soon.`);

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h1 className="text-body font-bold text-foreground">Auto Doc Shop</h1>
        </div>
      </header>

      {/* Coming Soon Banner */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-bold text-foreground">Coming Soon!</p>
            <p className="text-caption text-muted-foreground">Buy spare parts & accessories. Here's a preview of what's coming.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {/* Search */}
        <div className="px-4 mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search parts, accessories..."
              className="pl-9 h-11 rounded-xl bg-card border-border"
              onFocus={() => notifyComingSoon("Product search")}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => notifyComingSoon("Filters")}
            className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center"
          >
            <Filter className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Categories */}
        <div className="px-4 mt-4">
          <h3 className="text-body-sm font-bold text-foreground mb-3">Categories</h3>
          <AnimatedList className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <AnimatedListItem key={cat.label}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  onClick={() => notifyComingSoon(cat.label)}
                  className="w-full flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border transition-shadow hover:shadow-md"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-caption font-semibold text-foreground">
                    {cat.label}
                  </span>
                </motion.button>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>

        {/* Products */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body-sm font-bold text-foreground">Popular Products</h3>
            <button
              onClick={() => notifyComingSoon("Full catalogue")}
              className="flex items-center gap-0.5 text-caption font-semibold text-primary"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <AnimatedList className="grid grid-cols-2 gap-3" staggerChildren={0.06}>
            {MOCK_PRODUCTS.map((product) => (
              <AnimatedListItem key={product.id}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  onClick={() => notifyComingSoon(product.name)}
                  className="w-full bg-card border border-border rounded-2xl p-3 text-left transition-shadow hover:shadow-md"
                >
                  <div className="w-full aspect-square rounded-xl bg-secondary flex items-center justify-center text-4xl">
                    {product.image}
                  </div>
                  <p className="mt-2 text-caption font-bold text-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning fill-warning" />
                    <span className="text-caption text-muted-foreground">
                      {product.rating}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-body-sm font-bold text-primary">
                      ₹{product.price}
                    </span>
                    <span className="text-caption text-muted-foreground line-through">
                      ₹{product.mrp}
                    </span>
                  </div>
                </motion.button>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>
      </div>

      <BottomNav />
    </AnimatedPage>
  );
};

export default ShopScreen;
