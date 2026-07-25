import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Store, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { MobileButton } from "@/components/ui/mobile-button";
import { useLogout } from "@/api/auth";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
  }
}

const PartnerLoginScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  const logout = useLogout();
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const successFired = useRef(false);

  // Load MSG91 widget script once
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
    script.onerror = () =>
      setError("Failed to load OTP widget. Check your connection.");
    document.head.appendChild(script);
  }, []);

  // Launch widget once ready
  useEffect(() => {
    if (!widgetReady || !window.initSendOTP) return;

    window.initSendOTP({
      widgetId: import.meta.env.VITE_MSG91_WIDGET_ID as string,
      tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH as string,
      exposeMethods: false,
      success: (data: { message?: string; type?: string }) => {
        successFired.current = true;
        const accessToken = data.message;
        if (!accessToken) {
          setError("OTP verification failed — no token received.");
          return;
        }
        handleVerify(accessToken);
      },
      failure: () => {
        if (successFired.current) return;
        setError("OTP verification failed. Please try again.");
      },
    });
  }, [widgetReady]);

  const handleVerify = async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-msg91", {
        accessToken,
      });

      const roles: string[] = data.user.roles ?? [data.user.role];

      // Approved partner — go straight to dashboard
      if (roles.includes("partner")) {
        setActiveRole("partner");
        navigate("/partner/dashboard", { replace: true });
        return;
      }

      // Check partner registration status
      const statusRes = await api.get("/partner/status", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const status = statusRes.data.data;

      if (!status?.registered) {
        setNotRegistered(true);
        return;
      }

      if (status.kyc_status === "rejected") {
        setError(
          `Your application was rejected. Reason: ${status.rejection_reason ?? "Please contact support."}`,
        );
        return;
      }

      if (status.kyc_status === "pending" || !status.is_active) {
        setError("Your account is pending admin approval. Please wait.");
        setTimeout(() => navigate("/partner/pending", { replace: true }), 1500);
        return;
      }

      setActiveRole("partner");
      navigate("/partner/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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

        {notRegistered ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 bg-warning/5 border border-warning/20 rounded-2xl"
          >
            <p className="text-body-sm font-bold text-foreground">
              Not registered as a partner
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              This number is not registered as a partner yet. Would you like to
              register?
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 w-full bg-card rounded-2xl p-6 shadow-lg border border-border"
          >
            {!widgetReady ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-body-sm text-muted-foreground">
                  Loading OTP widget…
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-body-sm text-muted-foreground">Verifying…</p>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-body-sm text-muted-foreground">
                  A verification popup will appear to enter your mobile number
                  and OTP.
                </p>
                {error && (
                  <p className="mt-3 text-body-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {notRegistered && (
        <div className="px-6 pb-8 pb-safe space-y-3">
          <MobileButton
            fullWidth
            onClick={async () => {
              await logout.mutateAsync().catch(() => {});
              navigate("/partner/register");
            }}
          >
            Register as Partner
          </MobileButton>
          <button
            onClick={() => setNotRegistered(false)}
            className="w-full text-center text-body-sm text-muted-foreground py-2"
          >
            Use a different number
          </button>
        </div>
      )}
    </div>
  );
};

export default PartnerLoginScreen;
