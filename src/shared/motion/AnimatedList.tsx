import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { staggerContainer, staggerItem } from "./variants";

type MotionDivProps = HTMLMotionProps<"div">;

interface AnimatedListProps extends Omit<MotionDivProps, "variants"> {
  /** Delay before the first child begins animating. */
  delayChildren?: number;
  /** Time between successive child animations (default 0.05s). */
  staggerChildren?: number;
  children: ReactNode;
}

/**
 * `AnimatedList` orchestrates a staggered enter for its children.
 *
 * Pair with `<AnimatedListItem>` for each row:
 * ```tsx
 * <AnimatedList className="space-y-3">
 *   {items.map(item => (
 *     <AnimatedListItem key={item.id}>...</AnimatedListItem>
 *   ))}
 * </AnimatedList>
 * ```
 */
const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ delayChildren, staggerChildren, children, ...rest }, ref) => {
    const variants =
      delayChildren !== undefined || staggerChildren !== undefined
        ? {
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: staggerChildren ?? 0.05,
                delayChildren: delayChildren ?? 0.02,
              },
            },
            exit: { opacity: 1 },
          }
        : staggerContainer;

    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="hidden"
        animate="visible"
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";

interface AnimatedListItemProps extends MotionDivProps {
  children: ReactNode;
}

const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ children, ...rest }, ref) => (
    <motion.div ref={ref} variants={staggerItem} {...rest}>
      {children}
    </motion.div>
  ),
);

AnimatedListItem.displayName = "AnimatedListItem";

export default AnimatedList;
export { AnimatedList, AnimatedListItem };
