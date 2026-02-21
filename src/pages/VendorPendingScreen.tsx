import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const VendorPendingScreen = () => {
  const navigate = useNavigate();
  // Mock: auto-approve after 5s for demo
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  useState(() => {
    const timer = setTimeout(() => setStatus("approved"), 5000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {status === "pending" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-warning/10 flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-heading-lg text-foreground">Pending Verification</h1>
          <p className="mt-3 text-body-sm text-muted-foreground max-w-[280px]">
            Your KYC documents are being reviewed by our admin team. This usually takes 24–48 hours.
          </p>

          <div className="mt-8 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </motion.div>
            <span className="text-caption text-muted-foreground">Checking status…</span>
          </div>

          <div className="mt-8 w-full space-y-3">
            {[
              { label: "Documents", status: "Submitted" },
              { label: "Location", status: "Submitted" },
              { label: "Identity", status: "Under Review" },
              { label: "Approval", status: "Pending" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                <span className="text-body-sm text-foreground">{item.label}</span>
                <span className={`text-caption font-semibold ${
                  item.status === "Submitted" ? "text-success" :
                  item.status === "Under Review" ? "text-warning" : "text-muted-foreground"
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {status === "approved" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-heading-lg text-foreground">Account Approved!</h1>
          <p className="mt-3 text-body-sm text-muted-foreground max-w-[280px]">
            Your vendor account is now active. Set up your parking space to start accepting bookings.
          </p>
          <MobileButton
            fullWidth
            className="mt-8"
            onClick={() => navigate("/vendor/setup", { replace: true })}
          >
            Set Up Parking Space
          </MobileButton>
        </motion.div>
      )}

      {status === "rejected" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-heading-lg text-foreground">Verification Failed</h1>
          <p className="mt-3 text-body-sm text-muted-foreground max-w-[280px]">
            Some documents could not be verified. Please re-submit.
          </p>
          <MobileButton
            fullWidth
            className="mt-8"
            onClick={() => navigate("/vendor/kyc", { replace: true })}
          >
            Re-submit Documents
          </MobileButton>
        </motion.div>
      )}
    </div>
  );
};

export default VendorPendingScreen;
