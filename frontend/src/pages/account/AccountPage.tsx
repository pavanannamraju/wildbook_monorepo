import {
  BinocularsIcon,
  BookmarkSimpleIcon,
  CalendarDotsIcon,
  CaretDownIcon,
  CheckIcon,
  CompassIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShieldCheckIcon,
  SignOutIcon,
  StarIcon,
  TranslateIcon,
  UploadSimpleIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  fetchCurrentUser,
  updateProfileDetails,
  updateUserAvatar,
  upsertEmailSignupProfile,
  type AvatarType,
  type CurrentUser,
} from "../../api/auth";
import {
  fetchMyAccommodationBookings,
  type AccommodationBookingSummary,
} from "../../api/accommodationBookings";
import { fetchBookmarks, removeBookmark, type Bookmark } from "../../api/bookmarks";
import { fetchExpertById, type ExpertDetail } from "../../api/experts";
import { useAuth } from "../../auth/AuthProvider";
import { StickyTopNavbar } from "../../components/common/StickyTopNavbar";
import { PageErrorState } from "../../components/common/PageErrorState";
import { UserAvatar } from "../../components/common/UserAvatar";
import { WORLD_LANGUAGES } from "../../data/languages";
import {
  PRESET_AVATARS,
  resolveUserAvatarSrc,
} from "../../data/presetAvatars";

const INTEREST_PRESETS = [
  "Birding",
  "Herping",
  "Big Cats",
  "Botany",
  "Night Safari",
  "Photography",
  "Trekking",
  "Rivers & Wetlands",
  "Reptiles",
  "Mammals",
  "Insects",
  "Conservation",
  "Butterflies",
  "Forest Walks",
  "Tribal Culture",
] as const;

const LANGUAGE_PRESETS = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Odia",
  "Punjabi",
] as const;

const CITIES = [
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Delhi NCR",
  "Chennai, Tamil Nadu",
  "Hyderabad, Telangana",
  "Pune, Maharashtra",
  "Ahmedabad, Gujarat",
  "Kochi, Kerala",
  "Jaipur, Rajasthan",
  "Kolkata, West Bengal",
  "Bhopal, Madhya Pradesh",
  "Nagpur, Maharashtra",
  "Dehradun, Uttarakhand",
  "Guwahati, Assam",
  "Chandigarh, Punjab",
  "Lucknow, Uttar Pradesh",
  "Patna, Bihar",
  "Bhubaneswar, Odisha",
  "Thiruvananthapuram, Kerala",
  "Mysuru, Karnataka",
  "Coimbatore, Tamil Nadu",
  "Vijayawada, Andhra Pradesh",
  "Indore, Madhya Pradesh",
  "Surat, Gujarat",
  "Raipur, Chhattisgarh",
] as const;

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;

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

type SaveStatus = "idle" | "saving" | "success" | "error";
type BookingsTab = "upcoming" | "past";

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

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isUpcomingBooking(booking: AccommodationBookingSummary, today: Date): boolean {
  if (booking.status === "declined" || booking.status === "cancelled") return false;
  if (!booking.check_out) return booking.status === "pending" || booking.status === "confirmed";
  const checkout = new Date(booking.check_out);
  if (Number.isNaN(checkout.getTime())) return booking.status === "pending" || booking.status === "confirmed";
  return checkout >= today;
}

function statusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

function cityDisplayValue(city: string, country: string): string {
  const parts = [city.trim(), country.trim()].filter(Boolean);
  return parts.join(", ");
}

function parseCitySelection(value: string): { city: string; country: string } {
  const [cityPart, ...rest] = value.split(",").map((part) => part.trim());
  return {
    city: cityPart ?? "",
    country: rest.join(", "),
  };
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="text-[#0B6E66]">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-['Nunito'] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9691]">
          {eyebrow}
        </p>
        <h2
          className="text-[16px] font-bold tracking-[-0.02em] text-[#3B372F] sm:text-[18px]"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

