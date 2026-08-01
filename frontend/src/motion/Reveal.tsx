import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { useMemo, type ElementType, type ReactNode } from "react";

import {
  defaultTransition,
  fadeIn,
  fadeLeft,
  fadeRight,
  fadeUp,
  fadeUpSoft,
  imageReveal,
  reducedMotionVariants,
  scaleIn,
  staggerContainer,
  staggerFast,
  staggerSlow,
  viewportEarly,
  viewportOnce,
} from "./variants";

type RevealPreset =
  | "fadeUp"
  | "fadeUpSoft"
  | "fadeIn"
  | "fadeLeft"
  | "fadeRight"
  | "image"
  | "scaleIn";

const PRESET_VARIANTS: Record<RevealPreset, Variants> = {
  fadeUp,
  fadeUpSoft,
  fadeIn,
  fadeLeft,
  fadeRight,
  image: imageReveal,
  scaleIn,
};

type StaggerPreset = "default" | "fast" | "slow";

const STAGGER_VARIANTS: Record<StaggerPreset, Variants> = {
  default: staggerContainer,
  fast: staggerFast,
  slow: staggerSlow,
};

type PolymorphicMotionProps = HTMLMotionProps<"div"> & {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
};

function useRevealVariants(preset: RevealPreset): Variants {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return reducedMotionVariants;
  return PRESET_VARIANTS[preset];
}

/**
 * `motion.create()` builds a brand-new component on every call (only the
 * cached `motion.div`-style accessors are memoized internally). Calling it
 * inline in a render body hands React a new component type each render,
 * which unmounts/remounts the whole subtree — restarting animations and,
 * for anything with focusable children, dropping input focus. Memoize per
 * tag so the identity is stable across re-renders.
 */
function useMotionComponent(Component: ElementType) {
  return useMemo(() => motion.create(Component), [Component]);
}

/**
 * Scroll-triggered entrance. Fires once when the element enters the viewport.
 * Prefer wrapping section headers, copy blocks, and media — not every leaf node.
 */
export function Reveal({
  as: Component = "div",
  children,
  className,
  preset = "fadeUp",
  delay = 0,
  amount,
  early = false,
  ...rest
}: PolymorphicMotionProps & {
  preset?: RevealPreset;
  delay?: number;
  amount?: number;
  /** Trigger earlier (useful for tall sections / full-bleed media). */
  early?: boolean;
}) {
  const variants = useRevealVariants(preset);
  const MotionTag = useMotionComponent(Component);

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={
        early
          ? { ...viewportEarly, ...(amount != null ? { amount } : {}) }
          : { ...viewportOnce, ...(amount != null ? { amount } : {}) }
      }
      transition={{ ...defaultTransition, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Parent for staggered children. Pair with `RevealItem` (or any child that
 * declares the same `hidden`/`visible` variant names).
 */
export function RevealStagger({
  as: Component = "div",
  children,
  className,
  preset = "default",
  early = false,
  ...rest
}: PolymorphicMotionProps & {
  preset?: StaggerPreset;
  early?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = useMotionComponent(Component);
  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : STAGGER_VARIANTS[preset];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={early ? viewportEarly : viewportOnce}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/** Child of `RevealStagger` — inherits orchestration from the parent. */
export function RevealItem({
  as: Component = "div",
  children,
  className,
  preset = "fadeUpSoft",
  ...rest
}: PolymorphicMotionProps & {
  preset?: RevealPreset;
}) {
  const variants = useRevealVariants(preset);
  const MotionTag = useMotionComponent(Component);

  return (
    <MotionTag
      className={className}
      variants={variants}
      transition={defaultTransition}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Mount animation for hero content (not scroll-bound). Words / lines stagger
 * in on first paint so the brand lands with presence.
 */
export function HeroReveal({
  as: Component = "div",
  children,
  className,
  delay = 0,
  preset = "fadeUp",
  ...rest
}: PolymorphicMotionProps & {
  delay?: number;
  preset?: RevealPreset;
}) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = useMotionComponent(Component);
  const variants = prefersReducedMotion
    ? reducedMotionVariants
    : PRESET_VARIANTS[preset];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ ...defaultTransition, delay, duration: 0.8 }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function HeroStagger({
  as: Component = "div",
  children,
  className,
  ...rest
}: PolymorphicMotionProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = useMotionComponent(Component);

  return (
    <MotionTag
      className={className}
      variants={prefersReducedMotion ? reducedMotionVariants : staggerSlow}
      initial="hidden"
      animate="visible"
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
