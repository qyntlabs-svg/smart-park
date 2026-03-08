import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Car, Clock, CheckCircle2, Filter } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { toast } from "sonner";

const MOCK_LOG = [
  { id: "BK001", vehicle: "TN 01 AB 1234", slot: "A-12", entry: "06:00 AM", exit: "08:15 AM", duration: "2h 15m", charge: 90, method: "UPI", status: "completed" },
  { id: "BK002", vehicle: "TN 22 XY 9999", slot: "C-04", entry: "07:30 AM", exit: "09:00 AM", duration: "1h 30m", charge: 60, method: "Cash", status: "completed" },
  { id: "BK003", vehicle: "TN 01 AB 1234", slot: "A-08", entry: "10:30 AM", exit: "-", duration: "-", charge: 0, method: "-", status: "active" },
  { id: "BK004", vehicle: "KA 05 CD 5678", slot: "B-02", entry: "11:15 AM", exit: "-", duration: "-", charge: 0, method: "-", status: "active" },
  { id: "BK005", vehicle: "KA 01 AB 7777", slot: "B-09", entry: "07:30 AM", exit: "09:00 AM", duration: "1h 30m", charge: 60, method: "UPI", status: "completed" },
  { id: "BK006", vehicle: "TN 11 ZZ 1122", slot: "A-03", entry: "06:00 AM", exit: "08:45 AM", duration: "2h 45m", charge: 120, method: "Cash", status: "completed" },
  { id: "BK007", vehicle: "TN 09 GH 3344", slot: "A-15", entry: "12:00 PM", exit: "-", duration: "-", charge: 0, method: "-", status: "active" },
];

const VendorDailyLogScreen = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filtered = filter === "all" ? MOCK_LOG : MOCK_LOG.filter((l) => l.status === filter);
  const totalRevenue = MOCK_LOG.filter((l) => l.status === "completed").reduce((s, l) => s + l.charge, 0);
  const totalSessions = MOCK_LOG.length;
  const activeSessions = MOCK_LOG.filter((l) => l.status === "active").length;

  const handleExport = () => {
    const csv = [
      "ID,Vehicle,Slot,Entry,Exit,Duration,Charge,Payment,Status",
      ...MOCK_LOG.map((l) => `${l.id},${l.vehicle},${l.slot},${l.entry},${l.exit},${l.duration},₹${l.charge},${l.method},${l.status}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `DailyLog-${new Date().toISOString().split("T")[0]}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Daily log exported as CSV");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-body font-bold text-foreground">Daily Log</h1>
        <button onClick={handleExport} className="touch-target flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </button>
      </header>

      {/* Summary */}
      <div className="px-4 pt-4 flex gap-3">
        {[
          { label: "Total", value: totalSessions, color: "text-primary" },
          { label: "Active", value: activeSessions, color: "text-success" },
          { label: "Revenue", value: `₹${totalRevenue}`, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="flex-1 p-3 bg-card border border-border rounded-2xl text-center">
            <p className={`text-heading-sm ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${
              filter === f ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {filtered.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 bg-card border border-border rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${l.status === "active" ? "bg-success/10" : "bg-secondary"}`}>
                {l.status === "active" ? <Clock className="w-5 h-5 text-success" /> : <CheckCircle2 className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="text-body-sm font-bold text-foreground">{l.vehicle}</p>
                <p className="text-caption text-muted-foreground">Slot {l.slot} · {l.id}</p>
              </div>
              <div className="text-right">
                {l.status === "completed" ? (
                  <>
                    <p className="text-body-sm font-bold text-foreground">₹{l.charge}</p>
                    <p className="text-caption text-muted-foreground">{l.method}</p>
                  </>
                ) : (
                  <span className="text-caption font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-caption text-muted-foreground">Entry: {l.entry}</span>
              {l.status === "completed" ? (
                <span className="text-caption text-muted-foreground">Exit: {l.exit} · {l.duration}</span>
              ) : (
                <span className="text-caption text-success font-semibold">In progress</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VendorDailyLogScreen;
