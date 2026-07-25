// Shared mobile-first layout for extended Partner screens (V-17..V-26).
// Mirrors the header + safe-area + max-w-md pattern used across V-01..V-16.

import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { AnimatedPage } from "@/shared/motion";

interface Props {
  title: string;
  icon?: LucideIcon;
  onBack?: () => void;
  action?: ReactNode;
  children: ReactNode;
  /** When true, disables padding around children so screens can bleed edge-to-edge. */
  noPadding?: boolean;
}

const PartnerScreenLayout = ({
  title,
  icon: Icon,
  onBack,
  action,
  children,
  noPadding,
}: Props) => {
  const navigate = useNavigate();
  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack ?? (() => navigate(-1))}
            className="touch-target flex items-center justify-center hover:bg-secondary rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          {Icon && <Icon className="w-5 h-5 text-primary shrink-0" />}
          <span className="text-body font-bold text-foreground truncate">
            {title}
          </span>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div
        className={
          noPadding
            ? "flex-1 overflow-y-auto"
            : "flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
        }
      >
        {children}
      </div>
    </AnimatedPage>
  );
};

export default PartnerScreenLayout;
