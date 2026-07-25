/**
 * Shared framer-motion variants used across every screen.
 *
 * House rules
 * -----------
 * - Prefer spring transitions for anything that moves in a physical way
 *   (pressables, banners, sheets). Prefer ease-out for opacity-only fades.
 * - Stagger children with `staggerContainer`; children use `staggerItem`.
 * - Keep enter durations 200–400ms so navigation feels snappy.
 * - Every variant must also declare an `exit` state whenever it's used inside
 *   an <AnimatePresence> so route transitions don't jump.
 */

import type { Variants, Transition } from "framer-motion";

// ---------- Primitive fade ----------
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ---------- Slide + fade ----------
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ---------- Spring scale ----------
export const springScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// ---------- Stagger ----------
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: { opacity: 1 },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: 15,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// ---------- Interaction primitives (whileTap / whileHover) ----------
export const tapScale = { scale: 0.97 };
export const tapScaleSmall = { scale: 0.98 };
export const hoverScale = { scale: 1.02 };
export const hoverLift = {
  y: -2,
  boxShadow: "0 12px 32px -12px rgba(0, 0, 0, 0.18)",
  transition: { duration: 0.18, ease: "easeOut" },
};

// ---------- Route transitions ----------
// Used by AnimatedPage; keep short so navigation feels instant.
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1], // gentle ease-out cubic-bezier
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export const pageExit: Variants = pageEnter;

// ---------- Common transitions ----------
export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const springTight: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

// ---------- Sheet / drawer variants ----------
export const sheetSlideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: 40,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const drawerSlideLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 320, damping: 32 },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

export const drawerSlideRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 320, damping: 32 },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

// ---------- Attention / pulse ----------
export const idlePulse = {
  scale: [1, 1.04, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// Utility: media query to disable hover on touch-only devices. We use this in
// PressableButton / PressableCard so hover-lift doesn't get "stuck" on mobile.
export const hoverCapable =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(hover: hover)").matches;
