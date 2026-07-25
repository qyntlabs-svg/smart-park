import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";
import { AnimatedPage } from "@/shared/motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <AnimatedPage className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto mb-4 w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center"
        >
          <Compass className="w-10 h-10 text-primary" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-heading-lg text-foreground"
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-2 text-body text-muted-foreground"
        >
          We couldn't find that page.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mt-1 text-caption text-muted-foreground/70 break-all"
        >
          {location.pathname}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground text-body-sm font-semibold shadow-md active:scale-[0.97] transition-transform"
          >
            <Home className="w-4 h-4" /> Return home
          </Link>
        </motion.div>
      </div>
    </AnimatedPage>
  );
};

export default NotFound;
