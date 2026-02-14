import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Car, Bike, Star } from "lucide-react";
import { MobileButton } from "@/components/ui/mobile-button";

const VehicleAddedScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const vehicleNumber = state?.vehicleNumber || "TN 01 AB 1234";
  const nickname = state?.nickname || "";
  const vehicleType = state?.vehicleType || "four_wheeler";
  const isDefault = state?.isDefault ?? true;

  const Icon = vehicleType === "two_wheeler" ? Bike : Car;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background flex flex-col items-center justify-center px-6">
      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-[120px] h-[120px] rounded-full bg-success/10 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className="w-[80px] h-[80px] rounded-full bg-success flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-heading-lg text-success text-center"
      >
        Vehicle Added Successfully!
      </motion.h1>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-8 w-full bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <p className="mt-4 text-heading-sm text-foreground">{vehicleNumber}</p>
        {nickname && (
          <p className="mt-1 text-body-sm text-muted-foreground">{nickname}</p>
        )}
        <div className="mt-4 flex gap-2">
          {isDefault && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 text-caption font-semibold text-success">
              <Star className="w-3 h-3" /> Default
            </span>
          )}
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-caption font-semibold text-primary">
            {vehicleType === "two_wheeler" ? "Two-Wheeler" : "Four-Wheeler"}
          </span>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-10 w-full pb-safe"
      >
        <MobileButton
          fullWidth
          onClick={() => navigate("/home", { replace: true })}
        >
          Start Finding Parking
        </MobileButton>
      </motion.div>
    </div>
  );
};

export default VehicleAddedScreen;
