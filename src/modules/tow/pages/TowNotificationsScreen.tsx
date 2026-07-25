// Screen: T-08 · Primitives: Notification
// Route: /tow/notifications

import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import TowLayout from "@/modules/tow/components/TowLayout";
import { getCurrentOperator } from "@/modules/tow/lib/tow";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/shared/lib/notifications";

const TowNotificationsScreen = () => {
  const op = getCurrentOperator();
  const [tick, setTick] = useState(0);

  // Tow operators reuse the "worker" audience bucket (both are dispatched
  // workers in the same shape). We namespace by their operator id so the
  // rest of the app doesn't collide with mechanic workers.
  const notifs = useMemo(() => {
    if (!op) return [];
    return getNotifications("worker", `tow:${op.id}`);
  }, [op, tick]);

  const markAll = () => {
    if (!op) return;
    markAllNotificationsRead("worker", `tow:${op.id}`);
    setTick((t) => t + 1);
  };

  return (
    <TowLayout
      title="Notifications"
      showBack
      right={
        notifs.some((n) => !n.read) ? (
          <button
            onClick={markAll}
            className="touch-target text-primary"
            aria-label="Mark all read"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
        ) : null
      }
    >
      <div className="px-4 py-4 space-y-2">
        {notifs.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center">
            <Bell className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm font-semibold text-foreground mt-2">
              You're all caught up
            </p>
            <p className="text-caption text-muted-foreground">
              New job alerts and status changes appear here.
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
    </TowLayout>
  );
};

export default TowNotificationsScreen;
