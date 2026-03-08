import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, HelpCircle, FileText, Info, Share2, Star, Shield, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MENU_ITEMS = [
  { label: "Help & Support", icon: HelpCircle, route: "/help-support" },
  { label: "Terms & Privacy", icon: FileText, route: "/terms-privacy" },
  { label: "About", icon: Info, route: "/about" },
];

const VendorSideDrawer = ({ open, onClose }: Props) => {
  const navigate = useNavigate();

  const handleShare = async () => {
    const text = "Check out Auto Doc – Smart Parking Management for Vendors!\nhttps://play.google.com/store/apps/details?id=com.autodoc.app";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Auto Doc", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Link copied!");
      }
    } catch {}
    onClose();
  };

  const handleRate = () => {
    window.open("https://play.google.com/store/apps/details?id=com.autodoc.app", "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-card z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[60px] pt-safe border-b border-border">
              <span className="text-body font-bold text-foreground">Menu</span>
              <button onClick={onClose} className="touch-target flex items-center justify-center">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 py-2">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { onClose(); navigate(item.route); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
              >
                <Share2 className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-body-sm font-semibold text-foreground">Share App</span>
              </button>
              <button
                onClick={handleRate}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
              >
                <Star className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-body-sm font-semibold text-foreground">Rate Us</span>
              </button>
            </div>

            <div className="px-4 pb-6 pb-safe text-center">
              <p className="text-caption text-muted-foreground">Auto Doc Vendor v1.0.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VendorSideDrawer;
