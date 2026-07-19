import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Store, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const PartnerLoginScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);

  const handleSend = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit number");
      return;
    }
    setError("");
    setStep("otp");
    toast.success("OTP sent (use 123456 for demo)");
  };

  const handleVerify = () => {
    if (otp !== "123456") {
      setError("Invalid OTP. Use 123456.");
      return;
    }
    setError("");
    const registeredKey = `partner-registered-${phone}`;
    const isRegistered = localStorage.getItem(registeredKey) === "1";
    setAuth("demo-partner-token-" + phone, {
      id: "partner-" + phone,
      phone,
      name: null,
      role: "partner",
      roles: ["partner"],
      is_new_user: !isRegistered,
    });
    setActiveRole("partner");
    if (!isRegistered) {
      navigate("/partner/register", { replace: true });
      return;
    }
    navigate("/partner/dashboard", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button
          onClick={() => navigate("/role-select")}
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 pt-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full w-fit mb-6">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-body-sm font-semibold text-primary">
            Partner Login
          </span>
        </div>

        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-6 bg-primary/10 border border-primary/20 flex items-center justify-center">
          <img
            src={logo}
            alt="Smart Park logo"
            className="w-12 h-12 object-contain"
          />
        </div>

        <h1 className="text-heading-lg text-foreground">Partner Login</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          Verify your mobile number to continue
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 w-full bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          {step === "phone" ? (
            <>
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
              <MobileButton fullWidth onClick={handleSend}>Send OTP</MobileButton>
            </>
          ) : (
            <>
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
              <MobileButton fullWidth onClick={handleVerify}>Verify & Continue</MobileButton>
            </>
          )}
          {error && <p className="text-body-sm text-destructive">{error}</p>}
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerLoginScreen;
