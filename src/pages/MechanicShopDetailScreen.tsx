import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Phone, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  addMechanicBooking,
  getPublicShops,
  MechanicService,
  maskContact,
  VEHICLE_CATEGORIES,
} from "@/lib/mechanic";
import { toast } from "sonner";

const MechanicShopDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shop = useMemo(() => getPublicShops().find((s) => s.id === id), [id]);
  const [selected, setSelected] = useState<MechanicService | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState<"services" | "reviews">("services");

  if (!shop) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-body text-muted-foreground">Shop not found.</p>
          <button className="mt-4 text-primary font-semibold" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const groupedServices = VEHICLE_CATEGORIES
    .filter((c) => shop.categories.includes(c.key))
    .map((c) => ({ ...c, list: shop.services.filter((s) => s.category === c.key) }))
    .filter((c) => c.list.length > 0);

  const handleBook = () => {
    if (!selected) return toast.error("Select a service");
    addMechanicBooking({
      id: `mb_${Date.now()}`,
      shopId: shop.id,
      shopName: shop.shopName,
      service: selected.name,
      price: selected.price,
      date: new Date().toISOString(),
      status: "confirmed",
      contactRevealed: true,
    });
    setRevealed(true);
    toast.success("Service booked! Contact details revealed.");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background pb-safe flex flex-col">
      {/* Header / hero */}
      <div className="relative">
        <div className="h-48 bg-secondary overflow-hidden">
          {shop.photos[0] ? (
            <img src={shop.photos[0]} alt={shop.shopName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-primary/10">🔧</div>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center pt-safe-sm"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Info */}
      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-heading-sm text-foreground">{shop.shopName}</h1>
            <p className="text-caption text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {shop.address}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-full shrink-0">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            <span className="text-caption font-bold text-foreground">{shop.rating.toFixed(1)}</span>
            <span className="text-caption text-muted-foreground">({shop.reviewCount})</span>
          </div>
        </div>

        {/* Contact card (hidden) */}
        <div className="mt-3 p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-foreground">
                {revealed ? shop.ownerName : maskContact(shop.ownerName)}
              </p>
              <p className="text-caption text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {revealed ? shop.ownerPhone : maskContact(shop.ownerPhone)}
              </p>
            </div>
            <span className="text-caption text-muted-foreground flex items-center gap-1">
              {revealed ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4" />}
            </span>
          </div>
          {!revealed && (
            <p className="text-caption text-muted-foreground mt-2">
              Contact details unlock after you book a service.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex bg-secondary rounded-xl p-1">
          {(["services", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-body-sm font-semibold capitalize ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 mt-4 overflow-y-auto scrollbar-hide">
        {tab === "services" ? (
          groupedServices.length === 0 ? (
            <p className="text-body-sm text-muted-foreground text-center py-10">No services listed yet.</p>
          ) : (
            <div className="space-y-5 pb-32">
              {groupedServices.map((cat) => (
                <div key={cat.key}>
                  <p className="text-body font-bold text-foreground mb-2">{cat.emoji} {cat.label}</p>
                  <div className="space-y-2">
                    {cat.list.map((s) => {
                      const isSel = selected?.id === s.id;
                      return (
                        <motion.button
                          key={s.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelected(isSel ? null : s)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${
                            isSel ? "border-primary bg-primary/5" : "border-border bg-card"
                          }`}
                        >
                          <div>
                            <p className="text-body-sm font-semibold text-foreground">{s.name}</p>
                            {s.custom && <p className="text-caption text-primary">Custom service</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-body font-bold text-primary">₹{s.price}</span>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : shop.reviews.length === 0 ? (
          <p className="text-body-sm text-muted-foreground text-center py-10">No reviews yet.</p>
        ) : (
          <div className="space-y-3 pb-32">
            {shop.reviews.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <p className="text-body-sm font-bold text-foreground">{r.user}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="text-caption font-semibold">{r.rating}</span>
                  </div>
                </div>
                <p className="text-body-sm text-muted-foreground mt-1">{r.comment}</p>
                <p className="text-caption text-muted-foreground mt-1">{r.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <MobileButton fullWidth onClick={handleBook} disabled={!selected}>
          {revealed ? "Booked ✓" : selected ? `Book ${selected.name} – ₹${selected.price}` : "Select a service to book"}
        </MobileButton>
      </div>
    </div>
  );
};

export default MechanicShopDetailScreen;