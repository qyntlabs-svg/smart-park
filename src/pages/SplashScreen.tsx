import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/store/auth.store";

/**
 * SplashScreen — the app's signature "wow" moment.
 *
 * Choreography (approx. timeline):
 *   0.00s — bg gradient fades in behind orbital circles
 *   0.05s — logo drops from scale 0.4 / rotate -10° with an elastic spring
 *   0.55s — "Auto Doc" wordmark rises + fades in below the logo
 *   0.75s — tagline reveals word-by-word
 *   1.20s — loading dots begin pulsing
 *   ~1.9s— navigate() fires. Outer <AnimatePresence mode="wait"> then runs
 *         our `exit` (scale 1 → 1.06, opacity 1 → 0, 350ms) concurrent with
 *         the next screen's enter — so the transition feels like one motion.
 *
 * Routing target is preserved from the previous behaviour
 * (admin/partner/user or onboarding/role-select).
 */
const TAGLINE = "Reserve. Arrive. Park. Charge.".split(" ");

const SplashScreen = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeRole = useAuthStore((s) => s.activeRole);
  const hasRole = useAuthStore((s) => s.hasRole);

  // Resolve the next route once, memoised — auth state won't change during
  // the splash frame, and we want the timing hook below to have a stable target.
  const nextRoute = useMemo(() => {
    if (isAuthenticated()) {
      if (hasRole("admin")) return "/admin/dashboard";
      if (
        activeRole === "partner" ||
        (!activeRole && hasRole("partner") && !hasRole("user"))
      ) {
        return "/partner/dashboard";
      }
      return "/home";
    }
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    return hasSeenOnboarding === "true" ? "/role-select" : "/onboarding";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hold the splash for the full choreography then navigate. The outer
  // <AnimatePresence mode="wait"> in App.tsx runs our `exit` variant (scale
  // + fade out) while the next screen begins its own enter animation, so
  // both motions overlap into a single smooth handover.
  useEffect(() => {
    const t = setTimeout(() => {
      navigate(nextRoute, { replace: true });
    }, 1900);
    return () => clearTimeout(t);
  }, [navigate, nextRoute]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(38,100%,42%)]"
    >
      {/* Orbital background circles — parallax feel */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="pointer-events-none absolute -top-[15%] -right-[10%] h-[380px] w-[380px] rounded-full bg-white/10 blur-2xl"
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        className="pointer-events-none absolute -bottom-[20%] -left-[15%] h-[460px] w-[460px] rounded-full bg-black/5 blur-3xl"
      />
      {/* Faint concentric rings behind logo */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-[260px] w-[260px] rounded-full border border-white/20"
      />
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute h-[360px] w-[360px] rounded-full border border-white/10"
      />

      {/* Logo — hero animation: scale + rotate spring in, then subtle breathe */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.05,
        }}
        className="relative z-10 flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-[32px] bg-white/15 backdrop-blur-md shadow-2xl"
      >
        <motion.img
          src={logo}
          alt="Auto Doc logo"
          className="h-[110px] w-[110px] object-contain drop-shadow-lg"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9,
          }}
        />
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
        className="relative z-10 mt-8 text-heading-lg tracking-tight text-primary-foreground"
      >
        Auto Doc
      </motion.h1>

      {/* Tagline — reveal word-by-word */}
      <div className="relative z-10 mt-3 flex gap-1.5">
        {TAGLINE.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.75 + i * 0.12,
              ease: "easeOut",
            }}
            className="text-body-sm font-semibold text-primary-foreground/90"
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="relative z-10 mt-14 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-foreground/80"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 1.2 + i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.0 }}
        className="pb-safe absolute bottom-8 text-caption text-primary-foreground/60"
      >
        v1.0.0
      </motion.p>
    </motion.div>
  );
};

export default SplashScreen;
