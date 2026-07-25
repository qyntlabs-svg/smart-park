// Screen: shared · Primitives: (frame only)
//
// Desktop-first Bloomberg-pattern chrome for the Mobility Intelligence
// console: dark, dense, tabular. Left nav + top filter bar.

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Flame,
  Building2,
  LineChart,
  DollarSign,
  Users,
  Award,
  Download,
  ArrowLeft,
} from "lucide-react";
import type { DateRange, IntelCity } from "../types";
import { CITY_LABEL, DATE_RANGE_LABEL } from "../types";

const NAV = [
  { to: "/intel", label: "Overview", icon: BarChart3, end: true },
  { to: "/intel/heatmap", label: "Heatmap", icon: Flame },
  { to: "/intel/gaps", label: "Gap map", icon: Building2 },
  { to: "/intel/forecasts", label: "Forecasts", icon: LineChart },
  { to: "/intel/elasticity", label: "Elasticity", icon: DollarSign },
  { to: "/intel/cohorts", label: "Cohorts", icon: Users },
  { to: "/intel/benchmarks", label: "Benchmarks", icon: Award },
  { to: "/intel/export", label: "Export & API", icon: Download },
];

export const IntelLayout = ({
  title,
  subtitle,
  city,
  onCityChange,
  range,
  onRangeChange,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  city?: IntelCity | "all";
  onCityChange?: (c: IntelCity | "all") => void;
  range?: DateRange;
  onRangeChange?: (r: DateRange) => void;
  right?: ReactNode;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <div className="min-h-[100dvh] bg-[#0a0f1c] text-slate-100 flex">
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-slate-800 bg-slate-950/70">
        <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-800">
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-amber-400"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.25, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-wide">
              MOBILITY INTEL
            </span>
            <span className="text-[10px] text-slate-400">
              Analytics · Bloomberg-pattern
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
                className={`relative flex items-center gap-2 rounded px-3 py-2 text-[12px] transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-200"
                    : "text-slate-300 hover:bg-slate-800/70 hover:translate-x-0.5"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="intel-nav-active"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-400"
                  />
                )}
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500">
          Terminal · v0.1
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-950/40 backdrop-blur flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded hover:bg-slate-800"
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

          <div className="flex items-center gap-2">
            {onCityChange && city !== undefined ? (
              <select
                value={city}
                onChange={(e) =>
                  onCityChange(e.target.value as IntelCity | "all")
                }
                className="rounded bg-slate-900 border border-slate-700 text-[12px] px-2 py-1"
              >
                <option value="all">All cities</option>
                {(
                  ["chennai", "bengaluru", "hyderabad", "mumbai"] as IntelCity[]
                ).map((c) => (
                  <option key={c} value={c}>
                    {CITY_LABEL[c]}
                  </option>
                ))}
              </select>
            ) : null}
            {onRangeChange && range ? (
              <div className="rounded border border-slate-700 bg-slate-900 flex">
                {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRangeChange(r)}
                    className={`px-2.5 py-1 text-[11px] transition-colors ${
                      range === r
                        ? "bg-amber-500/20 text-amber-200"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                    title={DATE_RANGE_LABEL[r]}
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : null}
            {right}
          </div>
        </header>

        <div className="flex-1 min-w-0 overflow-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// ── shared bits ───────────────────────────────────────────────────────

export const IntelCard = ({
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
    className={`rounded-lg border border-slate-800 bg-slate-950/60 ${className}`}
  >
    {title || action ? (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        {title ? (
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
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

export const IntelKpi = ({
  label,
  value,
  hint,
  tone = "text-slate-100",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 26 }}
    whileHover={{ y: -2, borderColor: "rgba(251,191,36,0.4)" }}
    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition-shadow"
  >
    <div className="text-[10px] uppercase tracking-wider text-slate-400">
      {label}
    </div>
    <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>
      {value}
    </div>
    {hint ? (
      <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>
    ) : null}
  </motion.div>
);

export const IntelLoading = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const IntelError = ({ msg }: { msg: string }) => (
  <div className="rounded border border-rose-500/40 bg-rose-500/10 text-rose-200 text-[13px] p-4">
    {msg}
  </div>
);

export const IntelEmpty = ({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) => (
  <div className="text-center py-10">
    <div className="text-[13px] font-semibold">{title}</div>
    {hint ? (
      <div className="text-[12px] text-slate-400 mt-1">{hint}</div>
    ) : null}
  </div>
);
