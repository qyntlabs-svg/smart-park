import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MobileButton } from "@/components/ui/mobile-button";
import { Zap, PlugZap, MapPin } from "lucide-react";
import { AnimatedPage } from "@/shared/motion";

// Screen: C-02 / G-01 · Charging wedge onboarding
const slides = [
  {
    icon: Zap,
    heading: "Never wait at a charger again",
    description:
      "Reserve a plug before you leave. Arrive knowing it's ready.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: PlugZap,
    heading: "Reserve. Arrive. Plug in.",
    description:
      "One tap holds your charger for 30 minutes. Pay only for what you draw.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: MapPin,
    heading: "Chennai's charging network, in one tap",
    description:
      "T Nagar, Velachery, OMR and beyond — one app across every network.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = useCallback(() => {
    if (current < slides.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  }, [current]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  }, [current]);

  const finish = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/login", { replace: true });
  };

  // Swipe handling
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -50) goNext();
    if (info.offset.x > 50) goPrev();
  };

  const isLast = current === slides.length - 1;

  return (
    <AnimatedPage className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-background relative">
      {/* Skip button */}
      {!isLast && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 right-6 pt-safe z-10 text-body-sm font-semibold text-muted-foreground touch-target"
          onClick={finish}
        >
          Skip
        </motion.button>
      )}

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ x: direction * 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Icon circle */}
            <div className={`w-[200px] h-[200px] rounded-full ${slides[current].bg} flex items-center justify-center mb-12`}>
              {(() => {
                const Icon = slides[current].icon;
                return <Icon className={`w-24 h-24 ${slides[current].color}`} strokeWidth={1.2} />;
              })()}
            </div>

            <h2 className="text-heading-lg text-foreground max-w-[280px]">
              {slides[current].heading}
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-[280px] leading-relaxed">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 pb-safe flex flex-col items-center gap-8">
        {/* Dots */}
        <div className="flex gap-2 items-center">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full bg-primary"
              animate={{
                width: i === current ? 24 : 8,
                opacity: i === current ? 1 : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Get Started button on last slide */}
        {isLast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <MobileButton fullWidth onClick={finish}>
              Get Started
            </MobileButton>
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default OnboardingScreen;
