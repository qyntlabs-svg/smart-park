import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  HelpCircle,
  FileText,
  Info,
  Share2,
  Star,
  ChevronRight,
  Zap,
  Warehouse,
  Wallet,
  Receipt,
  MessageSquareWarning,
  Users,
  BellRing,
  Percent,
  Image as ImageIcon,
  Gift,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Primary business-listing sections a partner manages.
const PARTNER_LISTINGS = [
  { label: "EV Charging Stations", icon: Zap, route: "/partner/ev" },
  { label: "Parking Rentals", icon: Warehouse, route: "/partner/rentals" },
];

// V-17..V-26 extended vendor surfaces — grouped by intent for easy scanning
// from the drawer. Each group renders under its own header below.
const PARTNER_FINANCE = [
  { label: "Payouts", icon: Wallet, route: "/partner/payouts" },
  { label: "Invoices & Tax Docs", icon: Receipt, route: "/partner/invoices" },
];

const PARTNER_GROWTH = [
  { label: "Reviews", icon: Star, route: "/partner/reviews" },
  { label: "Facility Media", icon: ImageIcon, route: "/partner/facility-media" },
  { label: "Refer a Vendor", icon: Gift, route: "/partner/referral" },
];

const PARTNER_OPS = [
  { label: "Disputes", icon: MessageSquareWarning, route: "/partner/disputes" },
  { label: "Pricing Rules", icon: Percent, route: "/partner/pricing-rules" },
  { label: "Staff / Attendants", icon: Users, route: "/partner/staff" },
  { label: "Notifications", icon: BellRing, route: "/partner/notifications" },
];

const PARTNER_ONBOARDING = [
  { label: "Onboarding Checklist", icon: ClipboardCheck, route: "/partner/onboarding" },
];

const MENU_ITEMS = [
  { label: "Help & Support", icon: HelpCircle, route: "/help-support" },
  { label: "Terms & Privacy", icon: FileText, route: "/terms-privacy" },
  { label: "About", icon: Info, route: "/about" },
];

const PartnerSideDrawer = ({ open, onClose }: Props) => {
  const navigate = useNavigate();

  const handleShare = async () => {
    const text =
      "Check out Auto Doc – Smart Parking Management for Partners!\nhttps://play.google.com/store/apps/details?id=com.autodoc.app";
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
    window.open(
      "https://play.google.com/store/apps/details?id=com.autodoc.app",
      "_blank",
    );
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
              <button
                onClick={onClose}
                className="touch-target flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 py-2 overflow-y-auto">
              {/* Business listings — Partner's other revenue streams */}
              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                My Listings
              </p>
              {PARTNER_LISTINGS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              {/* V-17..V-18 — Finance */}
              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Finance
              </p>
              {PARTNER_FINANCE.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              {/* V-23 / V-24 / V-26 — Growth */}
              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Growth
              </p>
              {PARTNER_GROWTH.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              {/* V-19 / V-20 / V-21 / V-22 — Ops */}
              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Ops
              </p>
              {PARTNER_OPS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              {/* V-25 — Onboarding */}
              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Onboarding
              </p>
              {PARTNER_ONBOARDING.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              <p className="px-4 pt-2 pb-1 text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Support
              </p>
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}

              <div className="mx-4 my-2 border-t border-border" />

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
              >
                <Share2 className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                  Share App
                </span>
              </button>
              <button
                onClick={handleRate}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
              >
                <Star className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-body-sm font-semibold text-foreground">
                  Rate Us
                </span>
              </button>
            </div>

            <div className="px-4 pb-6 pb-safe text-center">
              <p className="text-caption text-muted-foreground">
                Auto Doc Partner v1.0.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PartnerSideDrawer;
