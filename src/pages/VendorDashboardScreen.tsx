import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanLine, Car, Clock, CheckCircle2, LogOut, Store } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const MOCK_ACTIVE = [
  { id: "BK003", vehicle: "TN 01 AB 1234", slot: "A-08", entryTime: "10:30 AM", elapsed: "1h 45m" },
  { id: "BK004", vehicle: "KA 05 CD 5678", slot: "B-02", entryTime: "11:15 AM", elapsed: "1h 00m" },
];

const MOCK_COMPLETED = [
  { id: "BK001", vehicle: "TN 01 AB 1234", slot: "A-12", entryTime: "8:00 AM", exitTime: "10:15 AM", duration: "2h 15m", charge: 90 },
  { id: "BK002", vehicle: "TN 22 XY 9999", slot: "C-04", entryTime: "9:00 AM", exitTime: "10:30 AM", duration: "1h 30m", charge: 60 },
];

const VendorDashboardScreen = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "completed">("active");

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-[60px] px-4 pt-safe bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-success" />
          <span className="text-body font-bold text-foreground">Vendor Panel</span>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("vendorLoggedIn");
            navigate("/role-select", { replace: true });
          }}
          className="touch-target flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
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

      {/* Stats */}
      <div className="px-4 pt-4 flex gap-3">
        {[
          { label: "Active", value: MOCK_ACTIVE.length, color: "text-success" },
          { label: "Today", value: MOCK_ACTIVE.length + MOCK_COMPLETED.length, color: "text-primary" },
          { label: "Revenue", value: `₹${MOCK_COMPLETED.reduce((s, c) => s + c.charge, 0)}`, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="flex-1 p-4 bg-card border border-border rounded-2xl text-center">
            <p className={`text-heading-sm ${s.color}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-4 flex bg-secondary rounded-xl p-1">
        {(["active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-body-sm font-semibold transition-all ${
              tab === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
            }`}
          >
            {t === "active" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {tab === "active"
          ? MOCK_ACTIVE.map((s, i) => (
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
            ))
          : MOCK_COMPLETED.map((s, i) => (
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
                    <p className="text-caption text-muted-foreground">Slot {s.slot} · {s.duration}</p>
                  </div>
                  <p className="text-body-sm font-bold text-foreground">₹{s.charge}</p>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
};

export default VendorDashboardScreen;