const CUSTOM_AVATAR_MAX_EDGE_PX = 512;
const CUSTOM_AVATAR_JPEG_QUALITY = 0.82;
const CUSTOM_AVATAR_MAX_BYTES = 900_000;

async function fileToCompressedDataUri(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = objectUrl;
    });

    const longestEdge = Math.max(image.width, image.height) || 1;
    const scale = Math.min(1, CUSTOM_AVATAR_MAX_EDGE_PX / longestEdge);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process that image.");
    }
    context.drawImage(image, 0, 0, width, height);

    const dataUri = canvas.toDataURL("image/jpeg", CUSTOM_AVATAR_JPEG_QUALITY);
    if (dataUri.length > CUSTOM_AVATAR_MAX_BYTES) {
      throw new Error("That photo is too large. Try a smaller image.");
    }
    return dataUri;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function SkillTag({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-[8px] px-3 py-2 font-['Nunito'] text-sm font-semibold transition-all disabled:opacity-60 ${
        selected
          ? "bg-[#9BCDB2] text-[#2F2B28]"
          : "bg-[#9BCDB2]/50 text-[#3B372F] hover:bg-[#9BCDB2]/70"
      }`}
    >
      {selected ? <CheckIcon size={13} className="shrink-0" /> : null}
      {label}
    </button>
  );
}

function LanguageTag({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-between rounded-[8px] px-4 py-2.5 font-['Nunito'] text-sm font-semibold transition-all disabled:opacity-60 ${
        selected
          ? "bg-[#D4CFC8] text-[#2F2B28]"
          : "bg-[#E8E2DC] text-[#3B372F] hover:bg-[#DDD7D0]"
      }`}
    >
      {label}
      {selected ? <CheckIcon size={14} className="ml-2 shrink-0 text-[#0B6E66]" /> : null}
    </button>
  );
}

