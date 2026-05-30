import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import logo from "@/assets/logo.png";

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
  }
}

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as any)?.role as string | undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);
  // Ref to track if success already fired — prevents failure from overwriting
  const successFired = useRef(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);

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

  // Launch the MSG91 widget once script is ready
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
      failure: (err: unknown) => {
        if (successFired.current) return;
        console.error("[MSG91] widget failure:", err);
        setError("OTP verification failed. Please try again.");
      },
    });
  }, [widgetReady]);

  const handleVerify = async (accessToken: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-msg91", { accessToken });

      setAuth(data.token, data.user);

      const roles: string[] = data.user.roles ?? [data.user.role];

      if (roles.includes("admin")) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (role === "user") {
        setActiveRole("user");
        if (data.user.is_new_user) {
          navigate("/add-vehicle", { replace: true, state: { first: true } });
          return;
        }
        navigate("/home", { replace: true });
        return;
      }

      if (roles.includes("user") && roles.includes("partner")) {
        navigate("/role-picker", {
          replace: true,
          state: { token: data.token },
        });
        return;
      }

      if (data.user.is_new_user) {
        navigate("/add-vehicle", { replace: true, state: { first: true } });
        return;
      }

      navigate("/home", { replace: true });
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
    <div className="min-h-[100dvh] w-full flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md mx-auto flex flex-col px-6 pt-safe">
        {/* Back */}
        <button
          onClick={() => navigate("/role-select")}
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
          {role === "partner"
            ? "Sign in to manage your parking facility"
            : "Sign in to find and book parking"}
        </motion.p>

        {/* Status area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                A verification popup will appear to enter your mobile number and
                OTP.
              </p>
              {error && (
                <p className="mt-3 text-body-sm text-destructive">{error}</p>
              )}
            </div>
          )}
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
