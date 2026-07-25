// Screen: shared · Primitives: Identity (frame only)
//
// Desktop-first two-column layout for the Vehicle Identity Platform.
// Admin / OEM / insurer console frame — Salesforce-pattern.

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Car,
  ShieldCheck,
  History,
  FileText,
  Search,
  Building2,
  Radio,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

const NAV: Array<{ to: string; label: string; icon: any; end?: boolean }> = [
  { to: "/vip", label: "Search vehicles", icon: Search, end: true },
  {
    to: "/vip/integrations/insurance",
    label: "Insurance integrations",
    icon: ShieldCheck,
  },
  { to: "/vip/integrations/oem", label: "OEM data feeds", icon: Radio },
];

export const VipLayout = ({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex">
      {/* Left rail */}
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-slate-800 bg-slate-900/60">
        <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-800">
          <Car className="w-5 h-5 text-cyan-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-wide">VIP</span>
            <span className="text-[10px] text-slate-400">
              Vehicle Identity Platform
            </span>
          </div>
        </div>
        <nav className="p-2 flex flex-col gap-1 flex-1">
          {NAV.map((item) => {
            const isActive = item.end
              ? currentPath === item.to
              : currentPath === item.to ||
                currentPath.startsWith(item.to + "/");
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`relative flex items-center gap-2 rounded px-3 py-2 text-[13px] transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300"
                    : "text-slate-300 hover:bg-slate-800 hover:translate-x-0.5"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="vip-nav-active"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-cyan-400"
                  />
                )}
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500">
          Chennai · Admin console v0
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900/40 backdrop-blur flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate">{title}</div>
              {subtitle ? (
                <div className="text-[11px] text-slate-400 truncate">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">{right}</div>
        </header>
        <div className="flex-1 min-w-0 overflow-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// ─── shared bits used across VIP pages ─────────────────────────────────

export const VipCard = ({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-lg border border-slate-800 bg-slate-900/50 ${className}`}
  >
    {title || action ? (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        {title ? (
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </h3>
        ) : (
          <span />
        )}
        {action}
      </div>
    ) : null}
    <div className="p-4">{children}</div>
  </div>
);

export const VipEmpty = ({
  title,
  hint,
  icon: Icon = FileText,
}: {
  title: string;
  hint?: string;
  icon?: any;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
      <Icon className="w-5 h-5 text-slate-400" />
    </div>
    <div className="text-[13px] font-semibold">{title}</div>
    {hint ? <div className="text-[12px] text-slate-400">{hint}</div> : null}
  </div>
);

export const VipLoading = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const VipError = ({ message }: { message: string }) => (
  <div className="rounded border border-rose-500/40 bg-rose-500/10 text-rose-200 text-[13px] p-4">
    {message}
  </div>
);

export const VehicleTabs = ({
  vehicleId,
  current,
}: {
  vehicleId: string;
  current:
    | "profile"
    | "history"
    | "ownership"
    | "docs"
    | "permissions";
}) => {
  const items: Array<{ id: typeof current; label: string; icon: any; to: string }> = [
    {
      id: "profile",
      label: "Profile",
      icon: Car,
      to: `/vip/vehicles/${vehicleId}`,
    },
    {
      id: "history",
      label: "History",
      icon: History,
      to: `/vip/vehicles/${vehicleId}/history`,
    },
    {
      id: "ownership",
      label: "Ownership",
      icon: Building2,
      to: `/vip/vehicles/${vehicleId}/ownership`,
    },
    {
      id: "docs",
      label: "Docs",
      icon: FileText,
      to: `/vip/vehicles/${vehicleId}/docs`,
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: KeyRound,
      to: `/vip/vehicles/${vehicleId}/permissions`,
    },
  ];
  return (
    <nav className="flex gap-1 border-b border-slate-800 mb-4 overflow-x-auto">
      {items.map((it) => (
        <NavLink
          key={it.id}
          to={it.to}
          end
          className={() => {
            const active = it.id === current;
            return `inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[12px] font-medium border-b-2 -mb-px ${
              active
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`;
          }}
        >
          <it.icon className="w-3.5 h-3.5" />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
};
