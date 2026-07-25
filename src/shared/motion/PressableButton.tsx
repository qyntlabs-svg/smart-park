import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { hoverCapable, tapScale, hoverScale } from "./variants";

type MotionButtonProps = HTMLMotionProps<"button">;

export interface PressableButtonProps extends MotionButtonProps {
  /** Disable the hover lift on desktop (keep just the tap scale). */
  noHover?: boolean;
  /** Disable the tap scale (keep just hover). */
  noTap?: boolean;
}

/**
 * `PressableButton` is a thin wrapper over `<motion.button>` that applies our
 * house tap + hover interactions:
 *  - `whileTap`   → `{ scale: 0.97 }`
 *  - `whileHover` → `{ scale: 1.02 }` (only on hover-capable devices)
 *
 * All standard button props (onClick, disabled, className, aria-*) pass
 * through. Use this anywhere you'd otherwise write a bare `<button>` for a
 * click target — nav tiles, chips, filter buttons, CTAs.
 */
const PressableButton = forwardRef<HTMLButtonElement, PressableButtonProps>(
  ({ noHover, noTap, whileTap, whileHover, ...rest }, ref) => {
    const tap = noTap ? undefined : (whileTap ?? tapScale);
    const hover =
      hoverCapable && !noHover ? (whileHover ?? hoverScale) : whileHover;
    return (
      <motion.button
        ref={ref}
        whileTap={tap}
        whileHover={hover}
        {...rest}
      />
    );
  },
);

PressableButton.displayName = "PressableButton";

export default PressableButton;
export { PressableButton };
