// Screen: T-01 (login half) · Primitives: Identity, Provider
// Route: /tow/login

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Phone, ArrowRight } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getTowAuth,
  listOperators,
  setTowAuth,
} from "@/modules/tow/lib/tow";

const TowLoginScreen = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = getTowAuth();
    if (auth) navigate("/tow/dispatch", { replace: true });
  }, [navigate]);

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      return toast.error("Enter a valid 10-digit phone number");
    }
    setOtpSent(true);
    toast.message("OTP sent (use 1234 for demo)");
  };

  const verify = () => {
    if (otp !== "1234") return toast.error("Wrong OTP · demo code is 1234");
    setLoading(true);
    // Try to match a registered operator by phone; if not found, punt to registration.
    const clean = phone.replace(/\D/g, "");
    const match = listOperators().find(
      (o) => o.phone.replace(/\D/g, "").endsWith(clean.slice(-10)),
    );
    if (!match) {
      toast.message("New driver — complete truck registration");
      navigate(`/tow/register?phone=${encodeURIComponent(phone)}`);
      setLoading(false);
      return;
    }
    setTowAuth({ operatorId: match.id });
    toast.success(`Welcome back, ${match.name.split(" ")[0]}`);
    navigate("/tow/dispatch", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col pt-safe pb-safe px-6">
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Truck className="w-10 h-10 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Tow Operator Login
        </h1>
        <p className="mt-2 text-body-sm text-muted-foreground max-w-xs">
          Sign in with your registered mobile number to start accepting rescue
          jobs.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <label className="block">
          <span className="text-caption text-muted-foreground">Phone number</span>
          <div className="mt-1 flex items-center gap-2 h-14 px-3 rounded-xl border border-border bg-card">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98xxx xxxxx"
              className="border-0 focus-visible:ring-0 h-full px-0"
              inputMode="tel"
              disabled={otpSent}
            />
          </div>
        </label>

        {otpSent && (
          <label className="block">
            <span className="text-caption text-muted-foreground">
              Enter 4-digit OTP
            </span>
            <Input
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1234"
              inputMode="numeric"
              className="mt-1 h-14 rounded-xl text-center text-2xl font-bold tracking-[0.5em]"
            />
          </label>
        )}

        {!otpSent ? (
          <MobileButton fullWidth onClick={sendOtp}>
            Send OTP <ArrowRight className="w-4 h-4" />
          </MobileButton>
        ) : (
          <MobileButton fullWidth loading={loading} onClick={verify}>
            Verify & continue
          </MobileButton>
        )}

        <button
          onClick={() => navigate("/tow/register")}
          className="w-full h-12 text-body-sm text-primary font-semibold"
        >
          New here? Register your truck →
        </button>
      </div>

      <div className="mt-auto pb-6 text-center text-caption text-muted-foreground">
        Demo credentials: any phone · OTP <span className="font-semibold">1234</span>
      </div>
    </div>
  );
};

export default TowLoginScreen;
