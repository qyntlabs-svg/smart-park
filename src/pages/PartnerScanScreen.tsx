import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  LogIn,
  XCircle,
  AlertTriangle,
  Clock,
  Banknote,
  Flashlight,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import {
  usePartnerScan,
  useVerifyBookingManual,
  useConfirmManualScan,
  useConfirmCashExit,
} from "@/api/partner";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

type ScanStatus =
  | "scanning"
  | "success-entry"
  | "success-exit-paid"
  | "success-exit-unpaid"
  | "overstay"
  | "already_used"
  | "invalid";

type ScreenMode =
  | "scanner"
  | "manual-input"
  | "manual-confirm"
  | "cash-confirm"
  | "result";

const getStatusConfig = (status: ScanStatus) => {
  switch (status) {
    case "success-entry":
      return {
        icon: LogIn,
        color: "text-success",
        bg: "bg-success/10",
        label: "Vehicle Entry",
        badge: "Entry",
      };
    case "success-exit-paid":
      return {
        icon: CheckCircle2,
        color: "text-success",
        bg: "bg-success/10",
        label: "Exit – Fully Paid",
        badge: "Paid",
      };
    case "success-exit-unpaid":
      return {
        icon: Banknote,
        color: "text-warning",
        bg: "bg-warning/10",
        label: "Exit – Payment Due",
        badge: "Unpaid",
      };
    case "overstay":
      return {
        icon: AlertTriangle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        label: "Overstay – Fine Due",
        badge: "Overstay",
      };
    case "already_used":
      return {
        icon: XCircle,
        color: "text-warning",
        bg: "bg-warning/10",
        label: "Already Completed",
        badge: "Done",
      };
    case "invalid":
      return {
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
        label: "Invalid QR Code",
        badge: "Error",
      };
    default:
      return {
        icon: Banknote,
        color: "text-muted-foreground",
        bg: "bg-muted",
        label: "Scanning",
        badge: "",
      };
  }
};

