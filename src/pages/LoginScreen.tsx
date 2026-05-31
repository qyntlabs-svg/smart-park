import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, ArrowLeft, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import logo from "@/assets/logo.png";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as any)?.role as string | undefined;

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
    const isNew = !localStorage.getItem(`consumer-onboarded-${phone}`);
    localStorage.setItem(`consumer-onboarded-${phone}`, "1");
    setAuth("demo-token-" + phone, {
      id: "user-" + phone,
      phone,
      name: null,
      role: "user",
      roles: ["user"],
      is_new_user: isNew,
    });
    setActiveRole("user");
    if (isNew) {
      navigate("/add-vehicle", { replace: true, state: { first: true } });
      return;
    }
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md mx-auto flex flex-col px-6 pt-safe">
        {/* Back */}
        <button
          onClick={() => (step === "otp" ? setStep("phone") : navigate("/role-select"))}
          className="mt-4 flex items-center gap-1 text-muted-foreground w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-caption">Back</span>
        </button>

        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <img
              src={logo}
              alt="Smart Park"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Car className="w-4 h-4 text-primary" />
            <span className="text-body-sm font-semibold text-primary">
              {role === "partner" ? "Partner Login" : "Consumer Login"}
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-heading-md text-foreground"
        >
          Welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-1 text-body-sm text-muted-foreground"
        >
          {step === "phone"
            ? "Sign in to find and book parking"
            : `Enter the OTP sent to +91 ${phone}`}
        </motion.p>

        {/* Status area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-caption text-muted-foreground text-center px-4"
        >
          By continuing, you agree to our{" "}
          <button
            onClick={() => navigate("/terms-privacy")}
            className="text-primary font-medium underline"
          >
            Terms of Service
          </button>{" "}
          &{" "}
          <button
            onClick={() => navigate("/terms-privacy")}
            className="text-primary font-medium underline"
          >
            Privacy Policy
          </button>
        </motion.p>
      </div>
    </div>
  );
};

export default LoginScreen;
