import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Loader2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";
import { usePartnerEarnings } from "@/api/partner";

const PartnerReportsScreen = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const { data: earnings, isLoading } = usePartnerEarnings(period);

  const totalRevenue = earnings?.total_revenue ?? 0;
  const totalSessions = earnings?.total_sessions ?? 0;
  const avgPerSession = earnings?.avg_per_session ?? 0;
  const partnerShare = earnings?.partner_share ?? 0;
  const platformFee = earnings?.platform_fee ?? 0;
  const upiPct = earnings?.upi_pct ?? 0;
  const cashPct = earnings?.cash_pct ?? 0;

  const handleExport = () => {
    if (!earnings) {
      toast.error("No data to export");
      return;
    }
    const csv = [
      "Period,Total Revenue,Partner Share,Platform Fee,Sessions,Avg/Session,UPI%,Cash%",
      `${period},${totalRevenue},${partnerShare},${platformFee},${totalSessions},${avgPerSession},${upiPct},${cashPct}`,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `Report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Report exported as CSV");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-body font-bold text-foreground">Reports</h1>
        <button
          onClick={handleExport}
          className="touch-target flex items-center justify-center"
        >
          <Download className="w-5 h-5 text-primary" />
        </button>
      </header>

      {/* Period toggle */}
      <div className="mx-4 mt-4 flex bg-secondary rounded-xl p-1">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${period === p ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
          >
            {p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex-1 px-4 pt-4 pb-8 space-y-4 overflow-y-auto scrollbar-hide">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Total Revenue",
                value: `₹${totalRevenue.toLocaleString()}`,
                icon: TrendingUp,
                color: "text-success",
              },
              {
                label: "Total Sessions",
                value: totalSessions.toString(),
                icon: Calendar,
                color: "text-primary",
              },
              {
                label: "Avg / Session",
                value: `₹${avgPerSession}`,
                icon: BarChart3,
                color: "text-warning",
              },
              {
                label: "Your Earnings",
                value: `₹${partnerShare.toLocaleString()}`,
                icon: PieChart,
                color: "text-primary",
              },
            ].map((m) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-card border border-border rounded-2xl"
              >
                <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
                <p className={`text-heading-sm ${m.color}`}>{m.value}</p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {m.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Revenue breakdown */}
          <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <p className="text-body-sm font-bold text-foreground">
              Revenue Breakdown
            </p>
            {[
              {
                label: "Gross Revenue",
                value: `₹${totalRevenue.toLocaleString()}`,
                color: "text-foreground",
              },
              {
                label: "Platform Fee (10%)",
                value: `-₹${platformFee.toLocaleString()}`,
                color: "text-destructive",
              },
              {
                label: "Your Net Earnings",
                value: `₹${partnerShare.toLocaleString()}`,
                color: "text-success",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-1 border-b border-border last:border-0"
              >
                <span className="text-caption text-muted-foreground">
                  {row.label}
                </span>
                <span className={`text-body-sm font-bold ${row.color}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Payment split */}
          {(upiPct > 0 || cashPct > 0) && (
            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-body-sm font-bold text-foreground mb-3">
                Payment Methods
              </p>
              <div className="h-4 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${upiPct}%` }}
                />
                <div
                  className="bg-warning h-full transition-all"
                  style={{ width: `${cashPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-caption text-primary font-semibold">
                  UPI {upiPct}%
                </span>
                <span className="text-caption text-warning font-semibold">
                  Cash {cashPct}%
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalSessions === 0 && (
            <div className="flex flex-col items-center py-8 gap-2">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-body-sm text-muted-foreground">
                No data for this period
              </p>
              <p className="text-caption text-muted-foreground">
                Revenue will appear here once bookings are paid
              </p>
            </div>
          )}

          <MobileButton fullWidth variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export Report
          </MobileButton>
        </div>
      )}
    </div>
  );
};

export default PartnerReportsScreen;
