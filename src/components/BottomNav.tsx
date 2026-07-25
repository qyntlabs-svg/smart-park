import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Wrench, ShoppingBag, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { key: "/home", icon: Home, label: "Home", locked: false },
  { key: "/mechanics", icon: Wrench, label: "Mechanics", locked: false },
  { key: "/shop", icon: ShoppingBag, label: "Shop", locked: true },
  { key: "/profile", icon: User, label: "Profile", locked: false },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();

  const handleTap = (tab: typeof tabs[number]) => {
    if (tab.locked) {
      toast({
        title: "Coming Soon 🔒",
        description: `${tab.label} will be available after launch.`,
      });
      return;
    }
    navigate(tab.key);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border pb-safe z-30">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.key;
          return (
            <motion.button
              key={tab.key}
              onClick={() => handleTap(tab)}
              whileTap={tab.locked ? undefined : { scale: 0.92 }}
              className="relative flex flex-col items-center gap-0.5 min-w-[64px] py-1"
              aria-current={active ? "page" : undefined}
            >
              {/* Animated active pill sits behind the icon column and slides
                  between tabs using shared layoutId. */}
              {active && !tab.locked && (
                <motion.div
                  layoutId="bottom-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-x-3 top-0 h-[3px] rounded-b-md bg-primary"
                />
              )}
              <div className="relative">
                <motion.div
                  animate={
                    active && !tab.locked
                      ? { scale: 1.08, y: -1 }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      tab.locked
                        ? "text-muted-foreground/40"
                        : active
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  />
                </motion.div>
                {tab.locked && (
                  <Lock className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-muted-foreground" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  tab.locked
                    ? "text-muted-foreground/40"
                    : active
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {active && !tab.locked && (
                <motion.div
                  layoutId="bottom-nav-dot"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="w-1 h-1 rounded-full bg-primary mt-0.5"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
