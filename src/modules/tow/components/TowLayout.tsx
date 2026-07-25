// Shared mobile shell for authenticated Tow operator screens.
// Provides a compact top header + slot for content + the TowBottomNav.
// Screens using this layout: T-02, T-03, T-04, T-05, T-06, T-07, T-08.

import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Truck } from "lucide-react";
import TowBottomNav from "./TowBottomNav";
import { getTowAuth, getOperatorById } from "@/modules/tow/lib/tow";
import { AnimatedPage } from "@/shared/motion";

interface TowLayoutProps {
  title: string;
  children: ReactNode;
  showBack?: boolean;
  showNav?: boolean;
  right?: ReactNode;
}

const TowLayout = ({
  title,
  children,
  showBack = false,
  showNav = true,
  right,
}: TowLayoutProps) => {
  const navigate = useNavigate();
  const auth = getTowAuth();
  const op = auth ? getOperatorById(auth.operatorId) : null;

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pb-[80px]">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="touch-target flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-body font-bold text-foreground leading-tight">
            {title}
          </span>
          {op && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              {op.truckPlate} · {op.city}
            </span>
          )}
        </div>
        {right ?? (
          <button
            onClick={() => navigate("/tow/notifications")}
            className="touch-target flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>

      {showNav && <TowBottomNav />}
    </AnimatedPage>
  );
};

export default TowLayout;
