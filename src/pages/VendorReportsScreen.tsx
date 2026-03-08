import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Download } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";

const WEEKLY_DATA = [
  { day: "Mon", revenue: 820, sessions: 18 },
  { day: "Tue", revenue: 960, sessions: 22 },
  { day: "Wed", revenue: 1100, sessions: 25 },
  { day: "Thu", revenue: 740, sessions: 16 },
  { day: "Fri", revenue: 1340, sessions: 30 },
  { day: "Sat", revenue: 1680, sessions: 38 },
  { day: "Sun", revenue: 1200, sessions: 27 },
];

const MONTHLY_SUMMARY = {
  totalRevenue: 52400,
  totalSessions: 1180,
  avgPerSession: 44,
  peakDay: "Saturday",
  peakHour: "10 AM - 12 PM",
  occupancyAvg: 68,
  cashPct: 35,
  upiPct: 65,
};

const VendorReportsScreen = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const maxRevenue = Math.max(...WEEKLY_DATA.map((d) => d.revenue));

  const handleExport = () => {
    toast.success("Report exported as PDF");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-body font-bold text-foreground">Reports</h1>
        <button onClick={handleExport} className="touch-target flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </button>
      </header>

      {/* Period toggle */}
      <div className="mx-4 mt-4 flex bg-secondary rounded-xl p-1">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${
              period === p ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 space-y-4 overflow-y-auto scrollbar-hide">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-body-sm font-bold text-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-caption font-semibold text-success">+12%</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-[120px]">
            {WEEKLY_DATA.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-foreground">₹{d.revenue}</span>
                <div
                  className="w-full rounded-t-lg bg-primary/80 transition-all"
                  style={{ height: `${(d.revenue / maxRevenue) * 80}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Revenue", value: `₹${MONTHLY_SUMMARY.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-success" },
            { label: "Total Sessions", value: MONTHLY_SUMMARY.totalSessions.toString(), icon: Calendar, color: "text-primary" },
            { label: "Avg / Session", value: `₹${MONTHLY_SUMMARY.avgPerSession}`, icon: BarChart3, color: "text-warning" },
            { label: "Avg Occupancy", value: `${MONTHLY_SUMMARY.occupancyAvg}%`, icon: PieChart, color: "text-primary" },
          ].map((m) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-card border border-border rounded-2xl"
            >
              <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
              <p className={`text-heading-sm ${m.color}`}>{m.value}</p>
              <p className="text-caption text-muted-foreground mt-0.5">{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Insights */}
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
          <p className="text-body-sm font-bold text-foreground">Insights</p>
          {[
            { label: "Peak Day", value: MONTHLY_SUMMARY.peakDay },
            { label: "Peak Hours", value: MONTHLY_SUMMARY.peakHour },
            { label: "UPI Payments", value: `${MONTHLY_SUMMARY.upiPct}%` },
            { label: "Cash Payments", value: `${MONTHLY_SUMMARY.cashPct}%` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="text-caption text-muted-foreground">{row.label}</span>
              <span className="text-body-sm font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Payment split bar */}
        <div className="p-4 bg-card border border-border rounded-2xl">
          <p className="text-body-sm font-bold text-foreground mb-3">Payment Methods</p>
          <div className="h-4 rounded-full overflow-hidden flex">
            <div className="bg-primary h-full" style={{ width: `${MONTHLY_SUMMARY.upiPct}%` }} />
            <div className="bg-warning h-full" style={{ width: `${MONTHLY_SUMMARY.cashPct}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-caption text-primary font-semibold">UPI {MONTHLY_SUMMARY.upiPct}%</span>
            <span className="text-caption text-warning font-semibold">Cash {MONTHLY_SUMMARY.cashPct}%</span>
          </div>
        </div>

        <MobileButton fullWidth variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export Full Report
        </MobileButton>
      </div>
    </div>
  );
};

export default VendorReportsScreen;
