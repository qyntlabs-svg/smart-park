import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePartnerDailyLog } from "@/api/partner";

const PartnerDailyLogScreen = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const today = new Date().toISOString().split("T")[0];
  const { data: log, isLoading } = usePartnerDailyLog(today);

  const entries: any[] = log?.entries ?? [];
  const summary = log?.summary ?? {
    total_sessions: 0,
    active: 0,
    completed: 0,
    total_revenue: 0,
  };

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.status === filter);

  const handleExport = () => {
    if (!entries.length) {
      toast.error("No data to export");
      return;
    }
    const csv = [
      "ID,Vehicle,Slot,Entry,Exit,Amount,Payment,Status",
      ...entries.map((e) =>
        [
          e.booking_reference ?? e.id,
          e.vehicle_registration ?? "—",
          e.slot_number ?? "—",
          e.actual_entry_time
            ? new Date(e.actual_entry_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          e.actual_exit_time
            ? new Date(e.actual_exit_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          `₹${e.total_amount ?? 0}`,
          e.payment_status ?? "—",
          e.status,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `DailyLog-${today}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Daily log exported as CSV");
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
        <div className="text-center">
          <h1 className="text-body font-bold text-foreground">Daily Log</h1>
          <p className="text-caption text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="touch-target flex items-center justify-center"
        >
          <Download className="w-5 h-5 text-primary" />
        </button>
      </header>

      {/* Summary */}
      <div className="px-4 pt-4 flex gap-3">
        {[
          {
            label: "Total",
            value: summary.total_sessions,
            color: "text-primary",
          },
          { label: "Active", value: summary.active, color: "text-success" },
          {
            label: "Revenue",
            value: `₹${summary.total_revenue}`,
            color: "text-warning",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 p-3 bg-card border border-border rounded-2xl text-center"
          >
            <p className={`text-heading-sm ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${filter === f ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <XCircle className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-body-sm text-muted-foreground">
              No {filter === "all" ? "" : filter} sessions today
            </p>
          </div>
        ) : (
          filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 bg-card border border-border rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.status === "active" ? "bg-success/10" : "bg-secondary"}`}
                >
                  {e.status === "active" ? (
                    <Clock className="w-5 h-5 text-success" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold text-foreground truncate">
                    {e.vehicle_registration ?? "Vehicle"}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Slot {e.slot_number ?? "—"} · {e.booking_reference ?? e.id}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {e.status === "completed" ? (
                    <>
                      <p className="text-body-sm font-bold text-foreground">
                        ₹{e.total_amount ?? 0}
                      </p>
                      <p className="text-caption text-muted-foreground capitalize">
                        {e.payment_status}
                      </p>
                    </>
                  ) : (
                    <span className="text-caption font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-caption text-muted-foreground">
                  Entry:{" "}
                  {e.actual_entry_time
                    ? new Date(e.actual_entry_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
                {e.status === "completed" && e.actual_exit_time ? (
                  <span className="text-caption text-muted-foreground">
                    Exit:{" "}
                    {new Date(e.actual_exit_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-caption text-success font-semibold">
                    In progress
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartnerDailyLogScreen;