function AddCustomValue({
  placeholder,
  disabled,
  suggestions,
  onAdd,
}: {
  placeholder: string;
  disabled?: boolean;
  suggestions?: readonly string[];
  onAdd: (value: string) => boolean;
}) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const term = value.trim().toLowerCase();
    return suggestions.filter((option) => term === "" || option.toLowerCase().includes(term));
  }, [suggestions, value]);

  function commit(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned || disabled) return;
    const added = onAdd(cleaned);
    if (added) {
      setValue("");
      setIsOpen(false);
      setHighlightedIndex(0);
    }
  }

  function commitHighlightedOrTyped() {
    if (filteredSuggestions.length > 0) {
      const candidate = filteredSuggestions[Math.min(highlightedIndex, filteredSuggestions.length - 1)];
      if (candidate) {
        commit(candidate);
        return;
      }
    }
    commit(value);
  }

  return (
    <div className="mt-4 flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          role={suggestions ? "combobox" : undefined}
          aria-expanded={suggestions ? isOpen && filteredSuggestions.length > 0 : undefined}
          aria-autocomplete={suggestions ? "list" : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (suggestions) setIsOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filteredSuggestions.length > 0) {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((index) =>
                Math.min(index + 1, Math.max(filteredSuggestions.length - 1, 0)),
              );
              return;
            }
            if (event.key === "ArrowUp" && filteredSuggestions.length > 0) {
              event.preventDefault();
              setHighlightedIndex((index) => Math.max(index - 1, 0));
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              commitHighlightedOrTyped();
              return;
            }
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className="h-11 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60"
        />
        {suggestions && isOpen && filteredSuggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[6px] border border-[#E3DDD8] bg-white py-1 shadow-lg">
            {filteredSuggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commit(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`block w-full px-3 py-2 text-left font-['Nunito'] text-sm ${
                    index === highlightedIndex
                      ? "bg-[#E0F0EC] text-[#0B6E66]"
                      : "text-[#2F2B28] hover:bg-[#F6F4F1]"
                  }`}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || value.trim().length === 0}
        onClick={() => commitHighlightedOrTyped()}
        aria-label="Add custom value"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-[#D7D2CC] bg-white text-[#3B372F] transition-colors hover:bg-[#F6F4F1] disabled:opacity-50"
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}

function PrimaryBtn({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[4px] bg-[#0B6E66] px-4 py-2.5 font-['Nunito'] text-sm font-semibold text-white transition-colors hover:bg-[#095B54] active:bg-[#074A46] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryBtn({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      to={href}
      className={`inline-flex items-center gap-2 rounded-[4px] border border-[#0B6E66] bg-white px-3 py-2 font-['Nunito'] text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] active:bg-[#9BCDB2]/30 ${className}`}
    >
      {children}
    </Link>
  );
}

function CityPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filtered = CITIES.filter((city) => city.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="relative flex w-full items-center rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] py-2.5 pl-9 pr-3 font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors focus:border-[#0B6E66] disabled:opacity-60"
      >
        <MagnifyingGlassIcon size={13} className="absolute left-3 text-[#9A9691]" />
        <span className="truncate">{value || "Select city…"}</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[6px] border border-[#E3DDD8] bg-white shadow-lg">
          <div className="border-b border-[#E3DDD8] p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city…"
              className="h-9 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm outline-none focus:border-[#0B6E66]"
            />
          </div>
          <ul className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 font-['Nunito'] text-sm text-[#73706C]">No city found.</li>
            ) : (
              filtered.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(city);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center px-3 py-2 font-['Nunito'] text-sm text-[#2F2B28] transition-colors hover:bg-[#F6F4F1]"
                  >
                    {city}
                    <CheckIcon
                      size={16}
                      className={`ml-auto text-[#0B6E66] ${city === value ? "opacity-100" : "opacity-0"}`}
                    />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 py-2.5 font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60";

const labelClassName = "mb-1.5 block font-['Nunito'] text-[11px] font-semibold text-[#9A9691]";

const cardClassName =
  "rounded-xl border border-[#E3DDD8] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,.04)]";

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#D7D2CC] py-12 text-center font-['Nunito'] text-sm text-[#73706C]">
      {children}
    </div>
  );
}

export function AccountPage() {
  const { logout, setProfile } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prefsSaveStatus, setPrefsSaveStatus] = useState<SaveStatus>("idle");
  const [prefsSaveError, setPrefsSaveError] = useState<string | null>(null);
  const prefsSaveSeqRef = useRef(0);
  const interestsRef = useRef<string[]>([]);
  const preferredLanguagesRef = useRef<string[]>([]);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarType, setAvatarType] = useState<AvatarType | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarSaveError, setAvatarSaveError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const customPhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!avatarOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !avatarSaving) {
        setAvatarOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [avatarOpen, avatarSaving]);

  const [bookings, setBookings] = useState<AccommodationBookingSummary[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingsTab, setBookingsTab] = useState<BookingsTab>("upcoming");

  const [bookmarkCards, setBookmarkCards] = useState<BookmarkCard[] | null>(null);
  const [bookmarksError, setBookmarksError] = useState<string | null>(null);

  function applyUser(current: CurrentUser) {
    setUser(current);
    setProfile(current);
    setFullName(current.full_name ?? "");
    setPhoneNumber(current.phone_number ?? "");
    setDateOfBirth(current.date_of_birth ?? "");
    setGender(current.gender ?? "");
    setLocationCity(current.location_city ?? "");
    setLocationCountry(current.location_country ?? "");
    setInterests(current.interests);
    setPreferredLanguages(current.preferred_languages);
    interestsRef.current = current.interests;
    preferredLanguagesRef.current = current.preferred_languages;
    setAvatarType(current.avatar_type);
    setAvatarKey(current.avatar_key);
    setAvatarUrl(current.avatar_url);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then(applyUser)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Failed to load profile.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyAccommodationBookings(controller.signal)
      .then(setBookings)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBookingsError(error instanceof Error ? error.message : "Failed to load bookings.");
      });
    return () => controller.abort();
  }, []);

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

  const displayName = fullName.trim() || user?.email || "Wildbook traveller";
  const avatarInitials = initialsFromName(displayName);
  const profileAvatarSrc = resolveUserAvatarSrc({
    avatarType,
    avatarKey,
    avatarUrl,
  });
  const cityValue = cityDisplayValue(locationCity, locationCountry);
  const canEditBasicInfo = user?.auth_provider === "EMAIL";

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const upcomingBookings = useMemo(
    () => (bookings ?? []).filter((booking) => isUpcomingBooking(booking, today)),
    [bookings, today],
  );
  const pastBookings = useMemo(
    () => (bookings ?? []).filter((booking) => !isUpcomingBooking(booking, today)),
    [bookings, today],
  );
  const visibleBookings = bookingsTab === "upcoming" ? upcomingBookings : pastBookings;

  function toggleValue(value: string, selected: string[]): string[] {
    const key = value.toLowerCase();
    if (selected.some((item) => item.toLowerCase() === key)) {
      return selected.filter((item) => item.toLowerCase() !== key);
    }
    return [...selected, value];
  }

  async function persistPreferences(nextInterests: string[], nextLanguages: string[]) {
    if (!user) return;
    const seq = ++prefsSaveSeqRef.current;
    setPrefsSaveStatus("saving");
    setPrefsSaveError(null);
    try {
      const updated = await updateProfileDetails({
        date_of_birth: user.date_of_birth ?? undefined,
        gender: user.gender ?? undefined,
        location_city: user.location_city ?? undefined,
        location_country: user.location_country ?? undefined,
        interests: nextInterests,
        preferred_languages: nextLanguages,
        experience_level: user.experience_level ?? undefined,
        bio: user.bio ?? undefined,
        emergency_contact_name: user.emergency_contact_name ?? undefined,
        emergency_contact_phone: user.emergency_contact_phone ?? undefined,
      });
      if (seq !== prefsSaveSeqRef.current) return;
      applyUser(updated);
      setPrefsSaveStatus("success");
    } catch (error) {
      if (seq !== prefsSaveSeqRef.current) return;
      setPrefsSaveStatus("error");
      setPrefsSaveError(error instanceof Error ? error.message : "Failed to save preferences.");
    }
  }

  function updateInterests(next: string[]) {
    interestsRef.current = next;
    setInterests(next);
    void persistPreferences(next, preferredLanguagesRef.current);
  }

  function updateLanguages(next: string[]) {
    preferredLanguagesRef.current = next;
    setPreferredLanguages(next);
    void persistPreferences(interestsRef.current, next);
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      if (canEditBasicInfo) {
        await upsertEmailSignupProfile({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim() || undefined,
        });
      }
      const updated = await updateProfileDetails({
        date_of_birth: dateOfBirth || undefined,
        gender: gender.trim() || undefined,
        location_city: locationCity.trim() || undefined,
        location_country: locationCountry.trim() || undefined,
        interests,
        preferred_languages: preferredLanguages,
        experience_level: user.experience_level ?? undefined,
        bio: user.bio ?? undefined,
        emergency_contact_name: user.emergency_contact_name ?? undefined,
        emergency_contact_phone: user.emergency_contact_phone ?? undefined,
        phone_number: phoneNumber.trim() || undefined,
      });
      applyUser(updated);
      setSaveStatus("success");
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save profile.");
    }
  }

  async function handleSelectPresetAvatar(key: string) {
    setAvatarSaving(true);
    setAvatarSaveError(null);
    try {
      const updated = await updateUserAvatar({
        avatar_type: "preset",
        avatar_key: key,
      });
      applyUser(updated);
      setAvatarOpen(false);
    } catch (error) {
      setAvatarSaveError(error instanceof Error ? error.message : "Failed to save avatar.");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleCustomPhotoSelected(file: File | null) {
    if (!file) return;
    setAvatarSaving(true);
    setAvatarSaveError(null);
    try {
      const dataUri = await fileToCompressedDataUri(file);
      const updated = await updateUserAvatar({
        avatar_type: "custom",
        avatar_url: dataUri,
      });
      applyUser(updated);
      setAvatarOpen(false);
    } catch (error) {
      setAvatarSaveError(error instanceof Error ? error.message : "Failed to save photo.");
    } finally {
      setAvatarSaving(false);
      if (customPhotoInputRef.current) {
        customPhotoInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveBookmark(card: BookmarkCard) {
    try {
      await removeBookmark("expert", card.targetId);
      setBookmarkCards((current) => (current ?? []).filter((item) => item.targetId !== card.targetId));
    } catch (error) {
      setBookmarksError(error instanceof Error ? error.message : "Failed to remove bookmark.");
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F6F4F1]">
        <StickyTopNavbar variant="dark" />
        <main className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8">
          <PageErrorState message={loadError} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F4F1] font-['Nunito'] text-[#2F2B28] selection:bg-[#0B6E66] selection:text-white">
      <StickyTopNavbar variant="dark" />

      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 lg:px-8">
        <section
          id="profile"
          className="scroll-mt-28 overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(6,62,56,.14)]"
        >
          <div className="relative h-[160px] overflow-hidden bg-[radial-gradient(ellipse_at_70%_0%,#0B6E66_0%,transparent_55%),linear-gradient(110deg,#063E38,#0B5450)]">
            <div className="absolute -right-8 -top-20 h-64 w-64 rounded-full border-[24px] border-[#9BCDB2]/15" />
            <div className="absolute left-[44%] top-10 h-36 w-3 -rotate-[24deg] bg-[#9BCDB2]/20" />
            <div className="absolute left-[52%] top-2 h-48 w-4 rotate-[38deg] bg-[#9BCDB2]/15" />
          </div>

          <div className="relative flex flex-col gap-5 overflow-visible bg-[#F8F6F3] px-7 pb-6 pt-0 md:flex-row md:items-end">
            <div className="-mt-12 shrink-0 overflow-visible">
              <UserAvatar
                initials={avatarInitials}
                imageUrl={profileAvatarSrc}
                large
                ring
                overflowTop={avatarType === "preset"}
                alt={displayName}
                loading={!user}
              />
              <button
                type="button"
                onClick={() => {
                  setAvatarSaveError(null);
                  setAvatarOpen(true);
                }}
                className="mt-2 flex w-24 items-center justify-center gap-1 rounded-[4px] py-1 text-[11px] font-semibold text-[#0B6E66] transition-colors hover:bg-[#9BCDB2]/20"
              >
                <PencilSimpleIcon size={12} /> Edit photo
              </button>
            </div>

            <div className="flex-1 pb-1">
              {!user ? (
                <p className="text-sm text-[#73706C]">Loading your profile…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1
                      className="text-[20px] font-extrabold tracking-[-0.03em] text-[#3B372F] sm:text-[22px] md:text-[26px]"
                      style={{ fontFamily: '"Montserrat", sans-serif' }}
                    >
                      {displayName}
                    </h1>
                    {user.profile_completed ? (
                      <ShieldCheckIcon size={17} weight="fill" className="text-[#0B6E66]" />
                    ) : null}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-[#73706C]">
                    {cityValue ? (
                      <>
                        <MapPinIcon size={13} /> {cityValue}
                      </>
                    ) : (
                      <span>Add your city to help us match local guides</span>
                    )}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-7 border-t border-[#E3DDD8] pt-4 md:border-l md:border-t-0 md:pl-7 md:pt-0">
              <div>
                <p
                  className="text-[16px] font-extrabold text-[#3B372F] sm:text-[18px] md:text-[20px]"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  {bookings?.length ?? "—"}
                </p>
                <p className="text-[11px] text-[#9A9691]">Trips taken</p>
              </div>
              <div>
                <p
                  className="text-[16px] font-extrabold text-[#3B372F] sm:text-[18px] md:text-[20px]"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                >
                  {bookmarkCards?.length ?? "—"}
                </p>
                <p className="text-[11px] text-[#9A9691]">Saved guides</p>
              </div>
            </div>
          </div>
        </section>

        {avatarOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-1200 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-photo-title"
              >
                <button
                  type="button"
                  className="absolute inset-0 cursor-default"
                  aria-label="Close edit photo dialog"
                  onClick={() => {
                    if (!avatarSaving) setAvatarOpen(false);
                  }}
                />
                <div className="relative z-1 flex max-h-[90svh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-2xl bg-[#F8F6F3] shadow-2xl sm:rounded-2xl">
                  <div className="flex items-start justify-between gap-3 border-b border-[#E3DDD8] px-5 py-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A9691]">
                        Profile
                      </p>
                      <h2
                        id="edit-photo-title"
                        className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-[#3B372F] sm:text-[20px]"
                        style={{ fontFamily: '"Montserrat", sans-serif' }}
                      >
                        Edit photo
                      </h2>
                    </div>
                    <button
                      type="button"
                      disabled={avatarSaving}
                      onClick={() => setAvatarOpen(false)}
                      className="rounded-full p-2 text-[#9A9691] transition-colors hover:bg-[#E8E2DC] hover:text-[#3B372F] disabled:opacity-50"
                      aria-label="Close"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>

                  <div className="overflow-y-auto px-5 py-5">
                    <div className="mb-5 flex justify-center">
                      <UserAvatar
                        initials={avatarInitials}
                        imageUrl={profileAvatarSrc}
                        large
                        ring
                        overflowTop={avatarType === "preset"}
                        alt={displayName}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={avatarSaving}
                      onClick={() => customPhotoInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#0B6E66]/40 bg-white px-4 py-3 text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] disabled:opacity-60"
                    >
                      <UploadSimpleIcon size={16} />
                      {avatarSaving ? "Saving…" : "Upload photo"}
                    </button>
                    <input
                      ref={customPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        void handleCustomPhotoSelected(event.target.files?.[0] ?? null)
                      }
                    />

                    <p className="mt-5 mb-3 text-center text-xs font-semibold text-[#9A9691]">
                      or choose a wildlife avatar
                    </p>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {PRESET_AVATARS.map((avatar) => {
                        const selected = avatarType === "preset" && avatarKey === avatar.key;
                        return (
                          <button
                            key={avatar.key}
                            type="button"
                            disabled={avatarSaving}
                            title={avatar.label}
                            aria-label={`Select ${avatar.label} avatar`}
                            data-avatar-type="preset"
                            data-avatar-key={avatar.key}
                            onClick={() => void handleSelectPresetAvatar(avatar.key)}
                            className={`mx-auto overflow-visible rounded-full p-0.5 transition-transform hover:scale-105 disabled:opacity-60 ${
                              selected ? "ring-2 ring-[#0B6E66] ring-offset-2" : ""
                            }`}
                          >
                            <UserAvatar
                              initials={avatar.label.slice(0, 2)}
                              imageUrl={avatar.src}
                              alt={avatar.label}
                              overflowTop
                              ring
                            />
                          </button>
                        );
                      })}
                    </div>

                    {avatarSaveError ? (
                      <p className="mt-4 text-center text-xs text-[#C94A45]">{avatarSaveError}</p>
                    ) : null}
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className={cardClassName}>
            <SectionTitle icon={UserIcon} eyebrow="Your details" title="Basic details" />
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClassName} htmlFor="account-full-name">
                    Full name
                  </label>
                  <input
                    id="account-full-name"
                    className={inputClassName}
                    value={fullName}
                    disabled={!user || !canEditBasicInfo}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-phone">
                    Phone
                  </label>
                  <input
                    id="account-phone"
                    className={inputClassName}
                    value={phoneNumber}
                    disabled={!user}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Add your phone number"
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-email">
                    Email
                  </label>
                  <input id="account-email" className={inputClassName} value={user?.email ?? ""} disabled />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-dob">
                    Date of birth
                  </label>
                  <input
                    id="account-dob"
                    type="date"
                    className={inputClassName}
                    value={dateOfBirth}
                    disabled={!user}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-gender">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="account-gender"
                      className={`${inputClassName} appearance-none pr-9`}
                      value={gender}
                      disabled={!user}
                      onChange={(event) => setGender(event.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <CaretDownIcon
                      size={13}
                      className="pointer-events-none absolute right-3 top-3.5 text-[#9A9691]"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-city">
                    City
                  </label>
                  <CityPicker
                    value={cityValue}
                    disabled={!user}
                    onChange={(next) => {
                      const parsed = parseCitySelection(next);
                      setLocationCity(parsed.city);
                      setLocationCountry(parsed.country);
                    }}
                  />
                </div>
              </div>

              {!canEditBasicInfo && user ? (
                <p className="text-xs text-[#73706C]">
                  You signed in with Google, so your name is managed by your Google account. Phone number can still
                  be edited here.
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <PrimaryBtn
                  disabled={!user || saveStatus === "saving" || (canEditBasicInfo && fullName.trim().length < 2)}
                  onClick={() => void handleSaveProfile()}
                >
                  {saveStatus === "saving" ? "Saving…" : "Save profile changes"}
                </PrimaryBtn>
                {saveStatus === "success" ? (
                  <span className="text-sm text-[#0B6E66]">Saved.</span>
                ) : null}
                {saveStatus === "error" && saveError ? (
                  <span className="text-sm text-[#C94A45]">{saveError}</span>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <section className={cardClassName}>
              <SectionTitle icon={BinocularsIcon} eyebrow="What moves you" title="Interests" />
              <p className="mb-4 text-[13px] leading-relaxed text-[#73706C]">
                Pick the trails, species and stories you want to find more of. Changes save
                automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ...INTEREST_PRESETS,
                  ...interests.filter(
                    (interest) =>
                      !INTEREST_PRESETS.some((preset) => preset.toLowerCase() === interest.toLowerCase()),
                  ),
                ].map((item) => (
                  <SkillTag
                    key={item}
                    label={item}
                    disabled={!user}
                    selected={interests.some((value) => value.toLowerCase() === item.toLowerCase())}
                    onClick={() => updateInterests(toggleValue(item, interests))}
                  />
                ))}
              </div>
              <AddCustomValue
                placeholder="Add another interest…"
                disabled={!user}
                onAdd={(next) => {
                  const key = next.toLowerCase();
                  if (interests.some((item) => item.toLowerCase() === key)) return false;
                  updateInterests([...interests, next]);
                  return true;
                }}
              />
              {prefsSaveStatus === "saving" ? (
                <p className="mt-3 text-xs text-[#9A9691]">Saving preferences…</p>
              ) : null}
              {prefsSaveStatus === "success" ? (
                <p className="mt-3 text-xs text-[#0B6E66]">Preferences saved.</p>
              ) : null}
              {prefsSaveStatus === "error" && prefsSaveError ? (
                <p className="mt-3 text-xs text-[#C94A45]">{prefsSaveError}</p>
              ) : null}
            </section>

            <section className={cardClassName}>
              <SectionTitle icon={TranslateIcon} eyebrow="How we speak" title="Preferred language" />
              <p className="mb-4 text-[13px] text-[#73706C]">
                Guides who can share the wild in your language. Changes save automatically.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ...LANGUAGE_PRESETS,
                  ...preferredLanguages.filter(
                    (language) =>
                      !LANGUAGE_PRESETS.some((preset) => preset.toLowerCase() === language.toLowerCase()),
                  ),
                ].map((lang) => (
                  <LanguageTag
                    key={lang}
                    label={lang}
                    disabled={!user}
                    selected={preferredLanguages.some(
                      (value) => value.toLowerCase() === lang.toLowerCase(),
                    )}
                    onClick={() => updateLanguages(toggleValue(lang, preferredLanguages))}
                  />
                ))}
              </div>
              <AddCustomValue
                placeholder="Add another language…"
                disabled={!user}
                suggestions={WORLD_LANGUAGES.filter(
                  (language) =>
                    !LANGUAGE_PRESETS.some((preset) => preset.toLowerCase() === language.toLowerCase()) &&
                    !preferredLanguages.some((selected) => selected.toLowerCase() === language.toLowerCase()),
                )}
                onAdd={(next) => {
                  const key = next.toLowerCase();
                  if (preferredLanguages.some((item) => item.toLowerCase() === key)) return false;
                  updateLanguages([...preferredLanguages, next]);
                  return true;
                }}
              />
            </section>
          </div>
        </div>

        <section id="bookings" className={`scroll-mt-28 mt-5 ${cardClassName}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionTitle icon={CalendarDotsIcon} eyebrow="Your journeys" title="My bookings" />
            <div className="flex h-9 rounded-[4px] bg-[#F6F4F1] p-1">
              {(
                [
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Past" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBookingsTab(tab.id)}
                  className={`rounded-[4px] px-4 py-1.5 text-xs font-semibold transition-colors ${
                    bookingsTab === tab.id
                      ? "bg-white text-[#0B6E66] shadow-sm"
                      : "text-[#73706C]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {bookingsError ? (
              <PageErrorState message={bookingsError} />
            ) : bookings === null ? (
              <p className="text-sm text-[#73706C]">Loading your bookings…</p>
            ) : visibleBookings.length === 0 ? (
              <EmptyState>
                <p>{bookingsTab === "upcoming" ? "No upcoming bookings." : "No past bookings yet."}</p>
                {bookingsTab === "upcoming" ? (
                  <Link
                    to="/experts"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-[4px] bg-[#0B6E66] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#095B54]"
                  >
                    Explore experts
                  </Link>
                ) : null}
              </EmptyState>
            ) : (
              <div className="grid gap-3">
                {visibleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`flex flex-col gap-4 rounded-[8px] border border-[#E3DDD8] bg-[#F8F6F3] p-4 transition-colors hover:border-[#9BCDB2] md:flex-row md:items-center ${
                      bookingsTab === "past" ? "opacity-80 hover:opacity-100" : ""
                    }`}
                  >
                    <UserAvatar
                      initials="WB"
                      color={bookingsTab === "past" ? "#E3DDD8" : "#C8DED5"}
                      ring
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#3B372F]">
                          {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                        </p>
                        <span
                          className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold ${
                            booking.status === "confirmed"
                              ? "bg-[#9BCDB2]/40 text-[#0B6E66]"
                              : booking.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-[#E8E2DC] text-[#73706C]"
                          }`}
                        >
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#73706C]">
                        {booking.adults} {booking.adults === 1 ? "adult" : "adults"}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold text-[#3B372F]">{formatDate(booking.check_in)}</p>
                      <p className="mt-1 text-xs text-[#73706C]">
                        {booking.currency} {booking.total_amount.toLocaleString()}
                      </p>
                    </div>
                    {bookingsTab === "past" ? (
                      <Link
                        to={`/accommodations/${booking.accommodation_id}`}
                        className="inline-flex items-center gap-2 rounded-[4px] border border-[#D7D2CC] bg-white px-3 py-2 text-xs font-semibold text-[#73706C] transition-colors hover:bg-[#F6F4F1]"
                      >
                        View details
                      </Link>
                    ) : (
                      <SecondaryBtn href={`/accommodations/${booking.accommodation_id}`}>
                        View details
                      </SecondaryBtn>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

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
                Explore experts
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

        <div className="mt-8 flex items-center justify-center border-t border-[#E3DDD8] pt-7">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-[4px] border border-[#C94A45]/40 px-5 py-2.5 text-sm font-semibold text-[#C94A45] transition-colors hover:bg-[#FFF0EF]"
          >
            <SignOutIcon size={15} /> Log out of wildbook
          </button>
        </div>
      </main>
    </div>
  );
}
