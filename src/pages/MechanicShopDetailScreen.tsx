import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Phone, User, Eye, EyeOff, CheckCircle2, Store, Bike, Clock } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import {
  addMechanicBooking,
  getMechanicBookings,
  getPublicShops,
  MechanicService,
  maskContact,
  VEHICLE_CATEGORIES,
} from "@/lib/mechanic";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const MechanicShopDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const shop = useMemo(() => getPublicShops().find((s) => s.id === id), [id]);
  const [selected, setSelected] = useState<MechanicService | null>(null);
  const [serviceType, setServiceType] = useState<"shop" | "doorstep">("shop");
  const [doorstepAddress, setDoorstepAddress] = useState("");
  const [tab, setTab] = useState<"services" | "reviews">("services");
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Reload booking status (mechanic may accept/reject)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, []);
  const activeBooking = useMemo(
    () => getMechanicBookings().find((b) => b.id === activeBookingId) || null,
    [activeBookingId, tick],
  );

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

  const revealed = !!activeBooking && activeBooking.status === "accepted";

  const groupedServices = VEHICLE_CATEGORIES
    .filter((c) => shop.categories.includes(c.key))
    .map((c) => ({ ...c, list: shop.services.filter((s) => s.category === c.key) }))
    .filter((c) => c.list.length > 0);

  const handleRequest = () => {
    if (!selected) return toast.error("Select a service");
    if (serviceType === "doorstep" && !doorstepAddress.trim())
      return toast.error("Enter your address for doorstep visit");

    const customerName = user?.name || "Guest User";
    const customerPhone = user?.phone || "+91 90000 00000";

    const id = `mb_${Date.now()}`;
    addMechanicBooking({
      id,
      shopId: shop.id,
      shopName: shop.shopName,
      service: selected.name,
      price: selected.price,
      date: new Date().toISOString(),
      status: "pending",
      contactRevealed: false,
      serviceType,
      customerName,
      customerPhone,
      customerLocation:
        serviceType === "doorstep"
          ? { lat: 13.05 + Math.random() * 0.05, lng: 80.22 + Math.random() * 0.05, address: doorstepAddress.trim() }
          : undefined,
    });
    setActiveBookingId(id);
    toast.success("Request sent! Awaiting mechanic approval.");
  };

  // -------- Booking status UI --------
  if (activeBooking) {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Awaiting mechanic approval", color: "bg-warning/10 text-warning" },
      accepted: { label: "Accepted — proceed to shop / await mechanic", color: "bg-success/10 text-success" },
      rejected: { label: "Request rejected by mechanic", color: "bg-destructive/10 text-destructive" },
      completed: { label: "Service completed", color: "bg-success/10 text-success" },
    };
    const s = statusMap[activeBooking.status];
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
        <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
          <button onClick={() => navigate(-1)} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="flex-1 text-center text-body font-bold pr-11">Booking Status</h1>
        </header>
        <div className="p-5 space-y-4">
          <div className={`p-3 rounded-xl text-body-sm font-semibold ${s.color}`}>
            <Clock className="w-4 h-4 inline mr-2" />{s.label}
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <p className="text-body font-bold text-foreground">{activeBooking.shopName}</p>
            <p className="text-body-sm text-muted-foreground">{activeBooking.service}</p>
            <p className="text-body-sm"><span className="text-muted-foreground">Type: </span>
              <span className="font-semibold capitalize">{activeBooking.serviceType === "doorstep" ? "Doorstep visit" : "Bring to shop"}</span></p>
            <p className="text-body font-bold text-primary">₹{activeBooking.price}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-caption text-muted-foreground mb-1">Shop Contact</p>
            <p className="text-body-sm font-semibold">
              {revealed ? shop.ownerName : maskContact(shop.ownerName)}
            </p>
            <p className="text-body-sm text-muted-foreground flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {revealed ? shop.ownerPhone : maskContact(shop.ownerPhone)}
            </p>
            {!revealed && (
              <p className="text-caption text-muted-foreground mt-2">
                Contact reveals after the mechanic accepts your request.
              </p>
            )}
          </div>
          {revealed && activeBooking.serviceType === "shop" && (
            <MobileButton
              fullWidth
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
                window.open(url, "_blank");
              }}
            >
              Open Shop in Google Maps
            </MobileButton>
          )}
          <button
            className="w-full h-11 rounded-xl bg-secondary text-body-sm font-semibold"
            onClick={() => { setActiveBookingId(null); setSelected(null); }}
          >
            Back to shop
          </button>
          <button
            className="w-full h-11 rounded-xl bg-primary/10 text-primary text-body-sm font-semibold"
            onClick={() => navigate("/my-service-bookings")}
          >
            View all my bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background pb-safe flex flex-col">
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

        <div className="mt-3 p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-foreground">{maskContact(shop.ownerName)}</p>
              <p className="text-caption text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {maskContact(shop.ownerPhone)}
              </p>
            </div>
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-caption text-muted-foreground mt-2">
            Contact details unlock after the mechanic accepts your request.
          </p>
        </div>

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
            <div className="space-y-5 pb-72">
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
                <div className="flex items-center justify-between mt-1">
                  <p className="text-caption text-muted-foreground">{r.date}</p>
                  {r.workerName && (
                    <span className="text-caption px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold">
                      Serviced by {r.workerName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking sheet */}
      {selected && (
        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 pb-6 pt-4 bg-card border-t border-border rounded-t-3xl space-y-3">
          <p className="text-body-sm font-semibold text-foreground">How would you like the service?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setServiceType("shop")}
              className={`p-3 rounded-xl border text-left ${
                serviceType === "shop" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Store className="w-5 h-5 text-primary mb-1" />
              <p className="text-body-sm font-semibold">Bring to shop</p>
              <p className="text-caption text-muted-foreground">You visit the workshop</p>
            </button>
            <button
              onClick={() => setServiceType("doorstep")}
              className={`p-3 rounded-xl border text-left ${
                serviceType === "doorstep" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Bike className="w-5 h-5 text-primary mb-1" />
              <p className="text-body-sm font-semibold">Doorstep visit</p>
              <p className="text-caption text-muted-foreground">Mechanic comes to you</p>
            </button>
          </div>
          {serviceType === "doorstep" && (
            <Input
              value={doorstepAddress}
              onChange={(e) => setDoorstepAddress(e.target.value)}
              placeholder="Your address / landmark"
              className="h-11 rounded-xl"
            />
          )}
          <MobileButton fullWidth onClick={handleRequest}>
            Request {selected.name} – ₹{selected.price}
          </MobileButton>
        </div>
      )}
    </div>
  );
};

export default MechanicShopDetailScreen;