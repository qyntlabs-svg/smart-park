// Bottom navigation for the mobile Tow operator app.
// Mirrors the shape of `src/components/BottomNav.tsx`.

import { useNavigate, useLocation } from "react-router-dom";
import { LayoutList, Wrench, Wallet, User } from "lucide-react";

const tabs = [
  { key: "/tow/dispatch", icon: LayoutList, label: "Dispatch" },
  { key: "/tow/jobs", icon: Wrench, label: "Jobs" },
  { key: "/tow/earnings", icon: Wallet, label: "Earnings" },
  { key: "/tow/profile", icon: User, label: "Profile" },
] as const;

const TowBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border pb-safe z-30">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // "Jobs" is active for any /tow/jobs* route (list + detail + proof + nav).
          const active =
            tab.key === "/tow/jobs"
              ? pathname.startsWith("/tow/jobs")
              : pathname === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className="relative flex flex-col items-center gap-0.5 min-w-[64px] py-1"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {tab.label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TowBottomNav;
