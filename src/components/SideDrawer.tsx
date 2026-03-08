import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, Car, ClipboardList, Wrench, ShoppingBag,
  HelpCircle, FileText, Star, Share2
} from "lucide-react";
import logo from "@/assets/logo.jpg";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: ClipboardList, label: "Booking History", route: "/booking-history" },
  { icon: Car, label: "My Vehicles", route: "/vehicles" },
  { icon: Wrench, label: "Mechanics", route: "/mechanics", badge: "New" },
  { icon: ShoppingBag, label: "Shop", route: "/shop", badge: "New" },
  { divider: true },
  { icon: Star, label: "Rate Us", route: "" },
  { icon: Share2, label: "Share App", route: "" },
  { icon: HelpCircle, label: "Help & Support", route: "" },
  { icon: FileText, label: "Terms & Privacy", route: "" },
];

const SideDrawer = ({ open, onClose }: SideDrawerProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-[hsl(4,90%,48%)] p-6 pt-safe">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center mt-safe">
                <X className="w-4 h-4 text-primary-foreground" />
              </button>
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary-foreground/20 shadow-lg">
                <img src={logo} alt="Auto Doc" className="w-full h-full object-cover" />
              </div>
              <h2 className="mt-3 text-body font-bold text-primary-foreground">Auto Doc</h2>
              <p className="text-caption text-primary-foreground/70">Your vehicle companion</p>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
              {menuItems.map((item, i) => {
                if ('divider' in item && item.divider) {
                  return <div key={i} className="my-2 mx-4 border-t border-border" />;
                }
                const Icon = item.icon!;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onClose();
                      if (item.route) navigate(item.route);
                    }}
                    className="w-full flex items-center gap-3 h-12 px-6 active:bg-secondary transition-colors"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-body-sm text-foreground text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-caption font-bold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-caption text-muted-foreground text-center">Auto Doc v1.0.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideDrawer;
