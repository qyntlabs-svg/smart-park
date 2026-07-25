import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { hoverCapable, tapScaleSmall, hoverLift } from "./variants";

type MotionDivProps = HTMLMotionProps<"div">;

export interface PressableCardProps extends MotionDivProps {
  /** Render as a button (tap-target) instead of a div. Defaults to div. */
  as?: "div" | "button";
  /** Disable the desktop hover-lift, keep only the tap scale. */
  noHover?: boolean;
}

/**
 * `PressableCard` is the card counterpart to `PressableButton`.
 *
 * On mobile: subtle scale-down on tap so the card acknowledges the press.
 * On desktop (hover-capable): a gentle lift + soft shadow so cards feel
 * clickable when hovered.
 *
 * Prefer this over adding motion props to every card manually — it keeps the
 * house style consistent across list rows, tiles, and quick-action panels.
 */
const PressableCard = forwardRef<HTMLDivElement, PressableCardProps>(
  ({ as = "div", noHover, whileTap, whileHover, ...rest }, ref) => {
    const tap = whileTap ?? tapScaleSmall;
    const hover =
      hoverCapable && !noHover ? (whileHover ?? hoverLift) : whileHover;

    if (as === "button") {
      // Rare but supported — motion.button with card styling.
      const buttonProps = rest as unknown as HTMLMotionProps<"button">;
      return (
        <motion.button
          ref={ref as unknown as React.Ref<HTMLButtonElement>}
          whileTap={tap}
          whileHover={hover}
          {...buttonProps}
        />
      );
    }

    return (
      <motion.div
        ref={ref}
        whileTap={tap}
        whileHover={hover}
        {...rest}
      />
    );
  },
);

PressableCard.displayName = "PressableCard";

export default PressableCard;
export { PressableCard };
