// DeveloperLayout — desktop-first shell for Developer Portal routes.

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Menu,
  Package,
  ScrollText,
  Store,
  Terminal,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDevActivePlan } from "@/modules/developer/hooks";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  screenId: string;
}

const NAV: NavItem[] = [
  { label: "Home", to: "/developer", icon: LayoutDashboard, screenId: "DEV-01" },
  { label: "API keys", to: "/developer/keys", icon: KeyRound, screenId: "DEV-02" },
  { label: "Sandbox", to: "/developer/sandbox", icon: Terminal, screenId: "DEV-03" },
  { label: "Docs", to: "/developer/docs", icon: BookOpen, screenId: "DEV-04" },
  { label: "Webhooks", to: "/developer/webhooks", icon: Webhook, screenId: "DEV-05" },
  { label: "Logs", to: "/developer/logs", icon: ScrollText, screenId: "DEV-06" },
  { label: "Usage", to: "/developer/usage", icon: Activity, screenId: "DEV-07" },
  { label: "Billing", to: "/developer/billing", icon: CreditCard, screenId: "DEV-08" },
  { label: "Apps", to: "/developer/apps", icon: Store, screenId: "DEV-09" },
];

const WORKSPACES = [
  { id: "dev-parkerx", name: "ParkerX Labs (default)" },
  { id: "dev-relay", name: "Relay Networks (partner)" },
];

export const DeveloperLayout = ({
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
  const plan = useDevActivePlan();
  const [activeWs, setActiveWs] = useState(() =>
    typeof window === "undefined"
      ? WORKSPACES[0]
      : (() => {
          const stored = window.localStorage.getItem("developerActiveWorkspace");
          return WORKSPACES.find((w) => w.id === stored) ?? WORKSPACES[0];
        })(),
  );

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const setWorkspace = (id: string) => {
    const found = WORKSPACES.find((w) => w.id === id);
    if (!found) return;
    setActiveWs(found);
    window.localStorage.setItem("developerActiveWorkspace", id);
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
        <div className="border-t border-slate-200 p-3 text-[11px] text-slate-500 space-y-1">
          <p>Developer Portal · Phase 3</p>
          {plan.data && (
            <p className="text-[10px] font-mono">
              Plan: <span className="text-slate-700">{plan.data.name}</span>
            </p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden bg-amber-50 border-b border-amber-200 text-amber-800 text-[12px] px-4 py-2">
          Developer Portal is best viewed on desktop.
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
                <h1 className="text-[15px] font-bold text-slate-900 truncate">
                  {title}
                </h1>
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
                <Package className="w-3.5 h-3.5 text-violet-500" />
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
                          ? "bg-violet-50 text-violet-700 font-semibold"
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
              onClick={() => navigate("/developer/logs")}
              className="relative w-9 h-9 rounded-md hover:bg-slate-100 flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 text-slate-600" />
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[12px] font-bold flex items-center justify-center">
              DV
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
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
      <Zap className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 leading-tight">Developer</p>
      <p className="text-[11px] text-slate-500 leading-tight">SmartPark API</p>
    </div>
  </div>
);

const SidebarLink = ({ item }: { item: NavItem }) => {
  const { pathname } = useLocation();
  const active =
    item.to === "/developer"
      ? pathname === "/developer"
      : pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <NavLink
      to={item.to}
      end={item.to === "/developer"}
      className={cn(
        "relative flex items-center gap-2.5 mx-2 my-0.5 px-3 py-2 rounded-lg text-[13px] transition-all",
        active
          ? "bg-violet-50 text-violet-700 font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:translate-x-0.5",
      )}
    >
      {active && (
        <motion.span
          layoutId="developer-nav-active"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-violet-500"
        />
      )}
      <item.icon className={cn("w-4 h-4 shrink-0", active && "text-violet-600")} />
      <span className="truncate">{item.label}</span>
      <span className="ml-auto text-[10px] text-slate-400 font-mono">
        {item.screenId}
      </span>
    </NavLink>
  );
};

// ---------- Reusable primitives ----------

export const DevPageBody = ({
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

export const DevSection = ({
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

export const DevKpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 26 }}
    whileHover={{ y: -2, boxShadow: "0 12px 32px -12px rgba(15,23,42,0.18)" }}
    className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow"
  >
    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
      {label}
    </p>
    <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
  </motion.div>
);

export const DevLoading = () => (
  <div className="p-6 space-y-3">
    <div className="h-8 bg-slate-100 rounded animate-pulse" />
    <div className="h-24 bg-slate-100 rounded animate-pulse" />
  </div>
);

export const DevEmpty = ({ title, body }: { title: string; body: string }) => (
  <div className="text-center py-12 px-6">
    <p className="text-[14px] font-semibold text-slate-800">{title}</p>
    <p className="mt-1 text-[12px] text-slate-500 max-w-sm mx-auto">{body}</p>
  </div>
);
