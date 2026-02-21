import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ScanLine, Car, Clock, CheckCircle2, LogOut, Store,
  Settings2, Download, QrCode, TrendingUp, Calendar
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const MOCK_ACTIVE = [
  { id: "BK003", vehicle: "TN 01 AB 1234", slot: "A-08", entryTime: "10:30 AM", elapsed: "1h 45m" },
  { id: "BK004", vehicle: "KA 05 CD 5678", slot: "B-02", entryTime: "11:15 AM", elapsed: "1h 00m" },
  { id: "BK007", vehicle: "TN 09 GH 3344", slot: "A-15", entryTime: "12:00 PM", elapsed: "0h 15m" },
];

const MOCK_COMPLETED = [
  { id: "BK001", vehicle: "TN 01 AB 1234", slot: "A-12", entryTime: "8:00 AM", exitTime: "10:15 AM", duration: "2h 15m", charge: 90 },
  { id: "BK002", vehicle: "TN 22 XY 9999", slot: "C-04", entryTime: "9:00 AM", exitTime: "10:30 AM", duration: "1h 30m", charge: 60 },
  { id: "BK005", vehicle: "KA 01 AB 7777", slot: "B-09", entryTime: "7:30 AM", exitTime: "9:00 AM", duration: "1h 30m", charge: 60 },
  { id: "BK006", vehicle: "TN 11 ZZ 1122", slot: "A-03", entryTime: "6:00 AM", exitTime: "8:45 AM", duration: "2h 45m", charge: 120 },
];

const TOTAL_SLOTS = 20;

const VendorDashboardScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "completed" | "earnings">("active");

  const occupiedSlots = MOCK_ACTIVE.length;
  const availableSlots = TOTAL_SLOTS - occupiedSlots;
  const todayRevenue = MOCK_COMPLETED.reduce((s, c) => s + c.charge, 0);
  const occupancyPct = Math.round((occupiedSlots / TOTAL_SLOTS) * 100);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-success" />
          <span className="text-body font-bold text-foreground">Vendor Panel</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/vendor/setup")}
            className="touch-target flex items-center justify-center"
          >
            <Settings2 className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("vendorLoggedIn");
              navigate("/role-select", { replace: true });
            }}
            className="touch-target flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Scan button */}
      <div className="px-4 pt-4">
        <MobileButton
          fullWidth
          variant="success"
          onClick={() => navigate("/vendor/scan")}
          className="gap-3"
        >
          <ScanLine className="w-6 h-6" />
          Scan QR Code
        </MobileButton>
      </div>

      {/* Live Occupancy Bar */}
      <div className="px-4 pt-4">
        <div className="p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Live Occupancy</span>
            <span className="text-body-sm font-bold text-foreground">{occupancyPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${occupancyPct > 80 ? "bg-destructive" : occupancyPct > 50 ? "bg-warning" : "bg-success"}`}
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-caption text-success font-semibold">{availableSlots} available</span>
            <span className="text-caption text-muted-foreground">{occupiedSlots}/{TOTAL_SLOTS} occupied</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-3 flex gap-3">
        {[
          { label: "Active", value: MOCK_ACTIVE.length, color: "text-success" },
          { label: "Today", value: MOCK_ACTIVE.length + MOCK_COMPLETED.length, color: "text-primary" },
          { label: "Revenue", value: `₹${todayRevenue}`, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="flex-1 p-3 bg-card border border-border rounded-2xl text-center">
            <p className={`text-heading-sm ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-3 flex bg-secondary rounded-xl p-1">
        {(["active", "completed", "earnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-caption font-semibold transition-all ${
              tab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {t === "active" ? "Active" : t === "completed" ? "History" : "Earnings"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
        {tab === "active" &&
          MOCK_ACTIVE.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-card border border-border rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm font-bold text-foreground">{s.vehicle}</p>
                  <p className="text-caption text-muted-foreground">Slot {s.slot}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm font-bold text-foreground">{s.elapsed}</p>
                  <p className="text-caption text-muted-foreground">since {s.entryTime}</p>
                </div>
              </div>
            </motion.div>
          ))}

        {tab === "completed" && (
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-caption font-semibold text-muted-foreground">Today's Sessions</span>
              <button className="flex items-center gap-1 text-caption text-primary font-semibold">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
            {MOCK_COMPLETED.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-card border border-border rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-bold text-foreground">{s.vehicle}</p>
                    <p className="text-caption text-muted-foreground">
                      Slot {s.slot} · {s.entryTime} → {s.exitTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm font-bold text-foreground">₹{s.charge}</p>
                    <p className="text-caption text-muted-foreground">{s.duration}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {tab === "earnings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Earnings Summary */}
            <div className="p-5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-body font-bold text-foreground">Earnings Summary</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Today", amount: todayRevenue, sessions: MOCK_COMPLETED.length },
                  { label: "This Week", amount: todayRevenue * 5, sessions: MOCK_COMPLETED.length * 5 },
                  { label: "This Month", amount: todayRevenue * 22, sessions: MOCK_COMPLETED.length * 22 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-body-sm font-semibold text-foreground">{row.label}</p>
                      <p className="text-caption text-muted-foreground">{row.sessions} sessions</p>
                    </div>
                    <p className="text-body font-bold text-success">₹{row.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-3">
              <button className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl">
                <QrCode className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">QR Codes</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl">
                <Download className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">Daily Log</span>
              </button>
              <button className="flex-1 flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl">
                <Calendar className="w-6 h-6 text-primary" />
                <span className="text-caption font-semibold text-foreground">Reports</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboardScreen;
