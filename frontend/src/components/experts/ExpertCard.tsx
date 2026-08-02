import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  GlobeIcon,
  MapPinIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";

import type { ExpertListItem } from "../../api/experts";
import { ExpertAvatar } from "../common/ExpertAvatar";

const MAX_VISIBLE_TAGS = 3;

function roleLabel(role: string): string {
  if (role === "guide") return "Guide";
  if (role === "naturalist") return "Naturalist";
  return role;
}

type ExpertCardProps = {
  expert: ExpertListItem;
  isBookmarked: boolean;
  isBookmarkPending: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
  onViewMore: () => void;
};

export function ExpertCard({
  expert,
  isBookmarked,
  isBookmarkPending,
  onToggleBookmark,
  onShare,
  onViewMore,
}: ExpertCardProps) {
  const primaryRole = expert.roles[0] ? roleLabel(expert.roles[0]) : "Naturalist";
  const location =
    expert.location_name ?? expert.location_primary_location_id ?? "India Wildlife Reserve";
  const languageValues =
    expert.language_names.length > 0 ? expert.language_names : expert.language_ids;
  const languages = languageValues.join(" · ") || "English · Hindi";
  const tagValues =
    expert.expertise_names.length > 0 ? expert.expertise_names : expert.expertise_ids;
  const [topSpec, ...rest] = tagValues;
  const visibleTags = rest.slice(0, MAX_VISIBLE_TAGS);
  const overflow = rest.length - MAX_VISIBLE_TAGS;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#E3DDD8] bg-white shadow-[0_4px_16px_rgba(0,0,0,.05)] transition-all hover:border-[#9BCDB2] hover:shadow-[0_8px_28px_rgba(11,110,102,.12)]">
      {/* Header: avatar / name / actions */}
      <div className="flex items-start gap-3 px-4 pt-5 pb-4 sm:gap-4 sm:px-5 sm:pt-6 sm:pb-5">
        <div className="aspect-square w-[28%] min-w-14 max-w-24 shrink-0 overflow-hidden rounded-full bg-[#C8DED5] ring-2 ring-white shadow-sm sm:min-w-16">
          <ExpertAvatar src={expert.profile_image_url} alt={expert.name} iconSize={36} lazy />
        </div>

        <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
          <h3 className="font-['Nunito'] text-[15px] font-extrabold leading-snug tracking-[-0.02em] text-[#3B372F] sm:text-[17px]">
            {expert.name}
          </h3>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#9A9691]">
            {primaryRole}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={onToggleBookmark}
            disabled={isBookmarkPending}
            title={isBookmarked ? "Remove bookmark" : "Save expert"}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
              isBookmarked
                ? "text-[#0B6E66]"
                : "text-[#9A9691] hover:bg-[#F6F4F1] hover:text-[#0B6E66]"
            }`}
          >
            <BookmarkSimpleIcon size={16} weight={isBookmarked ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={onShare}
            title="Share profile"
            aria-label="Share expert"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9A9691] transition-colors hover:bg-[#F6F4F1] hover:text-[#0B6E66]"
          >
            <ShareNetworkIcon size={16} />
          </button>
        </div>
      </div>

      {/* Location + languages */}
      <div className="flex flex-col gap-2 px-5 pb-5 text-[12px] text-[#73706C]">
        <div className="flex items-center gap-1.5">
          <MapPinIcon size={13} className="shrink-0 text-[#0B6E66]" />
          <span className="font-medium text-[#3B372F]">{location}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <GlobeIcon size={13} className="mt-0.5 shrink-0 text-[#0B6E66]" />
          <span>{languages}</span>
        </div>
      </div>

      {/* Speciality tags */}
      {topSpec ? (
        <div className="flex flex-wrap gap-1.5 px-5 pb-5">
          {[topSpec, ...visibleTags].map((spec) => (
            <span
              key={spec}
              className="rounded-[6px] bg-[#E8F4F2] px-2.5 py-1 text-[11px] font-semibold text-[#0B6E66]"
            >
              {spec}
            </span>
          ))}
          {overflow > 0 && (
            <span
              title={rest.slice(MAX_VISIBLE_TAGS).join(", ")}
              className="cursor-default rounded-[6px] border border-[#D7D2CC] px-2.5 py-1 text-[11px] font-semibold text-[#9A9691]"
            >
              +{overflow} more
            </span>
          )}
        </div>
      ) : null}

      {/* Footer CTA */}
      <div className="mt-auto px-5 pt-3 pb-5">
        <button
          type="button"
          onClick={onViewMore}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#0B6E66] py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#095B54] active:bg-[#074A46]"
        >
          View More <ArrowRightIcon size={13} />
        </button>
      </div>
    </article>
  );
}

export function ExpertCardSkeleton() {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-xl border border-[#E3DDD8] bg-white shadow-[0_4px_16px_rgba(0,0,0,.05)]"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3 px-4 pt-5 pb-4 sm:gap-4 sm:px-5 sm:pt-6 sm:pb-5">
        <div className="aspect-square w-[28%] min-w-14 max-w-24 shrink-0 animate-pulse rounded-full bg-[#E8E2DC] sm:min-w-16" />
        <div className="min-w-0 flex-1 pt-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#E8E2DC]" />
          <div className="mt-3 h-2.5 w-1/3 animate-pulse rounded bg-[#E8E2DC]" />
        </div>
        <div className="flex shrink-0 gap-1 pt-0.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#E8E2DC]" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#E8E2DC]" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pb-5">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#E8E2DC]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#E8E2DC]" />
      </div>

      <div className="flex flex-wrap gap-1.5 px-5 pb-5">
        <div className="h-6 w-20 animate-pulse rounded-[6px] bg-[#E8E2DC]" />
        <div className="h-6 w-24 animate-pulse rounded-[6px] bg-[#E8E2DC]" />
        <div className="h-6 w-16 animate-pulse rounded-[6px] bg-[#E8E2DC]" />
      </div>

      <div className="mt-auto px-5 pt-3 pb-5">
        <div className="h-10 w-full animate-pulse rounded-[6px] bg-[#E8E2DC]" />
      </div>
    </article>
  );
}
