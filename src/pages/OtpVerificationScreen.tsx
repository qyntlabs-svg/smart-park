import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Pencil } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const OtpVerificationScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as any)?.phone || "9876543210";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskedPhone = `+91 ${phone.slice(0, 5)} ****${phone.slice(-2)}`;
  const isComplete = otp.every((d) => d !== "");

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (data.length === 6) {
      setOtp(data.split(""));
      inputRefs.current[5]?.focus();
    }
  }, []);

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);

    // TODO: Supabase verifyOtp
    setTimeout(() => {
      setLoading(false);
      // TODO: Check if user has vehicles
      navigate("/add-vehicle", { replace: true, state: { first: true } });
    }, 1000);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp(Array(6).fill(""));
    inputRefs.current[0]?.focus();
    // TODO: Resend OTP via Supabase
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col px-6 pt-safe">
      {/* Header */}
      <div className="flex items-center h-[60px]">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex items-center justify-center -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <h1 className="text-heading-md text-foreground">Verify Your Number</h1>

        {/* Phone display */}
        <div className="mt-3 flex items-center gap-2">
          <p className="text-body text-muted-foreground">{maskedPhone}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary text-body-sm font-semibold flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </motion.div>

      {/* OTP inputs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-10 flex gap-3 justify-center"
        onPaste={handlePaste}
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-14 h-14 text-center text-heading-sm font-bold rounded-xl border-2 bg-card text-foreground transition-colors focus:outline-none ${
              digit
                ? "border-primary"
                : "border-border focus:border-primary"
            }`}
          />
        ))}
      </motion.div>

      {/* Resend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-body-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        {countdown > 0 ? (
          <p className="mt-1 text-body-sm text-muted-foreground/60">
            Resend in 0:{countdown.toString().padStart(2, "0")}
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="mt-1 text-body-sm font-semibold text-primary"
          >
            Resend OTP
          </button>
        )}
      </motion.div>

      {/* Verify button */}
      <div className="mt-auto pb-8 pb-safe">
        <MobileButton
          fullWidth
          disabled={!isComplete}
          loading={loading}
          onClick={handleVerify}
        >
          Verify & Continue
        </MobileButton>
      </div>
    </div>
  );
};

export default OtpVerificationScreen;
