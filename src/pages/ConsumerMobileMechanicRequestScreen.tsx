import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Moon, Info, LocateFixed, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  MOBILE_SERVICE_CATALOGUE,
  calcMobileQuote,
  addMechanicBooking,
  pushNotification,
  generateOtp,
  type MechanicBooking,
} from "@/lib/mechanic";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const DEFAULT_LOC = { lat: 12.9249, lng: 80.1, address: "Tambaram, Chennai" };

const ConsumerMobileMechanicRequestScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [loc, setLoc] = useState(DEFAULT_LOC);
  const [distanceKm, setDistanceKm] = useState(4.5);
  const [locating, setLocating] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "ok" | "failed">("idle");

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("failed");
      toast.error("Location not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: address || `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
        };
        setLoc(next);
        if (!address) setAddress(next.address);
        setLocStatus("ok");
        setLocating(false);
        toast.success("Live location captured");
      },
      () => {
        setLocStatus("failed");
        setLocating(false);
        toast.error("Couldn't get location — enter address manually");
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  // Try once on mount (silent)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: "" });
        setLocStatus("ok");
      },
      () => setLocStatus("failed"),
      { timeout: 4000 },
    );
  }, []);

  const services = MOBILE_SERVICE_CATALOGUE.filter((s) => selected.includes(s.id)).map((s) => s.name);
  const quote = useMemo(() => calcMobileQuote(services, distanceKm), [services, distanceKm]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = () => {
    if (selected.length === 0) return toast.error("Pick at least one service");
    if (!address.trim()) return toast.error("Enter your address");
    if (locStatus !== "ok") return toast.error("Share your live location first");

    const id = `mb_${Date.now()}`;
    const customerName = user?.name || "Guest User";
    const customerPhone = user?.phone || "+91 90000 00000";
    const booking: MechanicBooking = {
      id,
      shopId: "mobile",
      shopName: "Mobile Mechanic Dispatch",
      service: services.join(" + "),
      services,
      price: quote.total,
      date: new Date().toISOString(),
      status: "searching",
      contactRevealed: false,
      serviceType: "doorstep",
      jobType: "mobile",
      customerName,
      customerPhone,
      customerLocation: { ...loc, address: address.trim() },
      priceBreakdown: {
        labour: quote.labour,
        travel: quote.travel,
        service: quote.service,
        nightSurcharge: quote.nightSurcharge,
      },
      otp: generateOtp(),
    };
    addMechanicBooking(booking);
    pushNotification({
      audience: "consumer",
      audienceId: customerPhone,
      title: "Looking for a mechanic",
      body: "We're notifying nearby mechanics now.",
    });
    toast.success("Request raised — looking for a mechanic");
    navigate(`/mobile-mechanic/${id}`);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Mobile Mechanic</h1>
      </header>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto scrollbar-hide">
        <div>
          <p className="text-body font-bold text-foreground mb-2">Pick services</p>
          <div className="grid grid-cols-2 gap-2">
            {MOBILE_SERVICE_CATALOGUE.map((s) => {
              const isSel = selected.includes(s.id);
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggle(s.id)}
                  className={`p-3 rounded-xl text-left border ${
                    isSel ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <p className="text-xl">{s.emoji}</p>
                  <p className="text-body-sm font-semibold text-foreground mt-1">{s.name}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-body-sm font-semibold text-foreground mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" /> Service location
          </p>
          <button
            type="button"
            onClick={fetchLiveLocation}
            disabled={locating}
            className={`mb-2 w-full h-10 rounded-xl flex items-center justify-center gap-2 text-body-sm font-semibold ${
              locStatus === "ok"
                ? "bg-success/10 text-success"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            {locStatus === "ok" ? "Live location captured · tap to refresh" : "Use my live location"}
          </button>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House/Flat, street, landmark"
            className="h-11 rounded-xl"
          />
          <p className="text-caption text-muted-foreground mt-2">Estimated distance from mechanic hub</p>
          <input
            type="range"
            min={1}
            max={15}
            step={0.5}
            value={distanceKm}
            onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-caption text-muted-foreground">{distanceKm} km</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
          <p className="text-body font-bold text-foreground">Price estimate</p>
          <Row label="Labour" value={quote.labour} />
          <Row label={`Travel (${quote.distanceKm} km)`} value={quote.travel} />
          <Row label="Service charge" value={quote.service} />
          {quote.isNight && (
            <Row
              label={
                <span className="flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Night surcharge
                </span>
              }
              value={quote.nightSurcharge}
            />
          )}
          <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
            <p className="text-body font-bold">Total</p>
            <p className="text-body font-bold text-primary">₹{quote.total}</p>
          </div>
          <p className="text-caption text-muted-foreground flex items-start gap-1 mt-1">
            <Info className="w-3 h-3 mt-0.5" /> Rates set by platform. Night surcharge applies between 9 PM and 6 AM IST.
          </p>
        </div>

        <MobileButton fullWidth onClick={submit}>
          Request mechanic · ₹{quote.total}
        </MobileButton>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: React.ReactNode; value: number }) => (
  <div className="flex items-center justify-between text-body-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">₹{value}</span>
  </div>
);

export default ConsumerMobileMechanicRequestScreen;