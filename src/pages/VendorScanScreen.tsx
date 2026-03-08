import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, LogIn, LogOut, Camera, XCircle, AlertTriangle, Clock, Banknote } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

type ScanStatus = "scanning" | "success-entry" | "success-exit-paid" | "success-exit-unpaid" | "overstay" | "invalid";

type ScanResult = {
  status: ScanStatus;
  id?: string;
  slot?: string;
  vehicle?: string;
  parking?: string;
  duration?: string;
  charge?: number;
  overstayDuration?: string;
  penalty?: number;
  totalDue?: number;
  paymentMethod?: string;
  errorMessage?: string;
};

const MOCK_SCENARIOS: ScanResult[] = [
  {
    status: "success-entry",
    id: "BK003",
    slot: "A-08",
    vehicle: "TN 01 AB 1234",
    parking: "Phoenix Mall Parking",
    paymentMethod: "UPI",
  },
  {
    status: "success-exit-paid",
    id: "BK004",
    slot: "B-12",
    vehicle: "KA 05 CD 5678",
    parking: "Phoenix Mall Parking",
    duration: "1h 45m",
    charge: 80,
    paymentMethod: "UPI",
  },
  {
    status: "success-exit-unpaid",
    id: "BK005",
    slot: "A-03",
    vehicle: "TN 09 EF 9012",
    parking: "Phoenix Mall Parking",
    duration: "2h 00m",
    charge: 80,
    paymentMethod: "Cash",
  },
  {
    status: "overstay",
    id: "BK006",
    slot: "C-15",
    vehicle: "MH 02 GH 3456",
    parking: "Phoenix Mall Parking",
    duration: "4h 30m",
    charge: 80,
    overstayDuration: "2h 30m",
    penalty: 125,
    totalDue: 205,
    paymentMethod: "Cash",
  },
  {
    status: "invalid",
    errorMessage: "This QR code is not recognized. It may be expired, damaged, or not from this parking facility.",
  },
];

const VendorScanScreen = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const simulateScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_SCENARIOS[scenarioIndex % MOCK_SCENARIOS.length]);
      setScenarioIndex((prev) => prev + 1);
      setScanning(false);
    }, 3000);
  };

  useEffect(() => {
    simulateScan();
  }, []);

  const getStatusConfig = (status: ScanStatus) => {
    switch (status) {
      case "success-entry":
        return { icon: LogIn, color: "text-success", bg: "bg-success/10", label: "Vehicle Entry", badge: "Entry" };
      case "success-exit-paid":
        return { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Exit – Fully Paid", badge: "Paid" };
      case "success-exit-unpaid":
        return { icon: Banknote, color: "text-warning", bg: "bg-warning/10", label: "Exit – Payment Due", badge: "Unpaid" };
      case "overstay":
        return { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Overstay – Fine Due", badge: "Overstay" };
      case "invalid":
        return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Invalid QR Code", badge: "Error" };
      default:
        return { icon: Camera, color: "text-muted-foreground", bg: "bg-muted", label: "Scanning", badge: "" };
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/vendor/dashboard")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Scan QR Code</h1>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 overflow-y-auto scrollbar-hide">
        {/* Camera viewport mock */}
        <div className="relative w-full aspect-square max-w-[280px] bg-foreground/5 rounded-3xl overflow-hidden border-2 border-border flex items-center justify-center">
          <Camera className="w-16 h-16 text-muted-foreground/20" />
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[180px] h-[180px] border-2 border-primary rounded-2xl relative">
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-primary"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          )}
          {scanning && (
            <>
              <div className="absolute top-6 left-6 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg" />
            </>
          )}
        </div>

        {scanning && <p className="mt-4 text-body-sm text-muted-foreground">Point camera at consumer's QR code</p>}

        {/* Scan result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 w-full pb-6"
            >
              {/* Invalid QR */}
              {result.status === "invalid" ? (
                <div className="p-5 bg-card border-2 border-destructive/30 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-heading-sm text-destructive">Invalid QR Code</p>
                      <p className="text-caption text-muted-foreground">Could not verify</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-muted-foreground mb-4">{result.errorMessage}</p>
                  <MobileButton fullWidth variant="outline" onClick={simulateScan}>
                    Try Again
                  </MobileButton>
                </div>
              ) : (
                <div className="p-5 bg-card border border-border rounded-2xl">
                  {/* Header */}
                  {(() => {
                    const config = getStatusConfig(result.status);
                    const Icon = config.icon;
                    return (
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-heading-sm text-foreground">{config.label}</p>
                          <p className="text-body-sm text-muted-foreground">{result.vehicle}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-caption font-bold ${config.bg} ${config.color}`}>
                          {config.badge}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Details */}
                  <div className="space-y-2">
                    {[
                      ["Booking ID", result.id],
                      ["Slot", result.slot],
                      ["Payment", result.paymentMethod],
                      ...(result.duration ? [["Duration", result.duration]] : []),
                      ...(result.charge ? [["Base Charge", `₹${result.charge}`]] : []),
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-body-sm text-muted-foreground">{label}</span>
                          <span className="text-body-sm font-semibold text-foreground">{value}</span>
                        </div>
                      ))}
                  </div>

                  {/* Overstay penalty section */}
                  {result.status === "overstay" && (
                    <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-destructive" />
                        <p className="text-body-sm font-bold text-destructive">Overstay Fine</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-caption text-muted-foreground">Overstay Duration</span>
                          <span className="text-caption font-bold text-destructive">{result.overstayDuration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-caption text-muted-foreground">Penalty</span>
                          <span className="text-caption font-bold text-destructive">₹{result.penalty}</span>
                        </div>
                        <div className="flex justify-between border-t border-destructive/20 pt-1.5">
                          <span className="text-body-sm font-bold text-foreground">Total Due</span>
                          <span className="text-body-sm font-extrabold text-destructive">₹{result.totalDue}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unpaid notice */}
                  {result.status === "success-exit-unpaid" && (
                    <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-warning" />
                        <p className="text-body-sm font-bold text-warning">Cash Payment Pending</p>
                      </div>
                      <p className="mt-1 text-caption text-muted-foreground">Collect ₹{result.charge} in cash before allowing exit.</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4">
                    {result.status === "success-entry" && (
                      <MobileButton fullWidth variant="success" onClick={() => navigate("/vendor/dashboard", { replace: true })}>
                        <CheckCircle2 className="w-5 h-5" /> Confirm Entry
                      </MobileButton>
                    )}
                    {result.status === "success-exit-paid" && (
                      <MobileButton fullWidth variant="success" onClick={() => navigate("/vendor/dashboard", { replace: true })}>
                        <CheckCircle2 className="w-5 h-5" /> Confirm Exit
                      </MobileButton>
                    )}
                    {result.status === "success-exit-unpaid" && (
                      <MobileButton fullWidth variant="primary" onClick={() => navigate("/vendor/dashboard", { replace: true })}>
                        <Banknote className="w-5 h-5" /> Mark Cash Collected & Exit
                      </MobileButton>
                    )}
                    {result.status === "overstay" && (
                      <div className="space-y-2">
                        <MobileButton fullWidth variant="destructive" onClick={() => navigate("/vendor/dashboard", { replace: true })}>
                          <AlertTriangle className="w-5 h-5" /> Collect ₹{result.totalDue} & Allow Exit
                        </MobileButton>
                      </div>
                    )}
                  </div>

                  <button onClick={simulateScan} className="mt-3 w-full text-center text-body-sm text-primary font-semibold">
                    Scan Another
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorScanScreen;
