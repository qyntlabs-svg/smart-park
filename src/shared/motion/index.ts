/**
 * `@/shared/motion` — Motion primitives used across every screen.
 *
 * Import from the barrel:
 * ```ts
 * import {
 *   AnimatedPage,
 *   AnimatedList,
 *   AnimatedListItem,
 *   PressableButton,
 *   PressableCard,
 *   fadeIn,
 *   slideUp,
 *   springScale,
 *   tapScale,
 *   hoverLift,
 * } from "@/shared/motion";
 * ```
 */
export * from "./variants";
export { AnimatedPage } from "./AnimatedPage";
export { PressableButton } from "./PressableButton";
export type { PressableButtonProps } from "./PressableButton";
export { PressableCard } from "./PressableCard";
export type { PressableCardProps } from "./PressableCard";
export { AnimatedList, AnimatedListItem } from "./AnimatedList";
