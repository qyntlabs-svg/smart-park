import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, Car, ClipboardList, Wrench, ShoppingBag,
  HelpCircle, FileText, Star, Share2, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: ClipboardList, label: "Booking History", route: "/booking-history" },
  { icon: Car, label: "My Vehicles", route: "/vehicles" },
  { icon: Wrench, label: "Mechanics", route: "/mechanics", locked: true },
  { icon: ShoppingBag, label: "Shop", route: "/shop", locked: true },
  { divider: true },
  { icon: Star, label: "Rate Us", route: "__rate" },
  { icon: Share2, label: "Share App", route: "__share" },
  { icon: HelpCircle, label: "Help & Support", route: "/help-support" },
  { icon: FileText, label: "Terms & Privacy", route: "/terms-privacy" },
];

const SideDrawer = ({ open, onClose }: SideDrawerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleItemClick = (item: any) => {
    onClose();

    if (item.locked) {
      toast({ title: "Coming Soon 🔒", description: `${item.label} will be available after launch.` });
      return;
    }

    if (item.route === "__rate") {
      // Try native store link, fallback to toast
      const playStoreUrl = "https://play.google.com/store/apps/details?id=app.lovable.5a95fab7a2894a00834029d7c9e2783c";
      window.open(playStoreUrl, "_blank");
      return;
    }

    if (item.route === "__share") {
      const shareData = {
        title: "Auto Doc - Smart Parking App",
        text: "Find and book parking in seconds! Download Auto Doc now.",
        url: "https://autodoc.in",
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({ title: "Link Copied!", description: "Share link has been copied to clipboard." });
      }
      return;
    }

    if (item.route) navigate(item.route);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-2xl flex flex-col"
          >
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

            <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
              {menuItems.map((item, i) => {
                if ('divider' in item && item.divider) {
                  return <div key={i} className="my-2 mx-4 border-t border-border" />;
                }
                const Icon = item.icon!;
                return (
                  <button
                    key={i}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 h-12 px-6 active:bg-secondary transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${item.locked ? "text-muted-foreground/40" : "text-primary"}`} />
                    <span className={`flex-1 text-body-sm text-left ${item.locked ? "text-muted-foreground/40" : "text-foreground"}`}>{item.label}</span>
                    {item.locked && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-caption font-bold text-muted-foreground">
                        <Lock className="w-3 h-3" /> Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

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
