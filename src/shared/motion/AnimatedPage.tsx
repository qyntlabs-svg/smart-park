import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { pageEnter } from "./variants";

interface AnimatedPageProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /** Override the default page-enter variants if a screen wants a custom feel. */
  variants?: Variants;
  /** Bypass all animation (useful for lightweight subtree renders). */
  disabled?: boolean;
  children: ReactNode;
}

/**
 * `AnimatedPage` is the standard wrapper for every top-level route.
 *
 * Wrap the outermost element of a screen in this so all routes share a single
 * enter / exit motion. This works together with the `<AnimatePresence mode="wait">`
 * in `App.tsx` — no route needs to re-declare enter/exit inline.
 *
 * @example
 * ```tsx
 * const HomeScreen = () => (
 *   <AnimatedPage className="min-h-[100dvh] bg-background">
 *     ...
 *   </AnimatedPage>
 * );
 * ```
 */
const AnimatedPage = forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ variants, disabled, children, ...rest }, ref) => {
    if (disabled) {
      return (
        <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
          {children}
        </div>
      );
    }
    return (
      <motion.div
        ref={ref}
        variants={variants ?? pageEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

AnimatedPage.displayName = "AnimatedPage";

export default AnimatedPage;
export { AnimatedPage };
