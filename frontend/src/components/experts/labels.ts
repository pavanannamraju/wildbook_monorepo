import type { ExperienceDetail } from "../../api/experts";

/** `short` → card list ("Guide"); `full` → detail page ("Forest Guide"). */
export function roleLabel(role: string, style: "short" | "full" = "full"): string {
  if (role === "guide") return style === "short" ? "Guide" : "Forest Guide";
  if (role === "naturalist") return "Naturalist";
  return role;
}

export function durationLabel(experience: ExperienceDetail): string | null {
  const duration = experience.duration;
  if (!duration) return null;
  const unit = duration.unit === "hours" ? "Hours" : duration.unit === "days" ? "Days" : duration.unit;
  return `${duration.value} ${unit}`;
}
