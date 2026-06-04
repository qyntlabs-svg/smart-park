import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pause, Play, Star, Bell } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  getWorkerAuth,
  getWorkerById,
  updateWorker,
  pushNotification,
  getMechanicBookings,
  getNotifications,
  markAllNotificationsRead,
  getPublicShops,
} from "@/lib/mechanic";
import { toast } from "sonner";

const WorkerProfileScreen = () => {
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const [tick, setTick] = useState(0);
  const worker = auth ? getWorkerById(auth.workerId) : null;

  const notifs = useMemo(
    () => (worker ? getNotifications("worker", worker.id) : []),
    [worker, tick],
  );
  const myReviews = useMemo(() => {
    if (!worker) return [];
    return getPublicShops()
      .flatMap((s) => s.reviews || [])
      .filter((r) => r.workerId === worker.id);
  }, [worker, tick]);
  const myBookings = useMemo(
    () => (worker ? getMechanicBookings().filter((b) => b.workerId === worker.id) : []),
    [worker, tick],
  );

  if (!worker) {
    navigate("/", { replace: true });
    return null;
  }

  const selfSuspend = () => {
    if (!confirm("Suspend your own account? Owner will be notified.")) return;
    updateWorker(worker.id, { status: "self_suspended" });
    pushNotification({
      audience: "owner",
      audienceId: worker.shopId,
      title: "Worker self-suspended",
      body: `${worker.name} suspended their own account.`,
    });
    toast.message("You have suspended your account");
    navigate("/worker/pending", { replace: true });
  };
  const reactivate = () => {
    updateWorker(worker.id, { status: "approved" });
    pushNotification({
      audience: "owner",
      audienceId: worker.shopId,
      title: "Worker reactivated",
      body: `${worker.name} reactivated their account.`,
    });
    toast.success("Account reactivated");
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">Profile</h1>
      </header>

      <div className="p-5 space-y-5">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-body font-bold text-foreground">{worker.name}</p>
          <p className="text-caption text-muted-foreground">{worker.phone}</p>
          <p className="text-caption text-muted-foreground mt-1">{worker.shopName}</p>
          <p className="text-caption mt-1">
            <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground capitalize">{worker.status.replace("_", " ")}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Jobs" value={String(myBookings.length)} />
          <Stat label="Completed" value={String(myBookings.filter((b) => b.status === "completed").length)} />
          <Stat label="Reviews" value={String(myReviews.length)} />
        </div>

        <div>
          <p className="text-body font-bold text-foreground mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
            {notifs.some((n) => !n.read) && (
              <button
                onClick={() => { markAllNotificationsRead("worker", worker.id); setTick((t) => t + 1); }}
                className="ml-auto text-caption text-primary font-semibold"
              >
                Mark all read
              </button>
            )}
          </p>
          <div className="space-y-2">
            {notifs.length === 0 && (
              <p className="text-caption text-muted-foreground">No notifications.</p>
            )}
            {notifs.slice(0, 10).map((n) => (
              <div key={n.id} className={`p-3 rounded-xl border border-border ${n.read ? "bg-card" : "bg-primary/5"}`}>
                <p className="text-body-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-caption text-muted-foreground">{n.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-body font-bold text-foreground mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" /> My reviews
          </p>
          {myReviews.length === 0 ? (
            <p className="text-caption text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {myReviews.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-body-sm font-bold text-foreground">{r.user}</p>
                    <span className="text-caption font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" /> {r.rating}
                    </span>
                  </div>
                  <p className="text-caption text-muted-foreground mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {worker.status === "approved" ? (
          <MobileButton fullWidth variant="outline" onClick={selfSuspend}>
            <Pause className="w-4 h-4 mr-1" /> Suspend my account
          </MobileButton>
        ) : worker.status === "self_suspended" ? (
          <MobileButton fullWidth onClick={reactivate}>
            <Play className="w-4 h-4 mr-1" /> Reactivate my account
          </MobileButton>
        ) : null}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-xl bg-secondary text-center">
    <p className="text-body-sm font-bold text-foreground">{value}</p>
    <p className="text-caption text-muted-foreground">{label}</p>
  </div>
);

export default WorkerProfileScreen;