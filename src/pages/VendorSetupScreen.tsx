import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, DollarSign, Clock, AlertTriangle, Wallet } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";

const VendorSetupScreen = () => {
  const navigate = useNavigate();
  const [totalSlots, setTotalSlots] = useState("20");
  const [slotPrefix, setSlotPrefix] = useState("A");
  const [hourlyRate, setHourlyRate] = useState("40");
  const [dailyRate, setDailyRate] = useState("200");
  const [overstayPenalty, setOverstayPenalty] = useState("50");
  const [upiId, setUpiId] = useState("");
  const [qrType, setQrType] = useState<"per-slot" | "per-gate">("per-gate");
  const [showQr, setShowQr] = useState(false);
  const [step, setStep] = useState(1); // 1=slots, 2=pricing, 3=qr

  const slotCount = Math.max(0, parseInt(totalSlots) || 0);
  const generatedSlots = Array.from({ length: slotCount }, (_, i) => `${slotPrefix}-${String(i + 1).padStart(2, "0")}`);

  const handleFinish = () => {
    localStorage.setItem("vendorSetupDone", "true");
    navigate("/vendor/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe bg-card border-b border-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-body font-bold text-foreground pr-11">Parking Setup</h1>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-success" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          {step === 1 && "Configure Slots"}
          {step === 2 && "Set Pricing & UPI"}
          {step === 3 && "Generate QR Codes"}
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Step 1: Slots */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-body font-bold text-foreground mb-1">Total Slots</p>
              <p className="text-caption text-muted-foreground mb-2">Enter the number of parking spots</p>
              <Input
                type="number"
                min="1"
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="e.g. 100"
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>

            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">Slot Prefix</p>
              <p className="text-caption text-muted-foreground mb-2">Type any prefix (e.g. A, B, P, Floor-1)</p>
              <Input
                type="text"
                value={slotPrefix}
                onChange={(e) => setSlotPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. A, B, P1"
                className="h-14 rounded-xl text-heading-sm text-center"
              />
            </div>

            {/* Preview slots */}
            {slotCount > 0 && (
              <div>
                <p className="text-body-sm font-semibold text-foreground mb-2">Generated Slot IDs</p>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto scrollbar-hide">
                  {generatedSlots.slice(0, 30).map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-card border border-border rounded-lg text-caption font-semibold text-foreground">
                      {s}
                    </span>
                  ))}
                  {slotCount > 30 && (
                    <span className="px-3 py-1.5 text-caption text-muted-foreground">+{slotCount - 30} more</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Pricing & UPI */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-body-sm font-semibold text-foreground">Hourly Rate (₹)</p>
              </div>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="h-14 rounded-xl text-heading-sm text-center" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-body-sm font-semibold text-foreground">Daily Rate (₹)</p>
              </div>
              <Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className="h-14 rounded-xl text-heading-sm text-center" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <p className="text-body-sm font-semibold text-foreground">Overstay Penalty (₹/hr)</p>
              </div>
              <Input type="number" value={overstayPenalty} onChange={(e) => setOverstayPenalty(e.target.value)} className="h-14 rounded-xl text-heading-sm text-center" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <p className="text-body-sm font-semibold text-foreground">Your UPI ID (for receiving payments)</p>
              </div>
              <Input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="h-14 rounded-xl"
              />
              <p className="mt-1 text-caption text-muted-foreground">Customers paying via UPI will pay to this ID</p>
            </div>

            <div className="p-4 bg-card border border-border rounded-2xl">
              <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">Hourly</span>
                  <span className="text-body-sm font-bold text-foreground">₹{hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">Daily cap</span>
                  <span className="text-body-sm font-bold text-foreground">₹{dailyRate}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-sm text-muted-foreground">Overstay</span>
                  <span className="text-body-sm font-bold text-warning">₹{overstayPenalty}/hr extra</span>
                </div>
                {upiId && (
                  <div className="flex justify-between">
                    <span className="text-body-sm text-muted-foreground">UPI</span>
                    <span className="text-body-sm font-bold text-primary">{upiId}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: QR Codes */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-body font-bold text-foreground mb-2">QR Code Type</p>
              <div className="flex gap-3">
                {[
                  { key: "per-gate" as const, label: "Per Gate", desc: "One QR at entry" },
                  { key: "per-slot" as const, label: "Per Slot", desc: "Individual slot QRs" },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setQrType(key)}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${
                      qrType === key ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <QrCode className={`w-6 h-6 mb-2 ${qrType === key ? "text-primary" : "text-muted-foreground"}`} />
                    <p className={`text-body-sm font-bold ${qrType === key ? "text-primary" : "text-foreground"}`}>{label}</p>
                    <p className="text-caption text-muted-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button onClick={() => setShowQr(!showQr)} className="text-body-sm text-primary font-semibold mb-4">
                {showQr ? "Hide Preview" : "Preview QR Code"}
              </button>

              {showQr && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-card border border-border rounded-3xl">
                  <QRCodeSVG
                    value={JSON.stringify({ vendor: "VENDOR_001", type: qrType, slot: qrType === "per-slot" ? `${slotPrefix}-01` : "GATE-ENTRY" })}
                    size={180}
                    level="H"
                    includeMargin
                  />
                  <p className="mt-2 text-caption text-center text-muted-foreground">
                    {qrType === "per-gate" ? "Gate Entry QR" : `Slot ${slotPrefix}-01`}
                  </p>
                </motion.div>
              )}
            </div>

            <MobileButton variant="outline" fullWidth onClick={() => {}}>
              <QrCode className="w-5 h-5" /> Download All QR Codes
            </MobileButton>
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth onClick={step < 3 ? () => setStep(step + 1) : handleFinish}>
          {step < 3 ? "Continue" : "Go Live 🚀"}
        </MobileButton>
      </div>
    </div>
  );
};

export default VendorSetupScreen;
