import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "@/shared/motion";
import {
  ChevronLeft,
  Bell,
  Car,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  LogIn,
  LogOut,
  Banknote,
  Info,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useMarkAllRead,
  useMarkOneRead,
  useDeleteNotification,
} from "@/api/notifications";

// Map notification type → icon + colour
const getTypeConfig = (type: string) => {
  switch (type) {
    case "BOOKING_CONFIRMED":
      return { icon: CheckCircle, color: "text-success", bg: "bg-success/10" };
    case "BOOKING_CANCELLED":
      return {
        icon: AlertTriangle,
        color: "text-destructive",
        bg: "bg-destructive/10",
      };
    case "VEHICLE_ENTRY":
      return { icon: LogIn, color: "text-success", bg: "bg-success/10" };
    case "VEHICLE_EXIT":
      return { icon: LogOut, color: "text-primary", bg: "bg-primary/10" };
    case "VEHICLE_EXIT_UNPAID":
      return { icon: Banknote, color: "text-warning", bg: "bg-warning/10" };
    case "OVERSTAY":
      return {
        icon: AlertTriangle,
        color: "text-destructive",
        bg: "bg-destructive/10",
      };
    case "PAYMENT":
      return { icon: CreditCard, color: "text-primary", bg: "bg-primary/10" };
    case "VEHICLE":
      return { icon: Car, color: "text-primary", bg: "bg-primary/10" };
    default:
      return { icon: Info, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markOneRead = useMarkOneRead();
  const deleteNotif = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleTap = (id: string, isRead: boolean) => {
    if (!isRead) markOneRead.mutate(id);
  };

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">
          Notifications
        </h1>
        <div className="w-[44px] flex justify-end">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-caption font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
      </header>

      {/* Mark all read */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b border-border flex justify-end">
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-caption text-primary font-semibold active:opacity-60 transition-opacity disabled:opacity-40"
          >
            {markAllRead.isPending ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-body font-semibold text-foreground">
              No notifications yet
            </p>
            <p className="text-body-sm text-muted-foreground mt-1">
              You'll see booking updates and alerts here.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
        {notifications.map((notif, i) => {
          const { icon: Icon, color, bg } = getTypeConfig(notif.type);
          const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
            addSuffix: true,
          });

          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 320, damping: 26 }}
              whileTap={{ scale: 0.99 }}
              className={`flex items-start gap-3 px-4 py-4 border-b border-border cursor-pointer ${
                !notif.is_read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleTap(notif.id, notif.is_read)}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-body-sm font-bold text-foreground truncate ${
                      !notif.is_read ? "" : "opacity-80"
                    }`}
                  >
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="mt-0.5 text-caption text-muted-foreground leading-relaxed">
                  {notif.body}
                </p>
                <p className="mt-1 text-caption text-muted-foreground/60">
                  {timeAgo}
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotif.mutate(notif.id);
                }}
                className="touch-target flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
};

export default NotificationsScreen;
