import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { usePartnerRegister } from "@/api/partner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
  }
}

const PartnerRegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState((location.state as any)?.phone ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const successFired = useRef(false);

  const partnerRegister = usePartnerRegister();
  const setAuth = useAuthStore((s) => s.setAuth);

  const isValidForm = businessName.trim().length >= 2 && /^\d{10}$/.test(phone);

  // Load MSG91 widget script
  useEffect(() => {
    if (document.getElementById("msg91-widget-script")) {
      setWidgetReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "msg91-widget-script";
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;
    script.onload = () => setWidgetReady(true);
    script.onerror = () => setError("Failed to load OTP widget.");
    document.head.appendChild(script);
  }, []);

  // Launch widget when step moves to "verify"
  useEffect(() => {
    if (step !== "verify" || !widgetReady || !window.initSendOTP) return;

    successFired.current = false;

    window.initSendOTP({
      widgetId: import.meta.env.VITE_MSG91_WIDGET_ID as string,
      tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH as string,
      identifier: `91${phone}`,
      exposeMethods: false,
      success: (data: { message?: string; type?: string }) => {
        successFired.current = true;
        const accessToken = data.message;
        if (!accessToken) {
          setError("OTP verification failed — no token received.");
          return;
        }
        handleVerifyAndRegister(accessToken);
      },
      failure: () => {
        if (successFired.current) return;
        setError("OTP verification failed. Please try again.");
      },
    });
  }, [step, widgetReady]);

  const handleVerifyAndRegister = async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      // 1. Verify MSG91 token → login/create user
      const { data } = await api.post("/auth/verify-msg91", {
        accessToken,
      });
      setAuth(data.token, data.user);

      // 2. Register as partner with business name
      await partnerRegister.mutateAsync(businessName.trim());

      setStep("done");
      setTimeout(() => navigate("/partner/kyc", { replace: true }), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? "";
      // Already registered is fine — proceed to KYC
      if (msg.toLowerCase().includes("already registered")) {
        setStep("done");
        setTimeout(() => navigate("/partner/kyc", { replace: true }), 1500);
        return;
      }
      setError(msg || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button
          onClick={() =>
            step === "verify" ? setStep("form") : navigate("/partner/login")
          }
          className="touch-target flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
          <Store className="w-8 h-8 text-success" />
        </div>

        <h1 className="text-heading-lg text-foreground">
          Partner Registration
        </h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          {step === "form" &&
            "Create your partner account to list parking spaces"}
          {step === "verify" && "Verify your mobile number to continue"}
          {step === "done" && "Account created! Redirecting to KYC…"}
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-caption font-semibold text-warning">
            Account locked until KYC approval
          </span>
        </div>

        {/* Step 1: Business details form */}
        {step === "form" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Business / Parking Name
              </label>
              <Input
                placeholder="e.g. Phoenix Mall Parking"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-2 h-14 rounded-xl text-body"
                autoFocus
              />
            </div>
            <div>
              <label className="text-body-sm font-semibold text-foreground">
                Mobile Number
              </label>
              <div className="mt-2 flex gap-3">
                <button className="flex items-center gap-1 h-14 px-3 rounded-xl border border-border bg-secondary text-body-sm font-medium text-foreground shrink-0">
                  🇮🇳 +91{" "}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  className="h-14 rounded-xl text-body font-medium px-4"
                />
              </div>
            </div>
            {error && <p className="text-caption text-destructive">{error}</p>}
          </motion.div>
        )}

        {/* Step 2: MSG91 widget verification */}
        {step === "verify" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full bg-card rounded-2xl p-6 shadow-lg border border-border"
          >
            <div className="text-center py-2 space-y-4">
              <p className="text-body-sm text-muted-foreground">
                A verification popup will appear for +91 {phone}
              </p>
              <MobileButton
                fullWidth
                onClick={() => {
                  localStorage.setItem(`partner-registered-${phone}`, "1");
                  localStorage.setItem(`partner-approved-${phone}`, "1");
                  localStorage.setItem(
                    `partner-business-${phone}`,
                    businessName.trim(),
                  );
                  navigate("/partner/dashboard", { replace: true });
                }}
              >
                Enter
              </MobileButton>
            </div>
            {error && (
              <p className="mt-3 text-body-sm text-destructive text-center">
                {error}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 flex flex-col items-center"
          >
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">
              Account Created!
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              Proceeding to KYC verification…
            </p>
          </motion.div>
        )}
      </div>

      {step === "form" && (
        <div className="px-6 pb-8 pb-safe">
          <MobileButton
            fullWidth
            onClick={() => {
              setError("");
              setStep("verify");
            }}
            disabled={!isValidForm}
          >
            Continue
          </MobileButton>
        </div>
      )}
    </div>
  );
};

export default PartnerRegisterScreen;
