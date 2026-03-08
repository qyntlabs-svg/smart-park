import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wrench, ShoppingBag, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { key: "/home", icon: Home, label: "Home", locked: false },
  { key: "/mechanics", icon: Wrench, label: "Mechanics", locked: true },
  { key: "/shop", icon: ShoppingBag, label: "Shop", locked: true },
  { key: "/profile", icon: User, label: "Profile", locked: false },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();

  const handleTap = (tab: typeof tabs[number]) => {
    if (tab.locked) {
      toast({ title: "Coming Soon 🔒", description: `${tab.label} will be available after launch.` });
      return;
    }
    navigate(tab.key);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border pb-safe z-30">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = pathname === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTap(tab)}
              className="relative flex flex-col items-center gap-0.5 min-w-[64px] py-1"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    tab.locked ? "text-muted-foreground/40" : active ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {tab.locked && (
                  <Lock className="absolute -top-1 -right-1.5 w-2.5 h-2.5 text-muted-foreground" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  tab.locked ? "text-muted-foreground/40" : active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {active && !tab.locked && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
