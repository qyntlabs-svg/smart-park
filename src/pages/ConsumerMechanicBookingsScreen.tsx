import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Phone, Store, Bike, QrCode, Star, CheckCircle2, Navigation } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BottomNav from "@/components/BottomNav";
import { MobileButton } from "@/components/ui/mobile-button";
import { Textarea } from "@/components/ui/textarea";
import {
  addReviewToShop,
  getConsumerBookings,
  getPublicShops,
  MechanicBooking,
  updateMechanicBooking,
} from "@/lib/mechanic";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const TABS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const statusBadge = (s: MechanicBooking["status"]) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Awaiting approval", cls: "bg-warning/10 text-warning" },
    accepted: { label: "Accepted", cls: "bg-primary/10 text-primary" },
    completed: { label: "Completed", cls: "bg-success/10 text-success" },
    rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
  };
  return map[s];
};

const ConsumerMechanicBookingsScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const phone = user?.phone || "+91 90000 00000";
  const [tab, setTab] = useState<TabKey>("active");
  const [tick, setTick] = useState(0);
  const [payFor, setPayFor] = useState<MechanicBooking | null>(null);
  const [reviewFor, setReviewFor] = useState<MechanicBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, []);

  const shops = useMemo(() => getPublicShops(), [tick]);
  const bookings = useMemo(() => {
    let list = getConsumerBookings(phone);
    // Seed one demo booking for the logged-in user if empty, so the screen is alive.
    if (list.length === 0 && shops[0]) {
      const seed: MechanicBooking = {
        id: `consumer-seed-${phone}`,
        shopId: shops[0].id,
        shopName: shops[0].shopName,
        service: shops[0].services[0]?.name || "Periodic Service",
        price: shops[0].services[0]?.price || 600,
        date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        status: "accepted",
        contactRevealed: true,
        serviceType: "shop",
        customerName: user?.name || "You",
        customerPhone: phone,
      };
      const all = JSON.parse(localStorage.getItem("mechanicBookings") || "[]");
      all.unshift(seed);
      localStorage.setItem("mechanicBookings", JSON.stringify(all));
      list = [seed];
    }
    return list;
  }, [phone, shops, tick, user?.name]);

  const list = bookings.filter((b) =>
    tab === "active"
      ? b.status === "pending" || b.status === "accepted"
      : b.status === "completed" || b.status === "rejected",
  );

  const shopOf = (id: string) => shops.find((s) => s.id === id);

  const upiUri = (b: MechanicBooking) => {
    const s = shopOf(b.shopId);
    return `upi://pay?pa=${encodeURIComponent(s?.upiId || "shop@upi")}&pn=${encodeURIComponent(b.shopName)}&am=${b.price}&cu=INR&tn=${encodeURIComponent(b.service)}`;
  };

  const submitReview = () => {
    if (!reviewFor) return;
    if (!comment.trim()) return toast.error("Please share a short comment");
    addReviewToShop(reviewFor.shopId, {
      user: user?.name || "Customer",
      rating,
      comment: comment.trim(),
    });
    updateMechanicBooking(reviewFor.id, { contactRevealed: true });
    toast.success("Thanks for the review!");
    setReviewFor(null);
    setComment("");
    setRating(5);
    setTick((t) => t + 1);
  };

  const openMaps = (b: MechanicBooking) => {
    const s = shopOf(b.shopId);
    if (!s) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`, "_blank");
  };

  const markPaid = (b: MechanicBooking) => {
    updateMechanicBooking(b.id, { paid: true });
    toast.success("Payment marked as sent");
    setPayFor(null);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">My Service Bookings</h1>
      </header>

      <div className="flex bg-secondary mx-4 mt-3 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-body-sm font-semibold ${
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 scrollbar-hide">
        {list.length === 0 && (
          <div className="text-center py-16">
            <p className="text-body-sm text-muted-foreground">No bookings here yet.</p>
            <button onClick={() => navigate("/mechanics")} className="mt-3 text-primary font-semibold text-body-sm">
              Browse mechanics →
            </button>
          </div>
        )}
        {list.map((b) => {
          const badge = statusBadge(b.status);
          const shop = shopOf(b.shopId);
          const canPay = b.status === "accepted" && !b.paid;
          const canReview = b.status === "completed" && !shop?.reviews.some((r) => r.user === (user?.name || "Customer") && r.comment.length > 0 && b.id.startsWith("mb_") ? false : false);
          return (
            <div key={b.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">{b.shopName}</p>
                  <p className="text-caption text-muted-foreground">{b.service}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-md text-caption font-semibold ${badge.cls}`}>
                  <Clock className="inline w-3 h-3 mr-1" />{badge.label}
                </span>
              </div>

              <div className="flex items-center justify-between text-body-sm">
                <p className="text-caption text-muted-foreground flex items-center gap-1">
                  {b.serviceType === "doorstep" ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                  {b.serviceType === "doorstep" ? "Doorstep visit" : "Bring to shop"}
                </p>
                <p className="text-body font-bold text-primary">₹{b.price}</p>
              </div>

              {b.contactRevealed && shop && (
                <div className="text-caption text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{shop.ownerPhone}</p>
                  <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.address}</p>
                </div>
              )}

              {b.status === "accepted" && b.serviceType === "shop" && (
                <button onClick={() => openMaps(b)} className="w-full h-10 rounded-xl bg-secondary text-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Navigation className="w-4 h-4" /> Navigate to shop
                </button>
              )}

              {canPay && (
                <button onClick={() => setPayFor(b)} className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                  <QrCode className="w-4 h-4" /> Pay ₹{b.price} via UPI
                </button>
              )}

              {b.status === "accepted" && b.paid && (
                <p className="text-caption text-success font-semibold">✓ Payment sent — awaiting service completion</p>
              )}

              {b.status === "completed" && (
                <div className="space-y-2">
                  {b.paid && <p className="text-caption text-success font-semibold">✓ Paid ₹{b.price}</p>}
                  <button
                    onClick={() => { setReviewFor(b); setRating(5); setComment(""); }}
                    className="w-full h-10 rounded-xl bg-primary/10 text-primary font-semibold text-body-sm flex items-center justify-center gap-1"
                  >
                    <Star className="w-4 h-4" /> Leave a review
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UPI Payment Modal */}
      {payFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setPayFor(null)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold">Pay ₹{payFor.price}</p>
            <p className="text-caption text-muted-foreground">
              {payFor.shopName} · {shopOf(payFor.shopId)?.upiId || "shop@upi"}
            </p>
            <div className="flex justify-center py-4">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={upiUri(payFor)} size={200} />
              </div>
            </div>
            <a
              href={upiUri(payFor)}
              className="block w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center"
            >
              Open UPI app
            </a>
            <MobileButton variant="outline" fullWidth onClick={() => markPaid(payFor)}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> I've paid
            </MobileButton>
            <button onClick={() => setPayFor(null)} className="w-full h-10 text-body-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setReviewFor(null)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-body font-bold">Rate your experience</p>
              <p className="text-caption text-muted-foreground">{reviewFor.shopName} · {reviewFor.service}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star
                    className={`w-9 h-9 ${n <= rating ? "text-warning fill-warning" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the service…"
              rows={4}
              className="rounded-xl"
            />
            <MobileButton fullWidth onClick={submitReview}>Submit Review</MobileButton>
            <button onClick={() => setReviewFor(null)} className="w-full h-10 text-body-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ConsumerMechanicBookingsScreen;