const PartnerScanScreen = () => {
  const navigate = useNavigate();
  const isScanning = useRef(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("scanner");
  const [result, setResult] = useState<any | null>(null);
  const [manualBookingData, setManualBookingData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualToggle, setShowManualToggle] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const partnerScan = usePartnerScan();
  const verifyBookingManual = useVerifyBookingManual();
  const confirmManualScan = useConfirmManualScan();
  const confirmCashExit = useConfirmCashExit();

  // Cash exit confirmation data
  const [cashExitData, setCashExitData] = useState<{
    booking_id: string;
    booking_reference: string;
    charge: number;
    penalty: number;
    total: number;
    has_overstay: boolean;
  } | null>(null);

  const cleanupScanner = async () => {
    try {
      await BarcodeScanner.stopScan();
      await BarcodeScanner.showBackground();
      document.body.classList.remove("scanner-active");
      document.documentElement.classList.remove("scanner-active");
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  const startScanning = async () => {
    if (isScanning.current) return;
    isScanning.current = true;

    try {
      setError(null);

      // Step 1: Request permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (!status.granted) {
        setError("Camera permission denied");
        isScanning.current = false;
        return;
      }

      // Step 2: Enable transparent UI
      document.body.classList.add("scanner-active");
      document.documentElement.classList.add("scanner-active");

      // Step 3: Show camera
      await BarcodeScanner.hideBackground();

      // Step 4: Start scan and wait for result
      const scanResult = await BarcodeScanner.startScan();

      // Step 5: Restore UI immediately
      await BarcodeScanner.showBackground();
      document.body.classList.remove("scanner-active");
      document.documentElement.classList.remove("scanner-active");

      // Step 6: Process result
      if (scanResult.hasContent) {
        await processQr(scanResult.content);
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err?.message || "Failed to start scanner");
      await cleanupScanner();
    } finally {
      isScanning.current = false;
    }
  };

  const toggleTorch = async () => {
    if (isScanning.current) return;
    try {
      if (torchEnabled) {
        await BarcodeScanner.disableTorch();
      } else {
        await BarcodeScanner.enableTorch();
      }
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  const processQr = async (decodedText: string) => {
    setIsProcessing(true);
    try {
      const res = await partnerScan.mutateAsync({
        qr_data: decodedText,
        scan_type: "entry", // backend auto-detects; this value is ignored
      });
      await Haptics.impact({ style: ImpactStyle.Medium });

      // Cash booking exit — ask partner to confirm cash collected first
      if (res.result === "pending-cash-exit") {
        setCashExitData(res.data);
        setScreenMode("cash-confirm");
        setIsProcessing(false);
        return;
      }

      setResult(res);
      setScreenMode("result");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || "Scan failed. Try again.",
      );
      setIsProcessing(false);
      // Restart scanner on error
      isScanning.current = false;
      await startScanning();
    }
  };

  const handleManualSubmit = async () => {
    const raw = manualInput.trim();
    if (!raw) return;
    setIsProcessing(true);
    try {
      const data = await verifyBookingManual.mutateAsync(raw);
      setManualBookingData(data.data);
      setScreenMode("manual-confirm");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || "Booking not found. Try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmManualScan = async () => {
    if (!manualBookingData) return;
    setIsProcessing(true);
    try {
      const res = await confirmManualScan.mutateAsync({
        ref: manualBookingData.booking_reference,
        scan_type: manualBookingData.scan_type,
      });
      await Haptics.impact({ style: ImpactStyle.Medium });
      setResult(res);
      setScreenMode("result");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Confirmation failed. Try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashCollected = async () => {
    if (!cashExitData) return;
    setIsProcessing(true);
    try {
      const res = await confirmCashExit.mutateAsync(cashExitData.booking_id);
      await Haptics.impact({ style: ImpactStyle.Medium });
      setResult(res);
      setScreenMode("result");
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Confirmation failed. Try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const rescan = async () => {
    setResult(null);
    setError(null);
    setManualInput("");
    setManualBookingData(null);
    setCashExitData(null);
    setScreenMode("scanner");
    setTorchEnabled(false);
    isScanning.current = false;
    await startScanning();
  };

  useEffect(() => {
    if (screenMode === "scanner") {
      startScanning();
    }
    return () => {
      cleanupScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenMode]);

  const scanResult = result?.result as ScanStatus | undefined;
  const scanData = result?.data ?? {};

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-transparent flex flex-col">
      {/* Scanner View */}
      {screenMode === "scanner" && (
        <>
          {/* Overlay UI on top of camera */}
          <div className="fixed inset-0 flex flex-col z-50 pointer-events-none">
            {/* Header with blur */}
            <header className="flex items-center h-[60px] px-4 pt-safe bg-black/60 backdrop-blur-md pointer-events-auto">
              <button
                onClick={async () => {
                  await cleanupScanner();
                  navigate("/partner/dashboard");
                }}
                className="touch-target flex items-center justify-center"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h1 className="flex-1 text-center text-body font-bold text-white pr-11">
                Scan QR Code
              </h1>
            </header>

            {/* Info pill - auto-detect notice */}
            <div className="px-6 pt-4 pointer-events-none flex justify-center">
              <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                <p className="text-caption text-white/80">
                  Entry or exit is auto-detected
                </p>
              </div>
            </div>

            {/* Scanning Box - Center (CLEAR) */}
            <div className="flex-1 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corner guides */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Scanning line animation */}
                <motion.div
                  animate={{ y: [0, 240] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-primary to-transparent"
                />
              </div>
            </div>

            {/* Bottom Controls with blur */}
            <div className="px-6 pb-8 pb-safe bg-black/60 backdrop-blur-md pointer-events-auto">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={toggleTorch}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-semibold touch-target"
                >
                  <Flashlight className="w-5 h-5" />
                  {torchEnabled ? "Torch On" : "Torch Off"}
                </button>
              </div>

              <button
                onClick={() => setShowManualToggle((v) => !v)}
                className="text-caption text-white/70 underline mx-auto block"
              >
                {showManualToggle
                  ? "Hide manual input"
                  : "Can't scan? Enter booking ID"}
              </button>

              {showManualToggle && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Booking reference..."
                    className="flex-1 bg-white/20 backdrop-blur border border-white/30 rounded-xl px-3 py-2 text-body-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim() || isProcessing}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-body-sm font-semibold disabled:opacity-50"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Error state */}
          {error && !result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-0 left-0 right-0 p-5 bg-card border-t-2 border-destructive/30 z-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-heading-sm text-destructive">Scan Failed</p>
              </div>
              <p className="text-body-sm text-muted-foreground mb-4">{error}</p>
              <MobileButton fullWidth variant="outline" onClick={rescan}>
                <RefreshCw className="w-4 h-4" /> Try Again
              </MobileButton>
            </motion.div>
          )}
        </>
      )}

      {/* Manual confirmation screen */}
      {screenMode === "manual-confirm" && manualBookingData && (
        <div className="min-h-[100dvh] w-full bg-background flex flex-col">
          <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
            <button
              onClick={() => setScreenMode("scanner")}
              className="touch-target flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
              Confirm Booking
            </h1>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-5 bg-card border border-border rounded-2xl"
            >
              <p className="text-heading-sm text-foreground mb-4">
                Confirm Booking
              </p>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Booking ID
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">
                    {manualBookingData.booking_reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Vehicle
                  </span>
                  <span className="text-body-sm font-semibold text-foreground">
                    {manualBookingData.vehicle_registration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">
                    Action
                  </span>
                  <span className="text-body-sm font-semibold text-primary capitalize">
                    {manualBookingData.scan_type}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <MobileButton
                  fullWidth
                  variant="success"
                  onClick={handleConfirmManualScan}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Confirming..."
                    : `Confirm ${manualBookingData.scan_type}`}
                </MobileButton>
                <button
                  onClick={() => setScreenMode("scanner")}
                  className="w-full text-center text-body-sm text-muted-foreground py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Cash exit confirmation screen */}
      {screenMode === "cash-confirm" && cashExitData && (
        <div className="min-h-[100dvh] w-full bg-background flex flex-col">
          <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
            <button
              onClick={() => {
                setCashExitData(null);
                rescan();
              }}
              className="touch-target flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
              Cash Payment
            </h1>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              {/* Amount card */}
              <div className="p-5 bg-warning/5 border-2 border-warning/30 rounded-2xl mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-heading-sm text-foreground">
                      Cash Payment Due
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {cashExitData.booking_reference}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">
                      Parking charge
                    </span>
                    <span className="text-body-sm font-semibold text-foreground">
                      ₹{cashExitData.charge}
                    </span>
                  </div>
                  {cashExitData.penalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-body-sm text-destructive">
                        Overstay penalty
                      </span>
                      <span className="text-body-sm font-semibold text-destructive">
                        + ₹{cashExitData.penalty}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between">
                    <span className="text-body font-bold text-foreground">
                      Total to collect
                    </span>
                    <span className="text-heading-sm text-warning font-extrabold">
                      ₹{cashExitData.total}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-warning/10 rounded-xl">
                  <p className="text-body-sm font-semibold text-warning text-center">
                    Collect ₹{cashExitData.total} cash before allowing exit
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <MobileButton
                  fullWidth
                  variant="success"
                  onClick={handleCashCollected}
                  disabled={isProcessing}
                  loading={isProcessing}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Cash Collected – Allow Exit
                </MobileButton>
                <MobileButton
                  fullWidth
                  variant="outline"
                  onClick={() => {
                    setCashExitData(null);
                    rescan();
                  }}
                  disabled={isProcessing}
                >
                  Cancel – Keep Vehicle Inside
                </MobileButton>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Scan result */}
      <AnimatePresence>
        {screenMode === "result" && result && scanResult && (
          <div className="min-h-[100dvh] w-full bg-background flex flex-col">
            <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
              <button
                onClick={() => navigate("/partner/dashboard")}
                className="touch-target flex items-center justify-center"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">
                Scan Result
              </h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                {scanResult === "invalid" || scanResult === "already_used" ? (
                  <div className="p-5 bg-card border-2 border-destructive/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <XCircle
                          className={`w-6 h-6 ${scanResult === "already_used" ? "text-warning" : "text-destructive"}`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-heading-sm ${scanResult === "already_used" ? "text-warning" : "text-destructive"}`}
                        >
                          {scanResult === "already_used"
                            ? "Already Completed"
                            : "Invalid QR Code"}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {scanResult === "already_used"
                            ? "This booking has already been checked out"
                            : "Could not verify"}
                        </p>
                      </div>
                    </div>
                    <p className="text-body-sm text-muted-foreground mb-4">
                      {scanResult === "already_used"
                        ? "This vehicle has already entered and exited. No further action needed."
                        : "This QR code is not recognized or does not belong to this facility."}
                    </p>
                    <MobileButton fullWidth variant="outline" onClick={rescan}>
                      <RefreshCw className="w-4 h-4" /> Scan Again
                    </MobileButton>
                  </div>
                ) : (
                  <div className="p-5 bg-card border border-border rounded-2xl">
                    {(() => {
                      const config = getStatusConfig(scanResult);
                      const Icon = config.icon;
                      return (
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}
                          >
                            <Icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-heading-sm text-foreground">
                              {config.label}
                            </p>
                            <p className="text-body-sm text-muted-foreground">
                              {scanData.booking_reference ?? "—"}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-caption font-bold ${config.bg} ${config.color}`}
                          >
                            {config.badge}
                          </span>
                        </div>
                      );
                    })()}

                    {scanResult === "overstay" && (
                      <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-destructive" />
                          <p className="text-body-sm font-bold text-destructive">
                            Overstay Fine
                          </p>
                        </div>
                        <p className="text-caption text-muted-foreground">
                          Collect penalty before allowing exit.
                        </p>
                      </div>
                    )}

                    {scanResult === "success-exit-unpaid" && (
                      <div className="mb-4 p-3 bg-warning/5 border border-warning/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-warning" />
                          <p className="text-body-sm font-bold text-warning">
                            Cash Payment Pending
                          </p>
                        </div>
                        <p className="mt-1 text-caption text-muted-foreground">
                          Collect cash before allowing exit.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <MobileButton
                        fullWidth
                        variant="success"
                        onClick={() =>
                          navigate("/partner/dashboard", { replace: true })
                        }
                      >
                        <CheckCircle2 className="w-5 h-5" /> Confirm & Done
                      </MobileButton>
                      <button
                        onClick={rescan}
                        className="w-full text-center text-body-sm text-primary font-semibold py-2"
                      >
                        Scan Another
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerScanScreen;
