import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, DollarSign, Clock, AlertTriangle, Wallet, Building2, CreditCard, Shield, Info } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { calculateCommission } from "@/lib/razorpay";

const TOTAL_STEPS = 4;

const VendorSetupScreen = () => {
  const navigate = useNavigate();
  const [totalSlots, setTotalSlots] = useState("20");
  const [slotPrefix, setSlotPrefix] = useState("A");
  const [hourlyRate, setHourlyRate] = useState("40");
  const [dailyRate, setDailyRate] = useState("200");
  const [overstayPenalty, setOverstayPenalty] = useState("50");
  // Payout details
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  // QR
  const [qrType, setQrType] = useState<"per-slot" | "per-gate">("per-gate");
  const [showQr, setShowQr] = useState(false);
  const [step, setStep] = useState(1);

  const slotCount = Math.max(0, parseInt(totalSlots) || 0);
  const generatedSlots = Array.from({ length: slotCount }, (_, i) => `${slotPrefix}-${String(i + 1).padStart(2, "0")}`);
  const commission = calculateCommission(parseInt(hourlyRate) || 0);

  const handleFinish = () => {
    localStorage.setItem("vendorSetupDone", "true");
    navigate("/vendor/dashboard", { replace: true });
  };

  const stepLabels = ["Configure Slots", "Set Pricing", "Payout Setup", "Generate QR Codes"];

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
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? "bg-success" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">{stepLabels[step - 1]}</p>
      </div>

      <div className="flex-1 px-6 pt-6 overflow-y-auto scrollbar-hide">
        {/* Step 1: Slots */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-body font-bold text-foreground mb-1">Total Slots</p>
              <p className="text-caption text-muted-foreground mb-2">Enter the number of parking spots</p>
              <Input type="number" min="1" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} placeholder="e.g. 100" className="h-14 rounded-xl text-heading-sm text-center" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-foreground mb-2">Slot Prefix</p>
              <p className="text-caption text-muted-foreground mb-2">Type any prefix (e.g. A, B, P, Floor-1)</p>
              <Input type="text" value={slotPrefix} onChange={(e) => setSlotPrefix(e.target.value.toUpperCase())} placeholder="e.g. A, B, P1" className="h-14 rounded-xl text-heading-sm text-center" />
            </div>
            {slotCount > 0 && (
              <div>
                <p className="text-body-sm font-semibold text-foreground mb-2">Generated Slot IDs</p>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto scrollbar-hide">
                  {generatedSlots.slice(0, 30).map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-card border border-border rounded-lg text-caption font-semibold text-foreground">{s}</span>
                  ))}
                  {slotCount > 30 && <span className="px-3 py-1.5 text-caption text-muted-foreground">+{slotCount - 30} more</span>}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Pricing */}
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
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payout Setup */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-body font-bold text-foreground mb-1">How do you want to receive payouts?</p>
              <p className="text-caption text-muted-foreground mb-3">Earnings from bookings will be transferred to your account after platform commission.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPayoutMethod("upi")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${payoutMethod === "upi" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Wallet className={`w-6 h-6 mb-2 ${payoutMethod === "upi" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-body-sm font-bold ${payoutMethod === "upi" ? "text-primary" : "text-foreground"}`}>UPI</p>
                  <p className="text-caption text-muted-foreground">Instant transfer</p>
                </button>
                <button
                  onClick={() => setPayoutMethod("bank")}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${payoutMethod === "bank" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Building2 className={`w-6 h-6 mb-2 ${payoutMethod === "bank" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-body-sm font-bold ${payoutMethod === "bank" ? "text-primary" : "text-foreground"}`}>Bank Account</p>
                  <p className="text-caption text-muted-foreground">1-2 business days</p>
                </button>
              </div>
            </div>

            {payoutMethod === "upi" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <p className="text-body-sm font-semibold text-foreground">Your UPI ID</p>
                </div>
                <Input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="h-14 rounded-xl" />
                <p className="mt-1 text-caption text-muted-foreground">Payouts from online bookings will be sent here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">Account Holder Name</p>
                  <Input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="John Doe" className="h-14 rounded-xl" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">Account Number</p>
                  <Input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890" className="h-14 rounded-xl" />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-foreground mb-2">IFSC Code</p>
                  <Input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} placeholder="SBIN0001234" className="h-14 rounded-xl" />
                </div>
              </div>
            )}

            {/* Commission info */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-body-sm font-semibold text-foreground">Platform Commission</p>
              </div>
              <p className="text-caption text-muted-foreground mb-3">
                A {commission.commissionPercent}% platform fee is deducted from each online booking. The rest is transferred to your account automatically via Razorpay.
              </p>
              <div className="p-3 bg-card rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-caption text-muted-foreground">Example: ₹{hourlyRate} booking</span>
                  <span className="text-caption font-bold text-foreground">₹{hourlyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-muted-foreground">Platform fee ({commission.commissionPercent}%)</span>
                  <span className="text-caption font-bold text-destructive">-₹{commission.commission}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-caption font-bold text-foreground">You receive</span>
                  <span className="text-caption font-extrabold text-success">₹{commission.vendorShare}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-caption text-muted-foreground">Payments secured by Razorpay</span>
            </div>
          </motion.div>
        )}

        {/* Step 4: QR Codes */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-body font-bold text-foreground mb-2">QR Code Type</p>
              <div className="flex gap-3">
                {[
                  { key: "per-gate" as const, label: "Per Gate", desc: "One QR at entry" },
                  { key: "per-slot" as const, label: "Per Slot", desc: "Individual slot QRs" },
                ].map(({ key, label, desc }) => (
                  <button key={key} onClick={() => setQrType(key)}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${qrType === key ? "border-primary bg-primary/5" : "border-border bg-card"}`}
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
                  <QRCodeSVG value={JSON.stringify({ vendor: "VENDOR_001", type: qrType, slot: qrType === "per-slot" ? `${slotPrefix}-01` : "GATE-ENTRY" })} size={180} level="H" includeMargin />
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
        <MobileButton fullWidth onClick={step < TOTAL_STEPS ? () => setStep(step + 1) : handleFinish}>
          {step < TOTAL_STEPS ? "Continue" : "Go Live 🚀"}
        </MobileButton>
      </div>
    </div>
  );
};

export default VendorSetupScreen;
