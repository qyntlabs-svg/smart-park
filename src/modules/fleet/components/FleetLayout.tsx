// FleetLayout — desktop-first shell for Fleet OS routes.
// Left rail: product branding + module nav. Top bar: workspace switcher,
// notifications bell, user avatar. Main: full-width dense area.
//
// On <768px it does NOT block access; renders a "Best viewed on desktop"
// banner and stacks the nav horizontally.

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Fuel,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Route,
  ShieldCheck,
  Users,
  Wrench,
  X,
  Zap,
  FileBarChart2,
  BellRing,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useFleetAlerts } from "@/modules/fleet/hooks";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  screenId: string;
}

const NAV: NavItem[] = [
  { label: "Overview", to: "/fleet", icon: LayoutDashboard, screenId: "F-01" },
  { label: "Vehicles", to: "/fleet/vehicles", icon: Gauge, screenId: "F-02" },
  { label: "Drivers", to: "/fleet/drivers", icon: Users, screenId: "F-03" },
  { label: "Energy", to: "/fleet/energy", icon: Fuel, screenId: "F-04" },
  { label: "Maintenance", to: "/fleet/maintenance", icon: Wrench, screenId: "F-05" },
  { label: "Batch reserve", to: "/fleet/batch-reserve", icon: CalendarClock, screenId: "F-06" },
  { label: "Cost reports", to: "/fleet/reports", icon: FileBarChart2, screenId: "F-07" },
  { label: "Billing", to: "/fleet/billing", icon: CreditCard, screenId: "F-08" },
  { label: "Routes", to: "/fleet/routes", icon: Route, screenId: "F-09" },
  { label: "Policies", to: "/fleet/policies", icon: ShieldCheck, screenId: "F-10" },
  { label: "API keys", to: "/fleet/api-keys", icon: KeyRound, screenId: "F-11" },
  { label: "SSO setup", to: "/fleet/sso", icon: Activity, screenId: "F-12" },
  { label: "Notifications", to: "/fleet/notifications", icon: BellRing, screenId: "F-13" },
];

const WORKSPACES = [
  { id: "ws-north", name: "Chennai North Fleet" },
  { id: "ws-south", name: "Chennai South Depot" },
  { id: "ws-blr", name: "Bangalore Pilot" },
];

