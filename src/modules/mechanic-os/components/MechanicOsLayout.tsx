// Desktop-first console shell for the Mechanic OS.
// Sidebar left (persistent on lg+, collapsible drawer on smaller screens),
// main content on the right. Every MOS-* screen mounts inside this shell.

import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ClipboardList,
  Users,
  Boxes,
  FileText,
  Receipt,
  CalendarClock,
  Building2,
  Award,
  ShieldAlert,
  Bell,
  Menu,
  X,
  ArrowLeft,
  Wrench,
} from "lucide-react";
import { getMechanicShop } from "@/modules/mechanic/lib/shops";

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: typeof BarChart3;
}

const NAV: NavItem[] = [
  { key: "home", path: "/mechanic-os", label: "Console", icon: BarChart3 },
  {
    key: "jobs",
    path: "/mechanic-os/jobs",
    label: "Digital Job Cards",
    icon: ClipboardList,
  },
  { key: "customers", path: "/mechanic-os/customers", label: "Customers", icon: Users },
  { key: "inventory", path: "/mechanic-os/inventory", label: "Inventory", icon: Boxes },
  { key: "estimates", path: "/mechanic-os/estimates", label: "Estimates", icon: FileText },
  { key: "invoices", path: "/mechanic-os/invoices", label: "Invoices", icon: Receipt },
  {
    key: "scheduler",
    path: "/mechanic-os/scheduler",
    label: "Bay Scheduler",
    icon: CalendarClock,
  },
  {
    key: "rollup",
    path: "/mechanic-os/rollup",
    label: "Multi-shop Rollup",
    icon: Building2,
  },
  {
    key: "techperf",
    path: "/mechanic-os/tech-perf",
    label: "Tech Performance",
    icon: Award,
  },
  {
    key: "recalls",
    path: "/mechanic-os/recalls",
    label: "Warranty & Recall",
    icon: ShieldAlert,
  },
  {
    key: "reminders",
    path: "/mechanic-os/reminders",
    label: "Loyalty & Reminders",
    icon: Bell,
  },
];

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const MechanicOsLayout = ({ title, subtitle, actions, children }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const shop = getMechanicShop();

  const isActive = (item: NavItem) =>
    item.path === "/mechanic-os"
      ? pathname === "/mechanic-os"
      : pathname.startsWith(item.path);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-card border-r border-border">
        <SidebarInner
          NAV={NAV}
          isActive={isActive}
          shopName={shop?.shopName ?? "Mechanic OS"}
        />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between">
              <p className="font-bold text-body">Mechanic OS</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarInner
              NAV={NAV}
              isActive={isActive}
              shopName={shop?.shopName ?? "Mechanic OS"}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64 min-h-[100dvh] flex flex-col">
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="h-16 px-4 lg:px-8 flex items-center gap-3">
            <button
              className="lg:hidden touch-target"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/mechanic/dashboard")}
              className="hidden lg:flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
              aria-label="Back to mobile app"
            >
              <ArrowLeft className="w-4 h-4" /> Mobile app
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-caption text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarInner = ({
  NAV,
  isActive,
  shopName,
  onNavigate,
}: {
  NAV: NavItem[];
  isActive: (item: NavItem) => boolean;
  shopName: string;
  onNavigate?: () => void;
}) => (
  <>
    <div className="p-5 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-caption text-muted-foreground">Console</p>
          <p className="text-body-sm font-bold truncate">{shopName}</p>
        </div>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.key}
            to={item.path}
            onClick={onNavigate}
            className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm transition-all ${
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-0.5"
            }`}
          >
            {active && (
              <motion.span
                layoutId="mos-nav-active"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
              />
            )}
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
    <div className="p-3 border-t border-border">
      <p className="text-caption text-muted-foreground">
        SmartPark Mechanic OS · v0.1
      </p>
    </div>
  </>
);

export default MechanicOsLayout;
