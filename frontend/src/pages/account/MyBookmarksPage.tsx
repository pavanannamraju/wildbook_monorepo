import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAccommodationById } from "../../api/accommodations";
import { fetchBookmarks } from "../../api/bookmarks";
import { fetchExpertById } from "../../api/experts";
import { PageErrorState } from "../../components/common/PageErrorState";

type BookmarkCard = {
  key: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
};

async function loadExpertCard(targetId: string): Promise<BookmarkCard | null> {
  try {
    const expert = await fetchExpertById(targetId);
    return {
      key: `expert-${expert.id}`,
      title: expert.name,
      subtitle: expert.location_name ?? null,
      imageUrl: expert.profile_image_url,
      href: `/experts/${expert.slug}`,
    };
  } catch {
    return null;
  }
}

async function loadHomestayCard(targetId: string): Promise<BookmarkCard | null> {
  try {
    const accommodation = await fetchAccommodationById(targetId);
    return {
      key: `homestay-${accommodation.id}`,
      title: accommodation.name,
      subtitle: accommodation.location?.name ?? null,
      imageUrl: accommodation.gallery_media[0]?.media_url ?? null,
      href: `/accommodations/${accommodation.slug}`,
    };
  } catch {
    return null;
  }
}

export function MyBookmarksPage() {
  const [cards, setCards] = useState<BookmarkCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [experts, homestays] = await Promise.all([
          fetchBookmarks("expert"),
          fetchBookmarks("homestay"),
        ]);
        const resolved = await Promise.all([
          ...experts.map((bookmark) => loadExpertCard(bookmark.target_id)),
          ...homestays.map((bookmark) => loadHomestayCard(bookmark.target_id)),
        ]);
        if (!cancelled) {
          setCards(resolved.filter((card): card is BookmarkCard => card !== null));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load bookmarks.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <PageErrorState message={error} />;
  }

  return (
    <div>
      <h1 className="text-[18px] font-semibold text-(--color-wildbook-text) sm:text-[20px] md:text-[22px]">Bookmarks</h1>
      <p className="mt-1 text-sm text-(--color-wildbook-muted)">Experts and homestays you've saved for later.</p>

      {cards === null ? (
        <p className="mt-8 text-sm text-(--color-wildbook-muted)">Loading your bookmarks…</p>
      ) : cards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 p-8 text-center">
          <p className="text-sm text-(--color-wildbook-muted)">You haven't bookmarked anything yet.</p>
          <Link
            to="/experts"
            className="mt-4 inline-flex h-10 items-center justify-center rounded bg-(--color-wildbook-teal) px-5 text-sm font-medium text-white transition-colors hover:bg-[#095852]"
          >
            Explore Experts
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <li key={card.key}>
              <Link
                to={card.href}
                className="flex items-center gap-4 rounded-2xl border border-black/10 p-4 transition-colors hover:border-(--color-wildbook-teal)"
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="h-14 w-14 shrink-0 rounded-full bg-black/10" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-(--color-wildbook-text)">{card.title}</p>
                  {card.subtitle ? (
                    <p className="truncate text-sm text-(--color-wildbook-muted)">{card.subtitle}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
