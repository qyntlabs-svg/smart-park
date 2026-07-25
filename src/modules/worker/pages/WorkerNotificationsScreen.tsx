// Screen: W-10 · Primitives: Notification
// Route: /worker/notifications

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/shared/lib/notifications";
import { getWorkerAuth } from "@/modules/worker/lib/workers";

const WorkerNotificationsScreen = () => {
  const navigate = useNavigate();
  const auth = getWorkerAuth();
  const [tick, setTick] = useState(0);

  const notifs = useMemo(
    () => (auth ? getNotifications("worker", auth.workerId) : []),
    [auth, tick],
  );

  const markAll = () => {
    if (!auth) return;
    markAllNotificationsRead("worker", auth.workerId);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-safe">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold pr-11">
          Notifications
        </h1>
        {notifs.some((n) => !n.read) && (
          <button
            onClick={markAll}
            className="touch-target text-primary"
            aria-label="Mark all read"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="px-4 py-4 space-y-2">
        {notifs.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center">
            <Bell className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm font-semibold text-foreground mt-2">
              Nothing new
            </p>
            <p className="text-caption text-muted-foreground">
              New jobs and messages from your shop will appear here.
            </p>
          </div>
        )}
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-xl border border-border ${n.read ? "bg-card" : "bg-primary/5"}`}
          >
            <p className="text-body-sm font-semibold text-foreground">
              {n.title}
            </p>
            <p className="text-caption text-muted-foreground">{n.body}</p>
            <p className="text-caption text-muted-foreground mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerNotificationsScreen;