export const FleetLayout = ({
  title,
  screenId,
  primitives,
  actions,
  children,
}: {
  title: string;
  screenId: string;
  primitives?: string[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: alerts = [] } = useFleetAlerts();
  const unread = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);
  const [activeWs, setActiveWs] = useState(() =>
    typeof window === "undefined"
      ? WORKSPACES[0]
      : (() => {
          const stored = window.localStorage.getItem("fleetActiveWorkspace");
          return (
            WORKSPACES.find((w) => w.id === stored) ?? WORKSPACES[0]
          );
        })(),
  );

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const setWorkspace = (id: string) => {
    const found = WORKSPACES.find((w) => w.id === id);
    if (!found) return;
    setActiveWs(found);
    window.localStorage.setItem("fleetActiveWorkspace", id);
    setWsOpen(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 text-slate-900 flex">
      {/* ---- Sidebar (desktop) ---- */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
        <BrandBlock />
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 text-[11px] text-slate-500">
          Fleet OS · Phase 3 preview
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileBanner />
        <TopBar
          title={title}
          screenId={screenId}
          primitives={primitives}
          onMenu={() => setMobileOpen(true)}
          activeWs={activeWs}
          onOpenWs={() => setWsOpen((v) => !v)}
          wsOpen={wsOpen}
          onPickWs={setWorkspace}
          unread={unread}
          onBell={() => navigate("/fleet/notifications")}
          actions={actions}
        />
        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>

      {/* ---- Mobile nav drawer ---- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close nav"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
              <BrandBlock compact />
              <button
                className="p-2 text-slate-500"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Bits ----------

const BrandBlock = ({ compact }: { compact?: boolean }) => (
  <div className={cn("px-4 py-4 border-b border-slate-200 flex items-center gap-2", compact && "py-3")}>
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
      <Zap className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 leading-tight">Fleet OS</p>
      <p className="text-[11px] text-slate-500 leading-tight">
        SmartPark Console
      </p>
    </div>
  </div>
);

const SidebarLink = ({ item }: { item: NavItem }) => {
  const { pathname } = useLocation();
  const active =
    item.to === "/fleet"
      ? pathname === "/fleet"
      : pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <NavLink
      to={item.to}
      end={item.to === "/fleet"}
      className={cn(
        "relative flex items-center gap-2.5 mx-2 my-0.5 px-3 py-2 rounded-lg text-[13px] transition-all",
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:translate-x-0.5",
      )}
    >
      {/* Active-item accent bar — animates position between items via
          shared layoutId, so switching routes feels like the pill slides. */}
      {active && (
        <motion.span
          layoutId="fleet-nav-active"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-blue-600"
        />
      )}
      <item.icon className={cn("w-4 h-4 shrink-0", active && "text-blue-600")} />
      <span className="truncate">{item.label}</span>
      <span className="ml-auto text-[10px] text-slate-400 font-mono">
        {item.screenId}
      </span>
    </NavLink>
  );
};

const MobileBanner = () => (
  <div className="md:hidden bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px] px-4 py-2">
    Fleet OS is best viewed on desktop. Consider opening on a larger screen.
  </div>
);

const TopBar = ({
  title,
  screenId,
  primitives,
  onMenu,
  activeWs,
  onOpenWs,
  wsOpen,
  onPickWs,
  unread,
  onBell,
  actions,
}: {
  title: string;
  screenId: string;
  primitives?: string[];
  onMenu: () => void;
  activeWs: { id: string; name: string };
  onOpenWs: () => void;
  wsOpen: boolean;
  onPickWs: (id: string) => void;
  unread: number;
  onBell: () => void;
  actions?: React.ReactNode;
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3 px-4 md:px-6 h-14">
        <button
          onClick={onMenu}
          className="md:hidden p-2 text-slate-600 -ml-2"
          aria-label="Open nav"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold text-slate-900 truncate">
              {title}
            </h1>
            <span className="hidden sm:inline text-[10px] font-mono text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
              {screenId}
            </span>
          </div>
          {primitives && primitives.length > 0 && (
            <p className="text-[11px] text-slate-500 truncate">
              {primitives.join(" · ")}
            </p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {actions}
        </div>

        {/* Workspace switcher */}
        <div className="relative">
          <button
            onClick={onOpenWs}
            className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-slate-200 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
          >
            <MapIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[160px]">{activeWs.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {wsOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-40 py-1">
              {WORKSPACES.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onPickWs(w.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px]",
                    w.id === activeWs.id
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {w.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bell */}
        <button
          onClick={onBell}
          className="relative w-9 h-9 rounded-md hover:bg-slate-100 flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[12px] font-bold flex items-center justify-center">
          FO
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2 px-3 pb-2 overflow-x-auto">
        {actions}
      </div>
    </div>
  );
};

// ---------- Reusable content primitives ----------

export const FleetPageBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-4 md:px-6 py-5 md:py-6 space-y-6", className)}>
    {children}
  </div>
);

export const FleetKpiCard = ({
  label,
  value,
  hint,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 26 }}
    whileHover={{ y: -2, boxShadow: "0 12px 32px -12px rgba(15,23,42,0.18)" }}
    className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow"
  >
    <div className="flex items-center justify-between">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </p>
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
    </div>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    <div className="mt-1 flex items-center gap-2">
      {trend && (
        <span
          className={cn(
            "text-[11px] font-semibold rounded px-1.5 py-0.5",
            trend.positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {trend.positive ? "▲" : "▼"} {trend.value}
        </span>
      )}
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </div>
  </motion.div>
);

export const FleetSection = ({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-xl border border-slate-200 bg-white overflow-hidden",
      className,
    )}
  >
    <div className="flex items-start justify-between gap-3 px-4 md:px-5 py-3 border-b border-slate-100">
      <div className="min-w-0">
        <h2 className="text-[14px] font-bold text-slate-900 truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-slate-500 truncate">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
    <div>{children}</div>
  </section>
);

export const FleetEmpty = ({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="text-center py-12 px-6">
    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
      <Gauge className="w-6 h-6" />
    </div>
    <p className="mt-3 text-[14px] font-semibold text-slate-800">{title}</p>
    <p className="mt-1 text-[12px] text-slate-500 max-w-sm mx-auto">{body}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center px-3 h-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const FleetError = ({
  title = "Something went wrong",
  onRetry,
}: {
  title?: string;
  onRetry?: () => void;
}) => (
  <div className="text-center py-12 px-6">
    <p className="text-[14px] font-semibold text-red-700">{title}</p>
    <p className="mt-1 text-[12px] text-slate-500">
      Please retry — this data view is served from mock storage in this build.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center px-3 h-8 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-700"
      >
        Retry
      </button>
    )}
  </div>
);

export const FleetLoading = () => (
  <div className="p-6 space-y-3">
    <div className="h-8 bg-slate-100 rounded animate-pulse" />
    <div className="h-24 bg-slate-100 rounded animate-pulse" />
    <div className="h-24 bg-slate-100 rounded animate-pulse" />
  </div>
);

export default FleetLayout;
