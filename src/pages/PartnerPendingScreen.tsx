import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";
import { usePartnerStatus } from "@/api/partner";

const PartnerPendingScreen = () => {
  const navigate = useNavigate();
  const { data: status, isLoading, refetch } = usePartnerStatus();

  // Poll every 15s to detect admin approval
  useEffect(() => {
    const interval = setInterval(() => refetch(), 15000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Redirect once approved
  useEffect(() => {
    if (status?.kyc_status === "approved" && status?.is_active) {
      navigate("/partner/setup", { replace: true });
    }
  }, [status, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kycStatus = status?.kyc_status;
  const rejectionReason = status?.rejection_reason;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {/* Pending */}
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
            Your account is pending admin approval. This usually takes 24–48
            hours.
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
              Checking status every 15s…
            </span>
          </div>

          <div className="mt-8 w-full space-y-3">
            {[
              { label: "KYC Submitted", done: true },
              { label: "Admin Review", done: false },
              { label: "Account Activation", done: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-xl"
              >
                <span className="text-body-sm text-foreground">
                  {item.label}
                </span>
                <span
                  className={`text-caption font-semibold ${item.done ? "text-success" : "text-muted-foreground"}`}
                >
                  {item.done ? "Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <MobileButton
            variant="outline"
            fullWidth
            className="mt-6"
            onClick={() => refetch()}
          >
            Check Status Now
          </MobileButton>
        </motion.div>
      )}

      {/* Approved */}
      {kycStatus === "approved" && status?.is_active && (
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

      {/* Rejected */}
      {kycStatus === "rejected" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-heading-lg text-foreground">
            Application Rejected
          </h1>
          {rejectionReason && (
            <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl w-full">
              <p className="text-body-sm text-destructive">
                Reason: {rejectionReason}
              </p>
            </div>
          )}
          <p className="mt-3 text-body-sm text-muted-foreground max-w-xs">
            Please re-submit your KYC with correct documents.
          </p>
          <MobileButton
            fullWidth
            className="mt-8"
            onClick={() => navigate("/partner/kyc", { replace: true })}
          >
            Re-submit KYC
          </MobileButton>
        </motion.div>
      )}
    </div>
  );
};

export default PartnerPendingScreen;
