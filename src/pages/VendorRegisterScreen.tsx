import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Store, Phone, Mail, User, CheckCircle2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { Input } from "@/components/ui/input";

const VendorRegisterScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [otp, setOtp] = useState("");

  const handleSendOtp = () => {
    if (form.name && form.phone.length >= 10 && form.email.includes("@")) {
      setStep("otp");
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) {
      setStep("done");
      // Auto-navigate to KYC after brief success
      setTimeout(() => {
        navigate("/vendor/kyc", { replace: true });
      }, 1500);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col">
      <header className="flex items-center h-[60px] px-4 pt-safe">
        <button onClick={() => navigate("/vendor/login")} className="touch-target flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
          <Store className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-heading-lg text-foreground">Vendor Registration</h1>
        <p className="mt-2 text-body-sm text-muted-foreground">
          {step === "form" && "Create your vendor account to list parking spaces"}
          {step === "otp" && "Enter the OTP sent to your mobile"}
          {step === "done" && "Account created! Redirecting to KYC…"}
        </p>

        {/* Locked badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-caption font-semibold text-warning">Account will be LOCKED until KYC approval</span>
        </div>

        {step === "form" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="pl-12 h-14 rounded-xl text-body"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Mobile Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-12 h-14 rounded-xl text-body"
                maxLength={10}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-12 h-14 rounded-xl text-body"
              />
            </div>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <Input
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-14 rounded-xl text-body text-center text-heading-md tracking-[0.5em]"
              maxLength={4}
            />
            <button className="text-body-sm text-primary font-semibold">Resend OTP</button>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 flex flex-col items-center"
          >
            <CheckCircle2 className="w-20 h-20 text-success" />
            <p className="mt-4 text-heading-sm text-foreground">Account Created!</p>
            <p className="mt-1 text-body-sm text-muted-foreground">Proceeding to KYC verification…</p>
          </motion.div>
        )}
      </div>

      {step !== "done" && (
        <div className="px-6 pb-8 pb-safe">
          <MobileButton
            fullWidth
            onClick={step === "form" ? handleSendOtp : handleVerifyOtp}
            disabled={
              step === "form"
                ? !(form.name && form.phone.length >= 10 && form.email.includes("@"))
                : otp.length < 4
            }
          >
            {step === "form" ? "Send OTP" : "Verify & Continue"}
          </MobileButton>
        </div>
      )}
    </div>
  );
};

export default VendorRegisterScreen;
