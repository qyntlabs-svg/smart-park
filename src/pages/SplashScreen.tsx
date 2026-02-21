import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Car } from "lucide-react";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      if (hasSeenOnboarding === "true") {
        navigate("/role-select", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary to-[hsl(217,91%,45%)] relative overflow-hidden">
      {/* Subtle background circles */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary-foreground/5" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[400px] h-[400px] rounded-full bg-primary-foreground/5" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-center w-[120px] h-[120px] rounded-3xl bg-primary-foreground/15 backdrop-blur-sm shadow-2xl"
      >
        <Car className="w-16 h-16 text-primary-foreground" strokeWidth={1.5} />
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="mt-6 text-heading-lg text-primary-foreground tracking-tight"
      >
        Auto Doc
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        className="mt-2 text-body text-primary-foreground/80"
      >
        Park Smart, Drive Easy
      </motion.p>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-foreground/60"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 pb-safe text-caption text-primary-foreground/50"
      >
        v1.0.0
      </motion.p>
    </div>
  );
};

export default SplashScreen;
