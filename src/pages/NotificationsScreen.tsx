import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, Car, CreditCard, CheckCircle, AlertTriangle, Info } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "booking", title: "Booking Confirmed", desc: "Your parking at Phoenix Mall has been confirmed for 2:00 PM today.", time: "2 min ago", read: false, icon: CheckCircle, color: "text-success" },
  { id: "2", type: "payment", title: "Payment Successful", desc: "₹120 paid for Tambaram Station Parking. Transaction ID: TXN78234.", time: "1 hr ago", read: false, icon: CreditCard, color: "text-primary" },
  { id: "3", type: "reminder", title: "Parking Expiring Soon", desc: "Your parking at Grand Square Mall expires in 15 minutes. Extend now to avoid penalties.", time: "3 hr ago", read: true, icon: AlertTriangle, color: "text-warning" },
  { id: "4", type: "promo", title: "Weekend Offer 🎉", desc: "Get 20% off on all parking bookings this weekend. Use code PARK20.", time: "1 day ago", read: true, icon: Info, color: "text-primary" },
  { id: "5", type: "vehicle", title: "Vehicle Added", desc: "TN 01 AB 1234 has been added to your account successfully.", time: "2 days ago", read: true, icon: Car, color: "text-primary" },
  { id: "6", type: "booking", title: "Booking Completed", desc: "Your parking session at Chromepet Market has ended. Total: ₹60.", time: "3 days ago", read: true, icon: CheckCircle, color: "text-success" },
];

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-body font-bold text-foreground text-center">Notifications</h1>
        <div className="w-[44px] flex justify-end">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-caption font-bold text-primary-foreground">{unreadCount}</span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {MOCK_NOTIFICATIONS.map((notif, i) => {
          const Icon = notif.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 px-4 py-4 border-b border-border ${!notif.read ? "bg-primary/5" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? "bg-primary/10" : "bg-secondary"}`}>
                <Icon className={`w-5 h-5 ${notif.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-body-sm font-bold text-foreground truncate ${!notif.read ? "" : "opacity-80"}`}>{notif.title}</p>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="mt-0.5 text-caption text-muted-foreground leading-relaxed">{notif.desc}</p>
                <p className="mt-1 text-caption text-muted-foreground/60">{notif.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsScreen;
