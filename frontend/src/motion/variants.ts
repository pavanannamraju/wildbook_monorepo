import type { Transition, Variants } from "motion/react";

/** Shared easings — soft deceleration reads well for content reveals. */
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const defaultTransition: Transition = {
  duration: 0.65,
  ease: easeOutExpo,
};

export const viewportOnce = {
  once: true,
  amount: 0.2,
  margin: "0px 0px -40px 0px",
} as const;

export const viewportEarly = {
  once: true,
  amount: 0.1,
  margin: "0px 0px -80px 0px",
} as const;

/** Fade + rise — the workhorse for section text and blocks. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 },
};

/** Softer rise for nested items inside a stagger. */
export const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

/** Image / media: slight scale settle as it enters. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: { opacity: 1, scale: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.08,
    },
  },
};

/** Instant visible state when the user prefers reduced motion. */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};
