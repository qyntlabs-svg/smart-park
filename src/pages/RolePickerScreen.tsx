import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Store } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

const RolePickerScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const token = (location.state as any)?.token as string | undefined;

  const handlePickConsumer = () => {
    setActiveRole("user");
    navigate("/home", { replace: true });
  };

  const handlePickPartner = async () => {
    setActiveRole("partner");
    // Check partner status before routing
    try {
      const res = await api.get("/partner/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const status = res.data.data;
      if (status?.kyc_status === "approved" && status?.is_active) {
        navigate("/partner/dashboard", { replace: true });
      } else if (status?.kyc_status === "pending") {
        navigate("/partner/pending", { replace: true });
      } else if (status?.kyc_status === "rejected") {
        navigate("/partner/pending", { replace: true });
      } else {
        navigate("/partner/kyc", { replace: true });
      }
    } catch {
      navigate("/partner/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <h1 className="text-heading-lg text-foreground text-center">
          Continue as
        </h1>
        <p className="mt-2 text-body-sm text-muted-foreground text-center">
          Your account has access to both consumer and partner features.
        </p>

        <div className="mt-10 space-y-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePickConsumer}
            className="w-full flex items-center gap-4 p-5 bg-card border-2 border-border rounded-2xl text-left hover:border-primary transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Car className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-heading-sm text-foreground">Consumer</p>
              <p className="text-body-sm text-muted-foreground mt-0.5">
                Find and book parking spots
              </p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePickPartner}
            className="w-full flex items-center gap-4 p-5 bg-card border-2 border-border rounded-2xl text-left hover:border-success transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
              <Store className="w-7 h-7 text-success" />
            </div>
            <div>
              <p className="text-heading-sm text-foreground">Partner</p>
              <p className="text-body-sm text-muted-foreground mt-0.5">
                Manage your parking facility
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RolePickerScreen;
