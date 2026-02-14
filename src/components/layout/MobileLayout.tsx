import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const MobileLayout = ({ children, className, noPadding }: MobileLayoutProps) => {
  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full max-w-md mx-auto bg-background",
        !noPadding && "px-4",
        className
      )}
    >
      {children}
    </div>
  );
};

interface MobileHeaderProps {
  left?: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

const MobileHeader = ({ left, title, right, className, transparent }: MobileHeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between h-[60px] px-4 pt-safe",
        !transparent && "bg-card border-b border-border",
        className
      )}
    >
      <div className="flex items-center min-w-[44px]">{left}</div>
      {title && <h1 className="text-body font-bold text-foreground">{title}</h1>}
      <div className="flex items-center min-w-[44px] justify-end">{right}</div>
    </header>
  );
};

export { MobileLayout, MobileHeader };
