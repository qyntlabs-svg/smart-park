// Desktop-first console layout for Admin screens (A-03..A-14).
// Left rail nav + main content. Collapses to a top drawer on tablet/mobile
// so ops can still triage from a phone in the field.

import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Building2,
  Users,
  AlertOctagon,
  Banknote,
  Activity,
  ShieldAlert,
  Flag,
  Percent,
  MessageSquare,
  Download,
  KeyRound,
  LayoutDashboard,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "@/api/auth";

interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  section: "Overview" | "Trust & Safety" | "Ops" | "Directory" | "Config";
}

const NAV: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, section: "Overview" },
  { label: "Approvals", to: "/admin/approvals", icon: ClipboardCheck, section: "Trust & Safety" },
  { label: "Disputes & Refunds", to: "/admin/disputes", icon: AlertOctagon, section: "Trust & Safety" },
  { label: "Fraud & Risk", to: "/admin/fraud", icon: ShieldAlert, section: "Trust & Safety" },
  { label: "Admin RBAC", to: "/admin/rbac", icon: KeyRound, section: "Trust & Safety" },
  { label: "Incidents", to: "/admin/incidents", icon: Activity, section: "Ops" },
  { label: "Payouts Ops", to: "/admin/payouts", icon: Banknote, section: "Ops" },
  { label: "Feature Flags", to: "/admin/flags", icon: Flag, section: "Ops" },
  { label: "Providers", to: "/admin/providers", icon: Building2, section: "Directory" },
  { label: "Consumers", to: "/admin/consumers", icon: Users, section: "Directory" },
  { label: "Platform Pricing", to: "/admin/pricing-rules", icon: Percent, section: "Config" },
  { label: "Mobile-mechanic Pricing", to: "/admin/mobile-pricing", icon: Wrench, section: "Config" },
  { label: "Notification Templates", to: "/admin/notifications-templates", icon: MessageSquare, section: "Config" },
  { label: "Data Exports & Audits", to: "/admin/exports", icon: Download, section: "Config" },
];

const SECTION_ORDER: AdminNavItem["section"][] = [
  "Overview",
  "Trust & Safety",
  "Ops",
  "Directory",
  "Config",
];

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const AdminLayout = ({ title, subtitle, action, children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open — matches SideDrawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Close on Escape for a11y parity with Sheet/Drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const doLogout = async () => {
    await logout.mutateAsync().catch(() => {});
    window.location.href = "/role-select";
  };

  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: NAV.filter((n) => n.section === section),
  }));

  const NavRail = (
    <>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-body font-bold text-foreground truncate">
            SmartPark Admin
          </p>
          <p className="text-caption text-muted-foreground">Ops console</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {grouped.map(({ section, items }) => (
          <div key={section} className="px-3 pb-3">
            <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {section}
            </p>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary hover:translate-x-0.5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="admin-nav-active"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                      />
                    )}
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={doLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm font-semibold text-destructive hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-background flex">
      {/* Desktop rail */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-card border-r border-border sticky top-0 h-[100dvh]">
        {NavRail}
      </aside>

      {/* Mobile drawer — mirrors src/components/SideDrawer.tsx pattern */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="admin-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="admin-drawer-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-card z-50 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-10 touch-target flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              {NavRail}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 lg:h-16 flex items-center gap-3 px-4 lg:px-8 border-b border-border bg-card sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden touch-target flex items-center justify-center -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-heading-sm lg:text-heading-md font-bold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-caption text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="hidden lg:flex text-caption text-muted-foreground hover:text-foreground"
          >
            ↩ Home
          </button>
        </header>
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
