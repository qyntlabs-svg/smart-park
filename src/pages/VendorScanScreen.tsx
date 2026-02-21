import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ScanLine, CheckCircle2, LogIn, LogOut, Camera } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

type ScanResult = {
  id: string;
  slot: string;
  vehicle: string;
  parking: string;
  action: "entry" | "exit";
  duration?: string;
  charge?: number;
};

const VendorScanScreen = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);

  // Simulate a scan after 3 seconds
  const simulateScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      // Randomly simulate entry or exit
      const isExit = Math.random() > 0.5;
      setResult({
        id: "BK003",
        slot: "A-08",
        vehicle: "TN 01 AB 1234",
        parking: "Phoenix Mall Parking",
        action: isExit ? "exit" : "entry",
        duration: isExit ? "2h 15m" : undefined,
        charge: isExit ? 90 : undefined,
      });
      setScanning(false);
    }, 3000);
  };

  // Start initial scan simulation
  useState(() => {
    simulateScan();
  });

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => navigate("/vendor/dashboard")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Scan QR Code</h1>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        {/* Camera viewport mock */}
        <div className="relative w-full aspect-square max-w-[300px] bg-foreground/5 rounded-3xl overflow-hidden border-2 border-border flex items-center justify-center">
          <Camera className="w-16 h-16 text-muted-foreground/20" />

          {/* Scanning overlay */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[200px] h-[200px] border-2 border-primary rounded-2xl relative">
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-primary"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          )}

          {/* Corner markers */}
          {scanning && (
            <>
              <div className="absolute top-6 left-6 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg" />
            </>
          )}
        </div>

        {scanning && (
          <p className="mt-4 text-body-sm text-muted-foreground">Point camera at consumer's QR code</p>
        )}

        {/* Scan result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 w-full p-5 bg-card border border-border rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  result.action === "entry" ? "bg-success/10" : "bg-primary/10"
                }`}>
                  {result.action === "entry" ? (
                    <LogIn className="w-6 h-6 text-success" />
                  ) : (
                    <LogOut className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-heading-sm text-foreground">
                    {result.action === "entry" ? "Vehicle Entry" : "Vehicle Exit"}
                  </p>
                  <p className="text-body-sm text-muted-foreground">{result.vehicle}</p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  ["Booking ID", result.id],
                  ["Slot", result.slot],
                  ...(result.duration ? [["Duration", result.duration]] : []),
                  ...(result.charge ? [["Charge", `₹${result.charge}`]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">{label}</span>
                    <span className="text-body-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <MobileButton
                  fullWidth
                  variant={result.action === "entry" ? "success" : "primary"}
                  onClick={() => {
                    // Confirmed – go back to dashboard
                    navigate("/vendor/dashboard", { replace: true });
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm {result.action === "entry" ? "Entry" : "Exit"}
                </MobileButton>
              </div>

              <button
                onClick={simulateScan}
                className="mt-3 w-full text-center text-body-sm text-primary font-semibold"
              >
                Scan Another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorScanScreen;
