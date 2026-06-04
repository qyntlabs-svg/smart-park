import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  MapPin,
  Phone,
  Check,
  Navigation,
  CheckCircle2,
  PlayCircle,
  User,
  IndianRupee,
  LogOut,
  Star,
  Bell,
} from "lucide-react";
import {
  getWorkerAuth,
  getWorkerById,
  getAvailableMobileRequests,
  getWorkerAssignedBookings,
  workerAcceptBooking,
  updateMechanicBooking,
  setWorkerAuth,
  haversineKm,
  pushNotification,
  getNotifications,
  type MechanicBooking,
} from "@/lib/mechanic";
import { toast } from "sonner";

const TABS = [
  { key: "new", label: "New" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const WorkerDashboardScreen = () => {
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const [tick, setTick] = useState(0);
  const worker = useMemo(() => (auth ? getWorkerById(auth.workerId) : null), [auth, tick]);
  const [tab, setTab] = useState<Tab>("new");

  useEffect(() => {
    if (!auth || !worker) return navigate("/", { replace: true });
    if (worker.status !== "approved") return navigate("/worker/pending", { replace: true });
  }, [auth, worker, navigate]);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(i);
  }, []);

  const available = useMemo(
    () => (worker ? getAvailableMobileRequests(worker) : []),
    [worker, tick],
  );
  const assigned = useMemo(
    () => (worker ? getWorkerAssignedBookings(worker.id) : []),
    [worker, tick],
  );

  const notifs = useMemo(
    () => (worker ? getNotifications("worker", worker.id) : []),
    [worker, tick],
  );
  const unread = notifs.filter((n) => !n.read).length;

  if (!worker) return null;

  const active = assigned.filter((b) =>
    ["assigned", "on_the_way", "in_progress"].includes(b.status),
  );
  const done = assigned.filter((b) => ["completed", "cancelled"].includes(b.status));

  const earnings = done
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.price || 0), 0);

  const accept = (b: MechanicBooking) => {
    const res = workerAcceptBooking(b.id, worker);
    if (!res) return toast.error("Job was taken by another mechanic");
    toast.success("Job assigned to you");
    setTick((t) => t + 1);
  };
  const setStatus = (b: MechanicBooking, status: MechanicBooking["status"]) => {
    updateMechanicBooking(b.id, { status });
    pushNotification({
      audience: "consumer",
      audienceId: b.customerPhone,
      title: `Your service is ${status.replace("_", " ")}`,
      body: `${worker.name} updated the status.`,
    });
    if (status === "completed") {
      pushNotification({
        audience: "owner",
        audienceId: b.shopId,
        title: "Booking completed",
        body: `${worker.name} completed ${b.service}.`,
      });
    }
    toast.success(`Marked ${status.replace("_", " ")}`);
    setTick((t) => t + 1);
  };
  const openMaps = (b: MechanicBooking) => {
    if (!b.customerLocation) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${b.customerLocation.lat},${b.customerLocation.lng}`,
      "_blank",
    );
  };

  const list =
    tab === "new" ? available : tab === "active" ? active : done;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="px-5 pt-safe pb-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-caption text-muted-foreground">Worker · {worker.shopName}</p>
            <p className="text-body font-bold text-foreground">{worker.name}</p>
          </div>
          <button onClick={() => navigate("/worker/profile")} className="touch-target relative">
            <Bell className="w-5 h-5 text-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat icon={Bell} label="New jobs" value={String(available.length)} />
          <Stat icon={IndianRupee} label="Earnings" value={`₹${earnings}`} />
          <Stat icon={Star} label="Done" value={String(done.filter((b) => b.status === "completed").length)} />
        </div>
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide pb-20">
        {list.length === 0 && (
          <p className="text-center text-body-sm text-muted-foreground py-10">
            {tab === "new" ? "No new requests near you right now." : tab === "active" ? "No active jobs." : "No completed jobs yet."}
          </p>
        )}
        {list.map((b) => {
          const distKm =
            worker.lat && worker.lng && b.customerLocation
              ? haversineKm(
                  { lat: worker.lat, lng: worker.lng },
                  { lat: b.customerLocation.lat, lng: b.customerLocation.lng },
                )
              : null;
          return (
            <div key={b.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground">{b.customerName}</p>
                  {b.contactRevealed && (
                    <p className="text-caption text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {b.customerPhone}
                    </p>
                  )}
                </div>
                <span className="text-caption px-2 py-0.5 rounded-md bg-secondary text-muted-foreground capitalize">
                  {b.status.replace("_", " ")}
                </span>
              </div>

              <div className="text-body-sm">
                <p className="font-semibold text-foreground">{b.service}</p>
                {b.services && b.services.length > 1 && (
                  <p className="text-caption text-muted-foreground">{b.services.join(", ")}</p>
                )}
                <p className="text-primary font-bold">₹{b.price}</p>
                {b.customerLocation && (
                  <p className="text-caption text-muted-foreground flex items-start gap-1 mt-1">
                    <MapPin className="w-3 h-3 mt-0.5" />
                    {b.customerLocation.address}
                    {distKm !== null && <span className="ml-1">· {distKm.toFixed(1)} km</span>}
                  </p>
                )}
              </div>

              {b.status === "searching" && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => accept(b)}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Accept job
                </motion.button>
              )}

              {b.status === "assigned" && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openMaps(b)} className="h-10 rounded-xl bg-secondary text-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                    <Navigation className="w-4 h-4" /> Navigate
                  </button>
                  <button onClick={() => setStatus(b, "on_the_way")} className="h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                    <PlayCircle className="w-4 h-4" /> On the way
                  </button>
                </div>
              )}

              {b.status === "on_the_way" && (
                <button onClick={() => setStatus(b, "in_progress")} className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-body-sm flex items-center justify-center gap-1">
                  <PlayCircle className="w-4 h-4" /> Start service
                </button>
              )}

              {b.status === "in_progress" && (
                <button onClick={() => setStatus(b, "completed")} className="w-full h-10 rounded-xl bg-success text-white font-semibold text-body-sm flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Mark complete
                </button>
              )}

              {b.status === "completed" && (
                <p className="text-caption text-success font-semibold">✓ Completed · ₹{b.price}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-card border-t border-border px-4 py-3 flex gap-2">
        <button
          onClick={() => navigate("/worker/profile")}
          className="flex-1 h-11 rounded-xl bg-secondary text-foreground font-semibold text-body-sm flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={() => { setWorkerAuth(null); navigate("/", { replace: true }); }}
          className="h-11 px-4 rounded-xl bg-secondary text-foreground font-semibold text-body-sm flex items-center justify-center gap-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary text-center">
    <Icon className="w-4 h-4 mx-auto text-primary" />
    <p className="text-body-sm font-bold text-foreground mt-1">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

export default WorkerDashboardScreen;