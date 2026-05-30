import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Star, MapPin, Settings, LogOut, IndianRupee, Eye, ToggleLeft, ToggleRight, ClipboardList, MessageSquare } from "lucide-react";
import { getMechanicAuth, getMechanicShop, getShopBookings, setMechanicAuth, setMechanicShop } from "@/lib/mechanic";

const MechanicDashboardScreen = () => {
  const navigate = useNavigate();
  const [auth] = useState(getMechanicAuth());
  const [shop, setShop] = useState(getMechanicShop());
  const bookings = shop ? getShopBookings(shop.id) : [];
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const earnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const views = 180 + bookings.length * 37 + completedBookings.length * 24;

  // Seed mock reviews tied to completed bookings if shop has none
  useEffect(() => {
    if (!shop) return;
    if (shop.reviews && shop.reviews.length > 0) return;
    if (completedBookings.length === 0) return;
    const mockReviews = [
      { id: "mr1", user: "Vignesh Kumar", rating: 5, comment: "Quick doorstep jumpstart, saved my morning!", date: "2 days ago" },
      { id: "mr2", user: "Sneha Iyer", rating: 4, comment: "Neat washing & detailing, will come back.", date: "3 days ago" },
      { id: "mr3", user: "Arjun Mehta", rating: 5, comment: "Fair pricing and friendly mechanic.", date: "5 days ago" },
      { id: "mr4", user: "Divya Raghavan", rating: 4, comment: "Tyres replaced quickly, good service.", date: "1 week ago" },
    ];
    const avg = mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length;
    const updated = {
      ...shop,
      reviews: mockReviews,
      reviewCount: mockReviews.length,
      rating: Math.round(avg * 10) / 10,
    };
    setMechanicShop(updated);
    setShop(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!auth) return navigate("/mechanic/login", { replace: true });
    if (auth.status === "pending_approval") return navigate("/mechanic/pending", { replace: true });
    if (!auth.hasSetup || !shop) return navigate("/mechanic/setup", { replace: true });
  }, [auth, shop, navigate]);

  if (!shop || !auth) return null;

  const toggleOpen = () => {
    const updated = { ...shop, open: !shop.open };
    setMechanicShop(updated);
    setShop(updated);
  };

  const logout = () => {
    setMechanicAuth(null);
    navigate("/role-select", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background pb-safe">
      <header className="px-5 pt-safe pb-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-caption text-muted-foreground">Welcome back</p>
            <p className="text-body font-bold text-foreground">{auth.name}</p>
          </div>
          <button onClick={logout} className="touch-target text-muted-foreground"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="px-5 py-5 space-y-5">
        {/* Shop card */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary shrink-0">
              {shop.photos[0] ? (
                <img src={shop.photos[0]} alt={shop.shopName} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-bold text-foreground truncate">{shop.shopName}</p>
              <p className="text-caption text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.address}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                <span className="text-caption font-semibold">{shop.rating.toFixed(1)}</span>
                <span className="text-caption text-muted-foreground">({shop.reviewCount})</span>
              </div>
            </div>
          </div>
          <button onClick={toggleOpen} className="mt-3 w-full h-11 rounded-xl bg-secondary flex items-center justify-center gap-2 text-body-sm font-semibold text-foreground">
            {shop.open ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
            {shop.open ? "Shop is Open" : "Shop is Closed"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Eye, label: "Views", value: views.toLocaleString("en-IN") },
            { icon: IndianRupee, label: "Earnings", value: `₹${earnings.toLocaleString("en-IN")}` },
            { icon: Star, label: "Reviews", value: shop.reviewCount.toString(), onClick: () => navigate("/mechanic/reviews") },
          ].map((s) => (
            <button
              key={s.label}
              onClick={(s as { onClick?: () => void }).onClick}
              className="p-3 rounded-xl bg-card border border-border text-center"
            >
              <s.icon className="w-4 h-4 mx-auto text-primary" />
              <p className="text-body-sm font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-caption text-muted-foreground">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Services list */}
        <div>
          <h2 className="text-body font-bold text-foreground mb-2">Your Services ({shop.services.length})</h2>
          <div className="space-y-2">
            {shop.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-body-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-caption text-muted-foreground capitalize">{s.category}</p>
                </div>
                <p className="text-body-sm font-bold text-primary">₹{s.price}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/mechanic/bookings")}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 relative"
        >
          <ClipboardList className="w-4 h-4" /> Bookings
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-white text-caption font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/mechanic/reviews")}
          className="w-full h-12 rounded-xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" /> Reviews & Replies
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/mechanic/setup")}
          className="w-full h-12 rounded-xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" /> Edit Shop
        </motion.button>
      </div>
    </div>
  );
};

export default MechanicDashboardScreen;