// Screen: M-13 · Primitives: Notification
// Route: /mechanic/notifications

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, ClipboardList, UserCheck, AlertTriangle } from "lucide-react";
import { getMechanicShop } from "@/modules/mechanic/lib/shops";
import {
  getNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from "@/shared/lib/notifications";

const iconFor = (n: AppNotification) => {
  const t = n.title.toLowerCase();
  if (t.includes("no-show") || t.includes("cancel") || t.includes("dispute"))
    return AlertTriangle;
  if (t.includes("worker") || t.includes("check-in")) return UserCheck;
  if (t.includes("booking") || t.includes("job")) return ClipboardList;
  return Bell;
};

const MechanicNotificationsScreen = () => {
  const navigate = useNavigate();
  const shop = getMechanicShop();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!shop) navigate("/mechanic/login", { replace: true });
  }, [shop, navigate]);

  const notifs = useMemo(
    () => (shop ? getNotifications("owner", shop.id) : []),
    [shop, tick],
  );

  const markAll = () => {
    if (!shop) return;
    markAllNotificationsRead("owner", shop.id);
    setTick((t) => t + 1);
  };

  if (!shop) return null;

  const groups = groupByDay(notifs);

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

      <div className="px-4 py-4 space-y-4">
        {notifs.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-border text-center">
            <Bell className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-body-sm font-semibold text-foreground mt-2">
              You're all caught up
            </p>
            <p className="text-caption text-muted-foreground">
              New booking, worker check-in and no-show alerts will appear here.
            </p>
          </div>
        )}

        {groups.map(([day, items]) => (
          <section key={day}>
            <p className="text-caption text-muted-foreground mb-2">{day}</p>
            <div className="space-y-2">
              {items.map((n) => {
                const Icon = iconFor(n);
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-3 rounded-xl border border-border ${n.read ? "bg-card" : "bg-primary/5"}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-foreground">
                        {n.title}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {n.body}
                      </p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

function groupByDay(notifs: AppNotification[]): [string, AppNotification[]][] {
  const map = new Map<string, AppNotification[]>();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  notifs.forEach((n) => {
    const d = new Date(n.createdAt);
    const label =
      d.toDateString() === today
        ? "Today"
        : d.toDateString() === yesterday
          ? "Yesterday"
          : d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  });
  return Array.from(map.entries());
}

export default MechanicNotificationsScreen;
