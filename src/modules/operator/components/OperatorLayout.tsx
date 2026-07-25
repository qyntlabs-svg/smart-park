// OperatorLayout — desktop-first shell for Charging Operator SaaS routes.

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BellRing,
  ChevronDown,
  CreditCard,
  DollarSign,
  Gauge,
  Globe,
  LayoutDashboard,
  MapPin,
  Menu,
  Monitor,
  ShieldAlert,
  Sliders,
  Terminal,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperatorNotices } from "@/modules/operator/hooks";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  screenId: string;
}

const NAV: NavItem[] = [
  { label: "Overview", to: "/operator", icon: LayoutDashboard, screenId: "CO-01" },
  { label: "Stations", to: "/operator/stations", icon: MapPin, screenId: "CO-02" },
  { label: "Remote console", to: "/operator/remote", icon: Terminal, screenId: "CO-04" },
  { label: "Pricing rules", to: "/operator/pricing", icon: Sliders, screenId: "CO-05" },
  { label: "Uptime / SLA", to: "/operator/sla", icon: ShieldAlert, screenId: "CO-06" },
  { label: "Utilization", to: "/operator/utilization", icon: Activity, screenId: "CO-07" },
  { label: "Revenue", to: "/operator/revenue", icon: DollarSign, screenId: "CO-08" },
  { label: "Roaming", to: "/operator/roaming", icon: Globe, screenId: "CO-09" },
  { label: "Maintenance", to: "/operator/maintenance", icon: Wrench, screenId: "CO-10" },
  { label: "Firmware / OTA", to: "/operator/firmware", icon: Monitor, screenId: "CO-11" },
  { label: "Notifications", to: "/operator/notifications", icon: BellRing, screenId: "CO-12" },
];

const WORKSPACES = [
  { id: "op-primary", name: "AutoDoc Volt Network" },
  { id: "op-partner", name: "Partner: Relay Networks" },
];

export const OperatorLayout = ({
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
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const notices = useOperatorNotices();
  const unread = useMemo(() => notices.data?.filter((n) => !n.read).length ?? 0, [notices.data]);
  const [activeWs, setActiveWs] = useState(() =>
    typeof window === "undefined"
      ? WORKSPACES[0]
      : (() => {
          const stored = window.localStorage.getItem("operatorActiveWorkspace");
          return WORKSPACES.find((w) => w.id === stored) ?? WORKSPACES[0];
        })(),
  );

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const setWorkspace = (id: string) => {
    const found = WORKSPACES.find((w) => w.id === id);
    if (!found) return;
    setActiveWs(found);
    window.localStorage.setItem("operatorActiveWorkspace", id);
    setWsOpen(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 text-slate-900 flex">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-200 bg-white">
        <Brand />
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 text-[11px] text-slate-500">
          Charging Operator SaaS · Phase 2
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px] px-4 py-2">
          Operator SaaS is best viewed on desktop.
        </div>
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-slate-600 -ml-2"
              aria-label="Open nav"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-slate-900 truncate">{title}</h1>
                <span className="hidden sm:inline text-[10px] font-mono text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                  {screenId}
                </span>
              </div>
              {primitives && (
                <p className="text-[11px] text-slate-500 truncate">
                  {primitives.join(" · ")}
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2">{actions}</div>

            <div className="relative">
              <button
                onClick={() => setWsOpen((v) => !v)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-slate-200 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="truncate max-w-[180px]">{activeWs.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {wsOpen && (
                <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-40 py-1">
                  {WORKSPACES.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setWorkspace(w.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[12px]",
                        w.id === activeWs.id
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/operator/notifications")}
              className="relative w-9 h-9 rounded-md hover:bg-slate-100 flex items-center justify-center"
              aria-label="Notifications"
            >
              <BellRing className="w-4.5 h-4.5 text-slate-600" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[12px] font-bold flex items-center justify-center">
              CO
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2 px-3 pb-2 overflow-x-auto">
            {actions}
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close nav"
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
              <Brand compact />
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

const Brand = ({ compact }: { compact?: boolean }) => (
  <div className={cn("px-4 py-4 border-b border-slate-200 flex items-center gap-2", compact && "py-3")}>
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
      <Zap className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 leading-tight">Charging Ops</p>
      <p className="text-[11px] text-slate-500 leading-tight">SmartPark SaaS</p>
    </div>
  </div>
);

const SidebarLink = ({ item }: { item: NavItem }) => {
  const { pathname } = useLocation();
  const active =
    item.to === "/operator"
      ? pathname === "/operator"
      : pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <NavLink
      to={item.to}
      end={item.to === "/operator"}
      className={cn(
        "relative flex items-center gap-2.5 mx-2 my-0.5 px-3 py-2 rounded-lg text-[13px] transition-all",
        active
          ? "bg-emerald-50 text-emerald-700 font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:translate-x-0.5",
      )}
    >
      {active && (
        <motion.span
          layoutId="operator-nav-active"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-emerald-500"
        />
      )}
      <item.icon className={cn("w-4 h-4 shrink-0", active && "text-emerald-600")} />
      <span className="truncate">{item.label}</span>
      <span className="ml-auto text-[10px] text-slate-400 font-mono">
        {item.screenId}
      </span>
    </NavLink>
  );
};

// ---------- Reusable content primitives ----------

export const OperatorPageBody = ({
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

export const OperatorKpiCard = ({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "danger" | "warning" | "success" | "default";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 26 }}
    whileHover={{ y: -2, boxShadow: "0 12px 32px -12px rgba(15,23,42,0.18)" }}
    className={cn(
      "rounded-xl border p-4 bg-white transition-shadow",
      tone === "danger"
        ? "border-red-200"
        : tone === "warning"
          ? "border-amber-200"
          : tone === "success"
            ? "border-emerald-200"
            : "border-slate-200",
    )}
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

export const OperatorSection = ({
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
  <section className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
    <div className="flex items-start justify-between gap-3 px-4 md:px-5 py-3 border-b border-slate-100">
      <div className="min-w-0">
        <h2 className="text-[14px] font-bold text-slate-900 truncate">{title}</h2>
        {subtitle && <p className="text-[12px] text-slate-500 truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
    <div>{children}</div>
  </section>
);

export const OperatorLoading = () => (
  <div className="p-6 space-y-3">
    <div className="h-8 bg-slate-100 rounded animate-pulse" />
    <div className="h-24 bg-slate-100 rounded animate-pulse" />
    <div className="h-24 bg-slate-100 rounded animate-pulse" />
  </div>
);

export const OperatorEmpty = ({
  title,
  body,
  icon: Icon = Gauge,
}: {
  title: string;
  body: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="text-center py-12 px-6">
    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
      <Icon className="w-6 h-6" />
    </div>
    <p className="mt-3 text-[14px] font-semibold text-slate-800">{title}</p>
    <p className="mt-1 text-[12px] text-slate-500 max-w-sm mx-auto">{body}</p>
  </div>
);

// suppress unused import
void CreditCard;
