import { StarIcon } from "@phosphor-icons/react";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
};

export function StarRating({ rating, max = 5, size = 16, className }: StarRatingProps) {
  const roundedRating = Math.round(rating);
  const rootClassName = ["inline-flex items-center gap-1 whitespace-nowrap", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClassName} aria-label={`Rating ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, idx) => {
        const filled = idx < roundedRating;
        return <StarIcon key={`star-${idx + 1}`} size={size} weight={filled ? "fill" : "regular"} />;
      })}
    </span>
  );
}
