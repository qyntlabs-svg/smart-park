import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const PartnerPendingScreen = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<"pending" | "approved">("pending");

  // Auto-approve after 3s for demo flow
  useEffect(() => {
    const t = setTimeout(() => setKycStatus("approved"), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {kycStatus === "pending" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-warning/10 flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-warning" />
          </div>
          <h1 className="text-heading-lg text-foreground">Pending Approval</h1>
          <p className="mt-3 text-body-sm text-muted-foreground max-w-xs">
            Your account is pending admin approval.
          </p>
          <p className="mt-2 text-caption text-muted-foreground">
            You will be automatically redirected once approved.
          </p>

          <div className="mt-6 flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </motion.div>
            <span className="text-caption text-muted-foreground">
              Checking status…
            </span>
          </div>
        </motion.div>
      )}

      {kycStatus === "approved" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-heading-lg text-foreground">Account Approved!</h1>
          <p className="mt-3 text-body-sm text-muted-foreground max-w-xs">
            Your partner account is now active. Set up your parking space to
            start accepting bookings.
          </p>
          <MobileButton
            fullWidth
            className="mt-8"
            onClick={() => navigate("/partner/setup", { replace: true })}
          >
            Set Up Parking Space
          </MobileButton>
        </motion.div>
      )}
    </div>
  );
};

export default PartnerPendingScreen;
