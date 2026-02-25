import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = /^\d{10}$/.test(phone);

  const handleSendOtp = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");

    // TODO: Supabase auth signInWithOtp
    // For now simulate and navigate
    setTimeout(() => {
      setLoading(false);
      navigate("/verify-otp", { state: { phone } });
    }, 1000);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    if (error) setError("");
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md flex flex-col items-center px-6 pt-safe">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-16 w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-primary/25"
        >
          <img src={logo} alt="Auto Doc logo" className="w-full h-full object-contain" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 text-heading-md text-foreground"
        >
          Welcome to Auto Doc
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-2 text-body-sm text-muted-foreground"
        >
          Sign in with your mobile number
        </motion.p>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 w-full bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          <label className="text-body-sm font-semibold text-foreground">
            Mobile Number
          </label>

          <div className="mt-3 flex gap-3">
            {/* Country code */}
            <button className="flex items-center gap-1 h-14 px-3 rounded-xl border border-border bg-secondary text-body-sm font-medium text-foreground shrink-0">
              🇮🇳 +91
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Phone input */}
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => formatPhone(e.target.value)}
              className={`h-14 rounded-xl text-body font-medium px-4 ${
                error ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
              autoFocus
            />
          </div>

          {error && (
            <p className="mt-2 text-caption text-destructive">{error}</p>
          )}

          {!error && phone.length > 0 && !isValid && (
            <p className="mt-2 text-caption text-muted-foreground">
              Enter a valid 10-digit mobile number
            </p>
          )}

          <MobileButton
            fullWidth
            className="mt-6"
            disabled={!isValid}
            loading={loading}
            onClick={handleSendOtp}
          >
            Send OTP
          </MobileButton>
        </motion.div>

        {/* Legal footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-caption text-muted-foreground text-center leading-relaxed px-4"
        >
          By continuing, you agree to our{" "}
          <span className="text-primary font-medium">Terms of Service</span> &{" "}
          <span className="text-primary font-medium">Privacy Policy</span>
        </motion.p>
      </div>
    </div>
  );
};

export default LoginScreen;
