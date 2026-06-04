import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, User, Check, X, QrCode, Navigation, CheckCircle2, Clock, Store, Bike, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  getMechanicAuth,
  getMechanicShop,
  getShopBookings,
  MechanicBooking,
  updateMechanicBooking,
} from "@/lib/mechanic";
import { toast } from "sonner";

const TAB_LABELS = [
  { key: "pending", label: "New" },
  { key: "accepted", label: "Active" },
  { key: "completed", label: "Completed" },
] as const;

type TabKey = (typeof TAB_LABELS)[number]["key"];

const JOB_FILTERS = [
  { key: "all", label: "All" },
  { key: "in_shop", label: "In-shop" },
  { key: "mobile", label: "Mobile" },
] as const;
type JobFilter = (typeof JOB_FILTERS)[number]["key"];

const MechanicBookingsScreen = () => {
  const navigate = useNavigate();
  const auth = getMechanicAuth();
  const shop = getMechanicShop();
  const [tab, setTab] = useState<TabKey>("pending");
  const [tick, setTick] = useState(0);
  const [qrFor, setQrFor] = useState<MechanicBooking | null>(null);
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!auth) return navigate("/mechanic/login", { replace: true });
    if (!shop) return navigate("/mechanic/setup", { replace: true });
  }, [auth, shop, navigate]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, []);

  const bookings = useMemo(
    () => (shop ? getShopBookings(shop.id) : []),
    [shop, tick],
  );

  if (!shop) return null;

  const inferJobType = (b: MechanicBooking) =>
    b.jobType || (b.serviceType === "doorstep" ? "mobile" : "in_shop");

  const filteredAll = bookings.filter((b) => {
    if (jobFilter !== "all" && inferJobType(b) !== jobFilter) return false;
    const d = new Date(b.date).getTime();
    if (fromDate && d < new Date(fromDate).getTime()) return false;
    if (toDate && d > new Date(toDate).getTime() + 86_400_000) return false;
    return true;
  });

  const counts = {
    pending: filteredAll.filter((b) => b.status === "pending").length,
    accepted: filteredAll.filter((b) => b.status === "accepted").length,
    completed: filteredAll.filter((b) => b.status === "completed" || b.status === "rejected" || b.status === "cancelled").length,
  };

  const inShopCount = filteredAll.filter((b) => inferJobType(b) === "in_shop").length;
  const mobileCount = filteredAll.filter((b) => inferJobType(b) === "mobile").length;
  const cancelledCount = filteredAll.filter((b) => b.status === "cancelled" || b.status === "rejected").length;

  const list = filteredAll.filter((b) =>
    tab === "completed"
      ? b.status === "completed" || b.status === "rejected" || b.status === "cancelled"
      : b.status === tab,
  );

  const accept = (b: MechanicBooking) => {
    updateMechanicBooking(b.id, { status: "accepted", contactRevealed: true });
    toast.success("Booking accepted — contact shared with customer");
    setTick((t) => t + 1);
  };
  const reject = (b: MechanicBooking) => {
    updateMechanicBooking(b.id, { status: "rejected" });
    toast.message("Booking rejected");
    setTick((t) => t + 1);
  };
  const complete = (b: MechanicBooking) => {
    updateMechanicBooking(b.id, { status: "completed", paid: true });
    toast.success("Marked as completed & paid");
    setQrFor(null);
    setTick((t) => t + 1);
  };

  const openMaps = (b: MechanicBooking) => {
    if (!b.customerLocation) return;
    const { lat, lng } = b.customerLocation;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  const upiUri = (b: MechanicBooking) =>
    `upi://pay?pa=${encodeURIComponent(shop.upiId || "shop@upi")}&pn=${encodeURIComponent(shop.shopName)}&am=${b.price}&cu=INR&tn=${encodeURIComponent(b.service)}`;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/mechanic/dashboard")} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Bookings</h1>
      </header>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-3">
        <Metric label="Total" value={filteredAll.length} tone="primary" />
        <Metric label="In-shop" value={inShopCount} tone="muted" />
        <Metric label="Mobile" value={mobileCount} tone="muted" />
        <Metric label="Completed" value={counts.completed - cancelledCount} tone="success" />
        <Metric label="Pending" value={counts.pending} tone="warning" />
        <Metric label="Cancelled" value={cancelledCount} tone="destructive" />
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {JOB_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setJobFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-caption font-semibold whitespace-nowrap ${
                jobFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 rounded-lg flex-1" />
          <span className="text-caption text-muted-foreground">→</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 rounded-lg flex-1" />
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(""); setToDate(""); }} className="text-caption text-primary font-semibold">Clear</button>
          )}
        </div>
      </div>

      <div className="flex bg-secondary mx-4 mt-3 rounded-xl p-1">
        {TAB_LABELS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-body-sm font-semibold ${
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label} {counts[t.key] > 0 && <span className="ml-1 text-caption text-primary">({counts[t.key]})</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {list.length === 0 && (
          <p className="text-center text-body-sm text-muted-foreground py-10">No bookings here.</p>
        )}
        {list.map((b) => (
          <div key={b.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-body-sm font-bold text-foreground">{b.customerName}</p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {b.contactRevealed ? b.customerPhone : "Hidden until accepted"}
                  </p>
                  {b.workerName && (
                    <p className="text-caption text-muted-foreground">Worker: <span className="font-semibold text-foreground">{b.workerName}</span></p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-md text-caption font-semibold ${
                b.status === "pending" ? "bg-warning/10 text-warning"
                : b.status === "accepted" ? "bg-primary/10 text-primary"
                : b.status === "completed" ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
              }`}>
                <Clock className="inline w-3 h-3 mr-1" />{b.status}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-caption font-semibold ${
                inferJobType(b) === "mobile" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {inferJobType(b) === "mobile" ? <><Bike className="inline w-3 h-3 mr-1" />Mobile</> : <><Store className="inline w-3 h-3 mr-1" />In-shop</>}
              </span>
              </div>
            </div>

            <div className="text-body-sm">
              <p className="font-semibold text-foreground">{b.service}</p>
              <p className="text-primary font-bold">₹{b.price}</p>
              <p className="text-caption text-muted-foreground flex items-center gap-1 mt-1">
                {b.serviceType === "doorstep" ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {b.serviceType === "doorstep" ? "Doorstep visit" : "Customer brings vehicle"}
              </p>
              {b.customerLocation && (
                <p className="text-caption text-muted-foreground flex items-start gap-1 mt-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {b.customerLocation.address}
                </p>
              )}
            </div>

            {b.status === "pending" && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => reject(b)} className="h-10 rounded-xl bg-destructive/10 text-destructive font-semibold text-body-sm flex items-center justify-center gap-1">
                  <X className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => accept(b)} className="h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Accept
                </button>
              </div>
            )}

            {b.status === "accepted" && (
              <div className="space-y-2">
                {b.serviceType === "doorstep" && b.customerLocation && (
                  <button onClick={() => openMaps(b)} className="w-full h-10 rounded-xl bg-secondary text-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                    <Navigation className="w-4 h-4" /> Navigate in Google Maps
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setQrFor(b)} className="h-10 rounded-xl bg-primary/10 text-primary font-semibold text-body-sm flex items-center justify-center gap-1">
                    <QrCode className="w-4 h-4" /> Payment QR
                  </button>
                  <button onClick={() => complete(b)} className="h-10 rounded-xl bg-success text-white font-semibold text-body-sm flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Complete
                  </button>
                </div>
              </div>
            )}

            {b.status === "completed" && b.paid && (
              <p className="text-caption text-success font-semibold">✓ Paid ₹{b.price}</p>
            )}
          </div>
        ))}
      </div>

      {/* Payment QR modal */}
      {qrFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setQrFor(null)}>
          <div className="w-full max-w-md bg-card rounded-3xl p-6 text-center space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-body font-bold">Scan to pay ₹{qrFor.price}</p>
            <p className="text-caption text-muted-foreground">{shop.shopName} · {shop.upiId || "shop@upi"}</p>
            <div className="flex justify-center py-4">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={upiUri(qrFor)} size={200} />
              </div>
            </div>
            <p className="text-caption text-muted-foreground">Customer scans this with any UPI app.</p>
            <MobileButton fullWidth onClick={() => complete(qrFor)}>Mark as Paid & Complete</MobileButton>
            <button onClick={() => setQrFor(null)} className="w-full h-10 text-body-sm text-muted-foreground">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicBookingsScreen;
