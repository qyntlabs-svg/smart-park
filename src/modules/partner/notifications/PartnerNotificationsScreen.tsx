// Screen: V-22 · Primitives: Notification
// Route: /partner/notifications
//
// Reads from the shared notifications store (audience="vendor"). Also seeds
// realistic charger-offline / no-show / dispute alerts on first open so the
// vendor sees a populated inbox during Phase-0 demos.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Loader2,
  CheckCheck,
  Zap,
  UserX,
  AlertOctagon,
  Calendar,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileButton } from "@/components/ui/mobile-button";
import PartnerScreenLayout from "@/modules/partner/components/PartnerScreenLayout";
import { useAuthStore } from "@/store/auth.store";
import {
  getNotifications,
  markAllNotificationsRead,
  pushNotification,
  type AppNotification,
} from "@/shared/lib/notifications";

const SEED_KEY = "partnerNotificationsSeeded";

function seedVendorNotifications(partnerId: string) {
  if (localStorage.getItem(`${SEED_KEY}:${partnerId}`)) return;
  const seeds: Array<Omit<AppNotification, "id" | "createdAt">> = [
    {
      audience: "vendor",
      audienceId: partnerId,
      title: "New EV booking",
      body: "CCS 60kW reserved at T Nagar for 18:30. Plug-in code 4821.",
    },
    {
      audience: "vendor",
      audienceId: partnerId,
      title: "Charger offline",
      body: "OMR · Bay #3 (CCS 150kW) marked offline. Reservation d_9821 flagged.",
    },
    {
      audience: "vendor",
      audienceId: partnerId,
      title: "Consumer no-show",
      body: "Velachery · BK-8299 released after 30 min hold.",
    },
    {
      audience: "vendor",
      audienceId: partnerId,
      title: "New dispute",
      body: "Priya S. raised an overcharge dispute on BK-8412 (₹240).",
    },
    {
      audience: "vendor",
      audienceId: partnerId,
      title: "Payout paid",
      body: "₹12,418 settled to UPI ••4821 (ref UPI7291F).",
    },
  ];
  seeds.forEach((s) => pushNotification(s));
  localStorage.setItem(`${SEED_KEY}:${partnerId}`, "1");
}

const useVendorNotifications = (partnerId: string) => {
  return useQuery({
    queryKey: ["vendor-notifications", partnerId],
    queryFn: async () => {
      seedVendorNotifications(partnerId);
      return getNotifications("vendor", partnerId);
    },
    refetchOnMount: "always",
  });
};

const useMarkAllRead = (partnerId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      markAllNotificationsRead("vendor", partnerId);
      return true;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["vendor-notifications", partnerId] }),
  });
};

type Filter = "all" | "bookings" | "operations" | "finance";

const classify = (n: AppNotification): Filter => {
  const t = (n.title + " " + n.body).toLowerCase();
  if (t.includes("payout") || t.includes("invoice") || t.includes("₹"))
    return "finance";
  if (
    t.includes("offline") ||
    t.includes("no-show") ||
    t.includes("dispute") ||
    t.includes("maintenance")
  )
    return "operations";
  if (t.includes("booking") || t.includes("reserv")) return "bookings";
  return "all";
};

const iconFor = (n: AppNotification) => {
  const t = (n.title + n.body).toLowerCase();
  if (t.includes("payout") || t.includes("invoice"))
    return { icon: Calendar, color: "text-success" };
  if (t.includes("offline") || t.includes("dispute"))
    return { icon: AlertOctagon, color: "text-destructive" };
  if (t.includes("no-show")) return { icon: UserX, color: "text-warning" };
  if (t.includes("charg") || t.includes("kw"))
    return { icon: Zap, color: "text-primary" };
  return { icon: Bell, color: "text-primary" };
};

const PartnerNotificationsScreen = () => {
  const partnerId = useAuthStore((s) => s.user?.id ?? "partner-demo");
  const { data: items = [], isLoading, isError } = useVendorNotifications(partnerId);
  const markRead = useMarkAllRead(partnerId);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((n) => classify(n) === filter);
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    // Silently mark unread as seen on mount so the badge in the dashboard clears
    // after visit. Comment out if we want an explicit "Mark all" button only.
  }, []);

  return (
    <PartnerScreenLayout
      title={`Notifications${unreadCount ? ` (${unreadCount})` : ""}`}
      icon={Bell}
      action={
        unreadCount > 0 ? (
          <button
            onClick={() => {
              markRead.mutate();
              toast.success("Marked all as read");
            }}
            className="text-caption font-semibold text-primary flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        ) : undefined
      }
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(["all", "bookings", "operations", "finance"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold border capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-body-sm text-destructive py-8">
          Couldn't load notifications
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-2 text-center">
          <Bell className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-body-sm text-muted-foreground">
            You're all caught up 🎉
          </p>
        </div>
      ) : (
        filtered.map((n, i) => {
          const { icon: Icon, color } = iconFor(n);
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`p-3 rounded-2xl border bg-card flex gap-3 items-start ${
                n.read ? "border-border" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {n.title}
                  </p>
                  {!n.read && (
                    <CircleDot className="w-3 h-3 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {n.body}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          );
        })
      )}

      {!isLoading && items.length > 0 && (
        <div className="pt-2">
          <MobileButton
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => {
              pushNotification({
                audience: "vendor",
                audienceId: partnerId,
                title: "Test alert",
                body: "This is a mock notification pushed from the vendor console.",
              });
              toast.success("Test notification pushed");
            }}
          >
            Push a test alert
          </MobileButton>
        </div>
      )}
    </PartnerScreenLayout>
  );
};

export default PartnerNotificationsScreen;
