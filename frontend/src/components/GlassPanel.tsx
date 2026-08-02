import { GlassCard } from "react-glass-ui";
import type { ReactNode, CSSProperties } from "react";

export interface GlassPanelProps {
  children: ReactNode;
  /** CSS border-radius value (default 30) */
  borderRadius?: number;
  /** Blur strength 0-20 (default 4) */
  blur?: number;
  /** Distortion strength 0-100 (default 40) */
  distortion?: number;
  /** Border color (default "#ffffff") */
  borderColor?: string;
  /** Border width in px (default 1) */
  borderSize?: number;
  /** Border opacity 0-1 (default 0.4) */
  borderOpacity?: number;
  /** Background hex color (default "#000000ff") */
  backgroundColor?: string;
  /** Background opacity 0-1 (default 0) */
  backgroundOpacity?: number;
  /** Scale on hover (default 1 = no scale) */
  onHoverScale?: number;
  /** Additional className on the outer wrapper */
  className?: string;
  /** Additional inline styles on the outer wrapper */
  style?: CSSProperties;
}

/**
 * Reusable glass-effect wrapper built on react-glass-ui's GlassCard.
 * Use it anywhere you need a frosted-glass background — navbar, cards, modals, etc.
 */
export default function GlassPanel({
  children,
  borderRadius = 30,
  blur = 4,
  distortion = 40,
  borderColor = "#ffffff",
  borderSize = 1,
  borderOpacity = 0.4,
  backgroundColor = "#000000ff",
  backgroundOpacity = 0,
  onHoverScale = 1,
}: GlassPanelProps) {
  return (
      <GlassCard
        id="glass-panel"
        blur={blur}
        distortion={distortion}
        flexibility={0}
        borderColor={borderColor}
        borderSize={borderSize}
        borderRadius={borderRadius}
        borderOpacity={borderOpacity}
        backgroundColor={backgroundColor}
        backgroundOpacity={backgroundOpacity}
        innerLightColor="#ffffff"
        innerLightSpread={1}
        innerLightBlur={10}
        innerLightOpacity={0}
        outerLightColor="#ffffff"
        outerLightSpread={1}
        outerLightBlur={10}
        outerLightOpacity={0}
        color="#ffffff"
        chromaticAberration={0}
        onHoverScale={onHoverScale}
        saturation={100}
        brightness={100}
      >
        {children}
      </GlassCard>

  );
}
