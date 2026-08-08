import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  GlobeIcon,
  MapPinIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { motion } from "motion/react";

import type { ExpertListItem } from "../../api/experts";
import { ExpertAvatar } from "../common/ExpertAvatar";
import { roleLabel } from "./labels";

const MAX_VISIBLE_TAGS = 4;

type ExpertCardProps = {
  expert: ExpertListItem;
  isBookmarked: boolean;
  isBookmarkPending: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
  onViewMore: () => void;
  index?: number;
};

export function ExpertCard({
  expert,
  isBookmarked,
  isBookmarkPending,
  onToggleBookmark,
  onShare,
  onViewMore,
  index = 0,
}: ExpertCardProps) {
  const primaryRole = expert.roles[0] ? roleLabel(expert.roles[0], "short") : "Naturalist";
  const location =
    expert.location_name ?? expert.location_primary_location_id ?? "India Wildlife Reserve";
  const languageValues =
    expert.language_names.length > 0 ? expert.language_names : expert.language_ids;
  const languages = languageValues.join(", ") || "English, Hindi";
  const tagValues =
    expert.expertise_names.length > 0 ? expert.expertise_names : expert.expertise_ids;
  const visibleTags = tagValues.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tagValues.length - MAX_VISIBLE_TAGS;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#C8DED5]">
            <ExpertAvatar src={expert.profile_image_url} alt={expert.name} iconSize={28} lazy />
          </div>
          <div className="min-w-0">
            <h3
              className="truncate font-['Montserrat'] text-base leading-tight font-bold"
              style={{ color: "#1B2E22" }}
            >
              {expert.name}
            </h3>
            <p
              className="mt-0.5 font-['Nunito'] text-[10px] font-medium tracking-[0.12em] uppercase"
              style={{ color: "#9AA59D" }}
            >
              {primaryRole}
            </p>
          </div>
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleBookmark}
            disabled={isBookmarkPending}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            className="flex h-7 w-7 items-center justify-center rounded-sm transition-colors hover:bg-gray-100 disabled:opacity-50"
            style={{ color: isBookmarked ? "#0B6E66" : "#9AA59D" }}
          >
            <BookmarkSimpleIcon size={15} weight={isBookmarked ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="Share expert"
            className="flex h-7 w-7 items-center justify-center rounded-sm transition-colors hover:bg-gray-100"
            style={{ color: "#9AA59D" }}
          >
            <ShareNetworkIcon size={15} />
          </button>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />

      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="flex items-start gap-2">
          <MapPinIcon size={12} weight="fill" className="mt-[2px] shrink-0" style={{ color: "#0B6E66" }} />
          <span className="font-['Nunito'] text-[13px] leading-tight" style={{ color: "#5A6B60" }}>
            {location}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <GlobeIcon size={12} className="mt-[2px] shrink-0" style={{ color: "#0B6E66" }} />
          <span className="font-['Nunito'] text-[13px] leading-tight" style={{ color: "#5A6B60" }}>
            {languages}
          </span>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />

      <div className="flex-1 px-5 pt-3 pb-5">
        <p
          className="mb-2.5 font-['Nunito'] text-[8px] font-medium tracking-[0.12em] uppercase"
          style={{ color: "#B5BDB8" }}
        >
          Areas of Expertise
        </p>
        {visibleTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-1 font-['Nunito'] text-[11px] font-semibold"
                style={{ backgroundColor: "#E8F4F2", color: "#0B6E66" }}
              >
                {tag}
              </span>
            ))}
            {overflow > 0 ? (
              <span
                title={tagValues.slice(MAX_VISIBLE_TAGS).join(", ")}
                className="rounded-full border px-2.5 py-1 font-['Nunito'] text-[11px] font-semibold"
                style={{ borderColor: "#D7D2CC", color: "#9AA59D" }}
              >
                +{overflow} more
              </span>
            ) : null}
          </div>
        ) : (
          <p className="font-['Nunito'] text-[13px]" style={{ color: "#9AA59D" }}>
            Expertise coming soon
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onViewMore}
        className="group/btn flex items-center justify-center gap-2 py-3.5 font-['Nunito'] text-sm font-semibold text-white transition-colors"
        style={{ backgroundColor: "#0B6E66", borderRadius: "0 0 12px 12px" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#095B54";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#0B6E66";
        }}
      >
        View Full Profile
        <ArrowRightIcon
          size={14}
          className="transition-transform duration-200 group-hover/btn:translate-x-1"
        />
      </button>
    </motion.article>
  );
}

export function ExpertCardSkeleton() {
  return (
    <article
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-[#E8E2DC]" />
        <div className="min-w-0 flex-1 pt-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#E8E2DC]" />
          <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded bg-[#E8E2DC]" />
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#E8E2DC]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#E8E2DC]" />
      </div>
      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />
      <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-5">
        <div className="h-6 w-20 animate-pulse rounded-full bg-[#E8E2DC]" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-[#E8E2DC]" />
      </div>
      <div className="h-12 animate-pulse bg-[#E8E2DC]" />
    </article>
  );
}
