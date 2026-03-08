import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wrench, ShoppingBag, User } from "lucide-react";

const tabs = [
  { key: "/home", icon: Home, label: "Home" },
  { key: "/mechanics", icon: Wrench, label: "Mechanics" },
  { key: "/shop", icon: ShoppingBag, label: "Shop" },
  { key: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border pb-safe z-30">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map(({ key, icon: Icon, label }) => {
          const active = pathname === key;
          return (
            <button
              key={key}
              onClick={() => navigate(key)}
              className="flex flex-col items-center gap-0.5 min-w-[64px] py-1"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {active && (
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
