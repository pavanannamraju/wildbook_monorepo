type UserAvatarSize = "xs" | "sm" | "md" | "lg" | number;

type UserAvatarProps = {
  initials: string;
  color?: string;
  /** Pixel size, or a named token. Defaults to `sm` (44px). */
  size?: UserAvatarSize;
  /** @deprecated Prefer `size="lg"`. Kept for AccountPage call sites. */
  large?: boolean;
  imageUrl?: string | null;
  alt?: string;
  loading?: boolean;
  /**
   * When true, artwork may extend ~8–12px above the circular face
   * (wildlife ears) while left/right/bottom stay circular.
   * Does not scale the source image down.
   */
  overflowTop?: boolean;
  /** White ring around the circular face plate. */
  ring?: boolean;
  className?: string;
};

const SIZE_PX: Record<"xs" | "sm" | "md" | "lg", number> = {
  xs: 24,
  sm: 44,
  md: 48,
  lg: 96,
};

function resolveSizePx(size: UserAvatarSize | undefined, large: boolean | undefined): number {
  if (large) return SIZE_PX.lg;
  if (typeof size === "number") return size;
  if (size) return SIZE_PX[size];
  return SIZE_PX.sm;
}

/** Extra top room for ears: ~10% of diameter, clamped to 4–12px. */
function peekForSize(sizePx: number): number {
  return Math.round(Math.min(12, Math.max(4, sizePx * 0.1)));
}

/**
 * Clip for a (size × size+peek) box: rectangular top band for ears,
 * circular bottom half so L/R/B match a normal avatar circle.
 */
function topOverflowClipPath(sizePx: number, peek: number): string {
  const radius = sizePx / 2;
  const midY = peek + radius;
  return `path('M 0 0 L ${sizePx} 0 L ${sizePx} ${midY} A ${radius} ${radius} 0 0 1 0 ${midY} Z')`;
}

/**
 * User profile avatar. Layout footprint stays a fixed circle; optional
 * `overflowTop` lets preset artwork peek above without scaling the image down.
 */
export function UserAvatar({
  initials,
  color = "#C8DED5",
  size,
  large = false,
  imageUrl,
  alt = "",
  loading = false,
  overflowTop = false,
  ring = false,
  className = "",
}: UserAvatarProps) {
  const sizePx = resolveSizePx(size, large);
  const peek = overflowTop && imageUrl ? peekForSize(sizePx) : 0;
  const fontSize = Math.max(10, Math.round(sizePx * 0.32));
  const ringClass = ring
    ? sizePx >= 80
      ? "ring-4 ring-white"
      : "ring-2 ring-white"
    : "";

  if (loading) {
    return (
      <div
        className={`shrink-0 animate-pulse rounded-full bg-[#E3DDD8] ${ringClass} ${className}`}
        style={{ width: sizePx, height: sizePx }}
        aria-hidden="true"
      />
    );
  }

  if (!imageUrl) {
    return (
      <div
        style={{ backgroundColor: color, width: sizePx, height: sizePx, fontSize }}
        className={`flex shrink-0 items-center justify-center rounded-full font-['Montserrat'] font-bold text-[#3B372F] ${ringClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  // Uploaded photos / strict crop: classic circular avatar.
  if (peek === 0) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-[#E8E2DC] ${ringClass} ${className}`}
        style={{ width: sizePx, height: sizePx }}
      >
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          className="h-full w-full object-cover object-center"
        />
      </div>
    );
  }

  // Preset wildlife: same layout size; art is not scaled down. A short peek
  // band above the circle keeps ears visible (Discord-style).
  return (
    <div
      className={`relative shrink-0 overflow-visible ${className}`}
      style={{ width: sizePx, height: sizePx }}
    >
      <div
        className={`absolute inset-0 rounded-full bg-[#E8E2DC] ${ringClass}`}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: -peek,
          clipPath: topOverflowClipPath(sizePx, peek),
        }}
      >
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          className="absolute inset-x-0 bottom-0 w-full object-cover object-center"
          style={{
            // Same pixel size as the circle (no downscale). Open-top clip
            // above lets ear corners clear the circular face; L/R/B stay round.
            height: sizePx,
          }}
        />
      </div>
    </div>
  );
}
