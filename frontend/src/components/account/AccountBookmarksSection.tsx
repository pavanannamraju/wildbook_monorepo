import { BookmarkSimpleIcon, MapPinIcon, StarIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBookmarks, removeBookmark, type Bookmark } from "../../api/bookmarks";
import { fetchExpertById, type ExpertDetail } from "../../api/experts";
import { PageErrorState } from "../common/PageErrorState";
import { UserAvatar } from "../common/UserAvatar";
import { cardClassName, EmptyState, SectionTitle } from "./AccountSection";

const BOOKMARK_FALLBACK_COLORS = [
  "#C8DED5",
  "#D8CEB8",
  "#C6D8D6",
  "#DCCFBF",
  "#CEDAD0",
  "#D8CFE2",
  "#C8D8E0",
  "#E0D4BC",
] as const;

type BookmarkCard = {
  bookmarkId: string;
  targetId: string;
  name: string;
  initials: string;
  location: string | null;
  expertise: string[];
  rating: number | null;
  imageUrl: string | null;
  href: string;
  color: string;
};

function initialsFromName(name: string | null | undefined, fallback = "WB"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (!first) return fallback;
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BOOKMARK_FALLBACK_COLORS[hash % BOOKMARK_FALLBACK_COLORS.length] ?? BOOKMARK_FALLBACK_COLORS[0];
}

export function AccountBookmarksSection() {
  const [bookmarkCards, setBookmarkCards] = useState<BookmarkCard[] | null>(null);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookmarks() {
      try {
        const expertBookmarks = await fetchBookmarks("expert");
        const cards = await Promise.all(
          expertBookmarks.map(async (bookmark: Bookmark) => {
            try {
              const expert: ExpertDetail = await fetchExpertById(bookmark.target_id);
              return {
                bookmarkId: bookmark.id,
                targetId: bookmark.target_id,
                name: expert.name,
                initials: initialsFromName(expert.name),
                location: expert.location_name ?? null,
                expertise: expert.expertise_names.slice(0, 3),
                rating: expert.experience_rating_max ?? null,
                imageUrl: expert.profile_image_url,
                href: `/experts/${expert.slug}`,
                color: colorForKey(expert.id),
              } satisfies BookmarkCard;
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) {
          setBookmarkCards(cards.filter((card): card is BookmarkCard => card !== null));
        }
      } catch (error) {
        if (!cancelled) {
          setBookmarksError(error instanceof Error ? error.message : "Failed to load bookmarks.");
        }
      }
    }

    void loadBookmarks();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemoveBookmark(card: BookmarkCard) {
    try {
      await removeBookmark("expert", card.targetId);
      setBookmarkCards((current) => (current ?? []).filter((item) => item.targetId !== card.targetId));
    } catch (error) {
      setBookmarksError(error instanceof Error ? error.message : "Failed to remove bookmark.");
    }
  }

  return (
    <section id="bookmarks" className={`scroll-mt-28 mt-5 ${cardClassName}`}>
      <SectionTitle icon={BookmarkSimpleIcon} eyebrow="Keep exploring" title="Bookmarked experts" />
      {bookmarksError ? (
        <PageErrorState message={bookmarksError} />
      ) : bookmarkCards === null ? (
        <p className="text-sm text-[#73706C]">Loading your bookmarks…</p>
      ) : bookmarkCards.length === 0 ? (
        <EmptyState>
          <BookmarkSimpleIcon size={24} className="mx-auto mb-3 text-[#9A9691]" />
          <p className="text-sm font-semibold text-[#3B372F]">No bookmarked experts</p>
          <p className="mt-1 text-xs text-[#73706C]">Experts you save will appear here.</p>
          <Link
            to="/experts"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#0B6E66] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
          >
            Explore Experts
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {bookmarkCards.map((person) => (
            <div
              key={person.targetId}
              className="group rounded-[8px] border border-[#E3DDD8] p-4 transition-all hover:border-[#9BCDB2] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link to={person.href} className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    initials={person.initials}
                    color={person.color}
                    imageUrl={person.imageUrl}
                    ring
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#3B372F]">{person.name}</p>
                    {person.location ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#73706C]">
                        <MapPinIcon size={10} /> {person.location}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label={`Remove bookmark for ${person.name}`}
                  onClick={() => void handleRemoveBookmark(person)}
                  className="rounded-full p-1 text-[#0B6E66] transition-colors hover:bg-[#9BCDB2]/20"
                >
                  <BookmarkSimpleIcon size={16} weight="fill" />
                </button>
              </div>
              {person.expertise.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {person.expertise.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[8px] bg-[#9BCDB2]/50 px-2.5 py-1 text-[11px] font-semibold text-[#3B372F]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {person.rating != null ? (
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#D2A44A]">
                  <StarIcon size={13} weight="fill" /> {person.rating.toFixed(1)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
