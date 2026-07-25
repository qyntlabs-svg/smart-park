import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench, ChevronDown } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { getMechanicAuth, setMechanicAuth } from "@/lib/mechanic";
import { toast } from "sonner";

const MechanicLoginScreen = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const handleSend = () => {
    if (!/^\d{10}$/.test(phone)) return toast.error("Enter a valid 10-digit number");
    setStep("otp");
    toast.success("OTP sent (use 123456 for demo)");
  };

  const handleVerify = () => {
    if (otp !== "123456") return toast.error("Invalid OTP. Use 123456.");
    const existing = getMechanicAuth();
    if (existing && existing.phone === phone) {
      // Returning mechanic — route based on status
      if (existing.status === "pending_approval") return navigate("/mechanic/pending", { replace: true });
      if (existing.status === "approved" && !existing.hasSetup) return navigate("/mechanic/setup", { replace: true });
      if (existing.status === "approved") return navigate("/mechanic/dashboard", { replace: true });
      return navigate("/mechanic/kyc", { replace: true });
    }
    navigate("/mechanic/register", { state: { phone } });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button onClick={() => navigate("/role-select")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>
      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-heading-lg text-foreground">Mechanic Login</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          {step === "phone" ? "Sign in to manage your shop" : `Enter the OTP sent to +91 ${phone}`}
        </p>

        {step === "phone" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
            <label className="text-body-sm font-semibold text-foreground">Mobile Number</label>
            <div className="flex gap-3">
              <button className="flex items-center gap-1 h-14 px-3 rounded-xl border border-border bg-secondary text-body-sm font-medium text-foreground">
                🇮🇳 +91 <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-14 rounded-xl text-body font-medium px-4"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
            <label className="text-body-sm font-semibold text-foreground">OTP</label>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 rounded-xl text-body font-medium px-4 text-center tracking-widest"
            />
            <p className="text-caption text-muted-foreground">Demo OTP: 123456</p>
          </motion.div>
        )}
      </div>
      <div className="px-6 pb-8 pb-safe">
        <MobileButton fullWidth onClick={step === "phone" ? handleSend : handleVerify}>
          {step === "phone" ? "Send OTP" : "Verify & Continue"}
        </MobileButton>
      </div>
    </div>
  );
};

export default MechanicLoginScreen;