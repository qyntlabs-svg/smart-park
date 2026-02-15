import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Car, CreditCard, Clock,
  Bell, HelpCircle, FileText, Info, LogOut, User, Heart, Moon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDarkMode } from "@/hooks/use-dark-mode";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const menuItems = [
    { icon: Car, label: "My Vehicles", action: () => navigate("/vehicles") },
    { icon: CreditCard, label: "Payment Methods", badge: "Coming Soon" },
    { icon: Clock, label: "Booking History", badge: "Coming Soon" },
    { icon: Bell, label: "Notifications", toggle: true, checked: notifications, onToggle: setNotifications },
    { icon: Moon, label: "Dark Mode", toggle: true, checked: isDark, onToggle: () => toggleDark() },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { icon: FileText, label: "Terms & Privacy", action: () => {} },
    { icon: Info, label: "About", action: () => {} },
    { icon: LogOut, label: "Logout", destructive: true, action: () => setShowLogout(true) },
  ];

  const handleLogout = () => {
    // TODO: Supabase signOut
    localStorage.removeItem("hasSeenOnboarding");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header gradient */}
      <div className="relative bg-gradient-to-br from-primary to-[hsl(217,91%,45%)] pt-safe">
        {/* Back button */}
        <div className="flex items-center h-[60px] px-4">
          <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>
          <h1 className="flex-1 text-body font-bold text-primary-foreground text-center">Profile</h1>
          <div className="w-[44px]" />
        </div>

        {/* Profile info */}
        <div className="flex flex-col items-center pb-12 pt-2">
          <div className="w-[100px] h-[100px] rounded-full bg-primary-foreground/20 border-[3px] border-primary-foreground shadow-lg flex items-center justify-center">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="mt-4 text-heading-md text-primary-foreground">User</h2>
          <p className="mt-1 text-body-sm text-primary-foreground/80">+91 98765 43210</p>
          <button className="mt-3 px-5 py-2 rounded-full bg-primary-foreground/20 border border-primary-foreground/30 text-body-sm font-semibold text-primary-foreground">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Menu content */}
      <div className="flex-1 -mt-6 bg-background rounded-t-3xl overflow-y-auto scrollbar-hide">
        <div className="bg-card rounded-t-3xl">
          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={item.action}
              disabled={!!item.badge}
              className={`w-full flex items-center gap-4 h-[60px] px-6 active:bg-secondary transition-colors ${
                i < menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.destructive ? "text-destructive" : "text-primary"}`} />
              <span className={`flex-1 text-body text-left ${item.destructive ? "text-destructive" : "text-foreground"}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-md bg-muted text-caption font-medium text-muted-foreground">
                  {item.badge}
                </span>
              )}
              {item.toggle && (
                <Switch checked={item.checked} onCheckedChange={item.onToggle} />
              )}
              {!item.badge && !item.toggle && !item.destructive && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.button>
          ))}
        </div>

        {/* App info */}
        <div className="flex flex-col items-center py-8">
          <div className="w-[60px] h-[60px] rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <p className="mt-3 text-body font-semibold text-foreground">Auto Doc</p>
          <p className="text-caption text-muted-foreground">v1.0.0</p>
          <p className="mt-1 text-caption text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-destructive fill-destructive" /> in India
          </p>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-heading-sm text-foreground text-center">Logout</h3>
            <p className="mt-2 text-body-sm text-muted-foreground text-center">
              Are you sure you want to logout?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 h-12 rounded-xl border border-border text-body-sm font-semibold text-foreground active:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 rounded-xl bg-destructive text-body-sm font-semibold text-destructive-foreground active:opacity-80"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
