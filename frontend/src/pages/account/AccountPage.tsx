import {
  ArrowLeftIcon,
  ArrowRightIcon,
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
  type AvatarUpdateInput,
  type CurrentUser,
} from "../../api/auth";
import {
  fetchMyAccommodationBookings,
  type AccommodationBookingSummary,
} from "../../api/accommodationBookings";
import { fetchBookmarks, removeBookmark, type Bookmark } from "../../api/bookmarks";
import { fetchExpertById, type ExpertDetail } from "../../api/experts";
import { useAuth } from "../../auth/AuthProvider";
import { AvatarCropper } from "../../components/common/AvatarCropper";
import { StickyTopNavbar } from "../../components/common/StickyTopNavbar";
import { PageErrorState } from "../../components/common/PageErrorState";
import { UserAvatar } from "../../components/common/UserAvatar";
import { WORLD_LANGUAGES } from "../../data/languages";
import {
  composePhoneNumber,
  DEFAULT_PHONE_DIAL,
  dialOptionLabel,
  findDialOption,
  parsePhoneParts,
  PHONE_DIAL_CODES,
} from "../../data/phoneDialCodes";
import {
  DEFAULT_PROFILE_COUNTRY,
  PROFILE_COUNTRIES,
  PROFILE_LOCATIONS,
} from "../../data/profileLocations";
import {
  PRESET_AVATARS,
  resolvePresetAvatarSrc,
  resolveUserAvatarSrc,
} from "../../data/presetAvatars";
import { validateNationalPhone, validateProfileForm, type ProfileField } from "../../lib/profileValidation";

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

/** Prefer a real country; legacy rows stored Indian states in location_country. */
function normalizeStoredCountry(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if ((PROFILE_COUNTRIES as readonly string[]).includes(trimmed)) return trimmed;
  return DEFAULT_PROFILE_COUNTRY;
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

/** Custom profile photos are cropped to a square — UserAvatar shows them in a circle. */
const AVATAR_CROP_ASPECT_RATIO = 1;

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

/** Shared trigger style for gender / location / country / DOB dropdowns. */
const dropdownTriggerClassName =
  "relative flex w-full items-center justify-between rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 py-2.5 text-left font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors hover:border-[#B5B0AB] focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60";

function DialCodeSelect({
  value,
  onChange,
  disabled,
  invalid = false,
}: {
  value: string;
  onChange: (dial: string) => void;
  disabled?: boolean;
  invalid?: boolean;
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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const needle = query.trim().toLowerCase();
  const list = PHONE_DIAL_CODES.filter((option) => {
    if (!needle) return true;
    return (
      option.dial.toLowerCase().includes(needle) ||
      option.label.toLowerCase().includes(needle) ||
      dialOptionLabel(option).toLowerCase().includes(needle)
    );
  });

  return (
    <div ref={rootRef} className="relative w-[4.75rem] shrink-0">
      <button
        type="button"
        id="account-phone-dial"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        aria-label="Country code"
        title={findDialOption(value)?.label ?? value}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} px-2 ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="truncate font-medium tabular-nums">{value}</span>
        <CaretDownIcon size={11} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-[min(18rem,calc(100vw-3rem))] overflow-hidden rounded-[6px] border border-[#E3DDD8] bg-white shadow-lg">
          <div className="border-b border-[#E3DDD8] p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country or code…"
              className="h-9 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm outline-none focus:border-[#0B6E66]"
            />
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {list.length === 0 ? (
              <li className="px-3 py-2 font-['Nunito'] text-sm text-[#73706C]">No matches.</li>
            ) : (
              list.map((option) => {
                const selected = option.dial === value;
                return (
                  <li key={`${option.dial}-${option.label}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.dial);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-[4px] px-3 py-2 font-['Nunito'] text-sm font-medium transition-colors hover:bg-[#F6F4F1] ${
                        selected ? "text-[#0B6E66]" : "text-[#2F2B28]"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="tabular-nums">{option.dial}</span>
                        <span className="text-[#73706C]"> · {option.label}</span>
                      </span>
                      {selected ? <CheckIcon size={13} className="shrink-0 text-[#0B6E66]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AccountSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  searchable = false,
  invalid = false,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
  searchable?: boolean;
  invalid?: boolean;
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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const optionsWithValue =
    value && !(options as readonly string[]).includes(value) ? [value, ...options] : [...options];
  const list = searchable
    ? optionsWithValue.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
    : optionsWithValue;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {searchable ? <MagnifyingGlassIcon size={13} className="shrink-0 text-[#9A9691]" /> : null}
          <span className={`truncate ${value ? "text-[#2F2B28]" : "text-[#9A9691]"}`}>
            {value || placeholder}
          </span>
        </span>
        <CaretDownIcon size={12} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[6px] border border-[#E3DDD8] bg-white shadow-lg">
          {searchable ? (
            <div className="border-b border-[#E3DDD8] p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                className="h-9 w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 font-['Nunito'] text-sm outline-none focus:border-[#0B6E66]"
              />
            </div>
          ) : null}
          <ul className={`max-h-[200px] overflow-y-auto ${searchable ? "py-1" : "p-1.5"}`}>
            {list.length === 0 ? (
              <li className="px-3 py-2 font-['Nunito'] text-sm text-[#73706C]">No options found.</li>
            ) : (
              list.map((option) => {
                const selected = option === value;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between rounded-[4px] px-3 py-2 font-['Nunito'] text-sm font-medium transition-colors hover:bg-[#F6F4F1] ${
                        selected ? "text-[#0B6E66]" : "text-[#2F2B28]"
                      }`}
                    >
                      {option}
                      {selected ? <CheckIcon size={13} className="shrink-0 text-[#0B6E66]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const CAL_YEAR_CHUNK = 12;

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function BirthDatePicker({
  value,
  onChange,
  disabled,
  max = todayIsoDate(),
  invalid = false,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  max?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [calView, setCalView] = useState<"day" | "month" | "year">("day");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const maxParsed = parseIsoDate(max) ?? parseIsoDate(todayIsoDate())!;
  const selected = parseIsoDate(value);
  const minYear = maxParsed.year - 120;

  const [nav, setNav] = useState({
    year: selected?.year ?? maxParsed.year,
    month: selected?.month ?? maxParsed.month,
  });

  useEffect(() => {
    if (!open) return;
    setCalView("day");
    if (selected) {
      setNav({ year: selected.year, month: selected.month });
    } else {
      setNav({ year: maxParsed.year, month: maxParsed.month });
    }
  }, [open, selected?.year, selected?.month, maxParsed.year, maxParsed.month]);

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

  const yearBase = Math.floor(nav.year / CAL_YEAR_CHUNK) * CAL_YEAR_CHUNK;
  const isNextYearChunkDisabled = yearBase + CAL_YEAR_CHUNK > maxParsed.year;
  const isPrevYearChunkDisabled = yearBase - CAL_YEAR_CHUNK < minYear;
  const isNextNavYearDisabled = nav.year >= maxParsed.year;
  const isPrevNavYearDisabled = nav.year <= minYear;

  const firstWeekday = new Date(nav.year, nav.month - 1, 1).getDay();
  const totalDays = daysInMonth(nav.year, nav.month);
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  const isNextMonthDisabled =
    nav.year > maxParsed.year || (nav.year === maxParsed.year && nav.month >= maxParsed.month);
  const isPrevMonthDisabled =
    nav.year < minYear || (nav.year === minYear && nav.month <= 1);

  function prevMonth() {
    setNav((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { ...current, month: current.month - 1 },
    );
  }

  function nextMonth() {
    setNav((current) => {
      const next =
        current.month === 12
          ? { year: current.year + 1, month: 1 }
          : { ...current, month: current.month + 1 };
      if (next.year > maxParsed.year || (next.year === maxParsed.year && next.month > maxParsed.month)) {
        return current;
      }
      return next;
    });
  }

  function isFutureDay(day: number): boolean {
    return toIsoDate(nav.year, nav.month, day) > max;
  }

  function isDaySelected(day: number): boolean {
    return Boolean(
      selected && selected.year === nav.year && selected.month === nav.month && selected.day === day,
    );
  }

  const arrowBtn = (disabledArrow: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-[4px] transition-colors ${
      disabledArrow ? "cursor-not-allowed text-[#D7D2CC]" : "text-[#73706C] hover:bg-[#F6F4F1]"
    }`;
  const headerBtn =
    "font-['Nunito'] text-[13px] font-semibold text-[#3B372F] transition-colors hover:text-[#0B6E66]";

  const displayValue = selected
    ? new Date(selected.year, selected.month - 1, selected.day).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="account-dob"
        disabled={disabled}
        aria-invalid={invalid}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${dropdownTriggerClassName} ${
          invalid ? "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDotsIcon size={14} className="shrink-0 text-[#9A9691]" />
          <span className={`truncate ${displayValue ? "text-[#2F2B28]" : "text-[#9A9691]"}`}>
            {displayValue || "Select date…"}
          </span>
        </span>
        <CaretDownIcon size={12} className="shrink-0 text-[#9A9691]" />
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-[272px] select-none rounded-[6px] border border-[#E3DDD8] bg-white p-3 shadow-lg">
          {calView === "year" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevYearChunkDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year - CAL_YEAR_CHUNK }))}
                  className={arrowBtn(isPrevYearChunkDisabled)}
                  aria-label="Previous years"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("day")} className={headerBtn}>
                  {yearBase}–{yearBase + CAL_YEAR_CHUNK - 1}
                </button>
                <button
                  type="button"
                  disabled={isNextYearChunkDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year + CAL_YEAR_CHUNK }))}
                  className={arrowBtn(isNextYearChunkDisabled)}
                  aria-label="Next years"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: CAL_YEAR_CHUNK }, (_, index) => yearBase + index).map((year) => {
                  const isFutureYear = year > maxParsed.year || year < minYear;
                  const isSelectedYear = selected?.year === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={isFutureYear}
                      onClick={() => {
                        setNav((current) => ({ ...current, year }));
                        setCalView("month");
                      }}
                      className={`rounded-[6px] py-2.5 font-['Nunito'] text-[12px] font-medium transition-colors ${
                        isSelectedYear
                          ? "bg-[#0B6E66] text-white"
                          : isFutureYear
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : year === maxParsed.year
                              ? "font-bold text-[#0B6E66] hover:bg-[#E8F4F2]"
                              : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {calView === "month" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevNavYearDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year - 1 }))}
                  className={arrowBtn(isPrevNavYearDisabled)}
                  aria-label="Previous year"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("year")} className={headerBtn}>
                  {nav.year}
                </button>
                <button
                  type="button"
                  disabled={isNextNavYearDisabled}
                  onClick={() => setNav((current) => ({ ...current, year: current.year + 1 }))}
                  className={arrowBtn(isNextNavYearDisabled)}
                  aria-label="Next year"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1;
                  const isFutureMonth =
                    nav.year > maxParsed.year ||
                    (nav.year === maxParsed.year && month > maxParsed.month) ||
                    nav.year < minYear;
                  const isSelectedMonth = selected?.year === nav.year && selected?.month === month;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={isFutureMonth}
                      onClick={() => {
                        setNav((current) => ({ ...current, month }));
                        setCalView("day");
                      }}
                      className={`rounded-[6px] py-2.5 font-['Nunito'] text-[12px] font-medium transition-colors ${
                        isSelectedMonth
                          ? "bg-[#0B6E66] text-white"
                          : isFutureMonth
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {label.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {calView === "day" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isPrevMonthDisabled}
                  onClick={prevMonth}
                  className={arrowBtn(isPrevMonthDisabled)}
                  aria-label="Previous month"
                >
                  <ArrowLeftIcon size={13} />
                </button>
                <button type="button" onClick={() => setCalView("year")} className={headerBtn}>
                  {MONTH_LABELS[nav.month - 1]} {nav.year}
                </button>
                <button
                  type="button"
                  disabled={isNextMonthDisabled}
                  onClick={nextMonth}
                  className={arrowBtn(isNextMonthDisabled)}
                  aria-label="Next month"
                >
                  <ArrowRightIcon size={13} />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 text-center">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="font-['Nunito'] text-[10px] font-semibold text-[#9A9691]">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {cells.map((day, index) => {
                  if (day === null) return <span key={`empty-${index}`} />;
                  const future = isFutureDay(day);
                  const selectedDay = isDaySelected(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={future}
                      onClick={() => {
                        onChange(toIsoDate(nav.year, nav.month, day));
                        setOpen(false);
                      }}
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-['Nunito'] text-[12px] font-medium transition-colors ${
                        selectedDay
                          ? "bg-[#0B6E66] text-white"
                          : future
                            ? "cursor-not-allowed text-[#D7D2CC]"
                            : "text-[#3B372F] hover:bg-[#E8F4F2] hover:text-[#0B6E66]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 py-2.5 font-['Nunito'] text-sm font-medium text-[#2F2B28] outline-none transition-colors focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60";

const inputErrorClassName = "border-[#C94A45] focus:border-[#C94A45] focus:ring-[#C94A45]/20";

const labelClassName = "mb-1.5 block font-['Nunito'] text-[11px] font-semibold text-[#9A9691]";

const SAVED_MESSAGE_MS = 3500;

const BASIC_PROFILE_FIELDS: ProfileField[] = [
  "fullName",
  "dateOfBirth",
  "gender",
  "locationCity",
  "locationCountry",
];

/** Phone edit UI is temporarily frozen; keep the control visible but read-only. */
const PHONE_EDIT_FROZEN = true;

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 font-['Nunito'] text-[12px] text-[#C94A45]">
      {message}
    </p>
  );
}

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
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNational, setPhoneNational] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<ProfileField[]>([]);
  const [prefsSaveStatus, setPrefsSaveStatus] = useState<SaveStatus>("idle");
  const [prefsSaveError, setPrefsSaveError] = useState<string | null>(null);
  const prefsSaveSeqRef = useRef(0);
  const interestsRef = useRef<string[]>([]);
  const preferredLanguagesRef = useRef<string[]>([]);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarType, setAvatarType] = useState<AvatarType | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarSourceUrl, setAvatarSourceUrl] = useState<string | null>(null);
  const [avatarSaveError, setAvatarSaveError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [pendingPresetKey, setPendingPresetKey] = useState<string | null>(null);
  /** Active crop session: fresh file upload, or a saved source for re-edit. */
  const [cropSource, setCropSource] = useState<
    { kind: "file"; file: File } | { kind: "url"; url: string } | null
  >(null);
  const customPhotoInputRef = useRef<HTMLInputElement | null>(null);

  function closeAvatarModal() {
    setAvatarOpen(false);
    setPendingPresetKey(null);
    setCropSource(null);
  }

  useEffect(() => {
    if (!avatarOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !avatarSaving) {
        closeAvatarModal();
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
    const phoneParts = parsePhoneParts(current.phone_number);
    setPhoneDial(phoneParts.dial);
    setPhoneNational(phoneParts.national);
    setDateOfBirth(current.date_of_birth ?? "");
    setGender(current.gender ?? "");
    setLocationCity(current.location_city ?? "");
    setLocationCountry(normalizeStoredCountry(current.location_country ?? ""));
    setInterests(current.interests);
    setPreferredLanguages(current.preferred_languages);
    interestsRef.current = current.interests;
    preferredLanguagesRef.current = current.preferred_languages;
    setAvatarType(current.avatar_type);
    setAvatarKey(current.avatar_key);
    setAvatarUrl(current.avatar_url);
    setAvatarSourceUrl(current.avatar_source_url);
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
  const phoneNumber = composePhoneNumber(phoneDial, phoneNational);
  const profileAvatarSrc = resolveUserAvatarSrc({
    avatarType,
    avatarKey,
    avatarUrl,
  });
  const pendingPresetSrc = resolvePresetAvatarSrc(pendingPresetKey);
  const avatarPreviewSrc = pendingPresetSrc ?? profileAvatarSrc;
  const avatarPreviewOverflowTop = pendingPresetKey !== null || avatarType === "preset";
  const presetSelectionChanged =
    pendingPresetKey !== null && !(avatarType === "preset" && avatarKey === pendingPresetKey);
  const cityValue = cityDisplayValue(locationCity, locationCountry);
  const canEditBasicInfo = user?.auth_provider === "EMAIL";

  const baseErrors = validateProfileForm(
    {
      fullName,
      phoneNumber,
      bio: user?.bio ?? "",
      dateOfBirth,
      gender,
      locationCity,
      locationCountry,
      interests,
      preferredLanguages,
      emergencyContactName: user?.emergency_contact_name ?? "",
      emergencyContactPhone: user?.emergency_contact_phone ?? "",
    },
    canEditBasicInfo,
  );
  const nationalPhoneError = PHONE_EDIT_FROZEN ? null : validateNationalPhone(phoneNational);
  const validationErrors = nationalPhoneError
    ? { ...baseErrors, phoneNumber: nationalPhoneError }
    : baseErrors;

  const markTouched = (...fields: ProfileField[]) => {
    setTouchedFields((current) => [...new Set([...current, ...fields])]);
  };
  const visibleError = (field: ProfileField): string | undefined =>
    touchedFields.includes(field) ? validationErrors[field] : undefined;
  const hasBasicErrors = BASIC_PROFILE_FIELDS.some((field) => validationErrors[field]);

  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = window.setTimeout(() => setSaveStatus("idle"), SAVED_MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [saveStatus]);

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
    markTouched(...BASIC_PROFILE_FIELDS);
    if (hasBasicErrors) {
      setSaveStatus("error");
      setSaveError("Please fix the highlighted fields.");
      return;
    }
    setSaveStatus("saving");
    setSaveError(null);
    try {
      if (canEditBasicInfo) {
        await upsertEmailSignupProfile({
          full_name: fullName.trim(),
          phone_number: phoneNumber || undefined,
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
        phone_number: phoneNumber || undefined,
      });
      applyUser(updated);
      setSaveStatus("success");
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save profile.");
    }
  }

  async function saveAvatar(payload: AvatarUpdateInput) {
    setAvatarSaving(true);
    setAvatarSaveError(null);
    try {
      const updated = await updateUserAvatar(payload);
      applyUser(updated);
      closeAvatarModal();
    } catch (error) {
      setAvatarSaveError(error instanceof Error ? error.message : "Failed to save photo.");
    } finally {
      setAvatarSaving(false);
    }
  }

  function handlePhotoFileSelected(file: File | null) {
    if (customPhotoInputRef.current) {
      customPhotoInputRef.current.value = "";
    }
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarSaveError("Please choose an image file.");
      return;
    }
    setAvatarSaveError(null);
    setPendingPresetKey(null);
    setCropSource({ kind: "file", file });
  }

  function openAdjustCrop() {
    const url = avatarSourceUrl ?? avatarUrl;
    if (!url) return;
    setAvatarSaveError(null);
    setPendingPresetKey(null);
    setCropSource({ kind: "url", url });
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
                  setPendingPresetKey(avatarType === "preset" ? avatarKey : null);
                  setCropSource(null);
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
                    if (!avatarSaving) closeAvatarModal();
                  }}
                />
                <div className="relative z-1 flex max-h-[90svh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-[#F8F6F3] shadow-2xl sm:rounded-2xl">
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
                        {cropSource ? "Crop photo" : "Edit photo"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      disabled={avatarSaving}
                      onClick={() => closeAvatarModal()}
                      className="rounded-full p-2 text-[#9A9691] transition-colors hover:bg-[#E8E2DC] hover:text-[#3B372F] disabled:opacity-50"
                      aria-label="Close"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>

                  <div className={`overflow-y-auto ${cropSource ? "px-4 py-4 sm:px-5 sm:py-5" : "px-5 py-5"}`}>
                    {cropSource ? (
                      <AvatarCropper
                        file={cropSource.kind === "file" ? cropSource.file : undefined}
                        sourceUrl={cropSource.kind === "url" ? cropSource.url : undefined}
                        aspectRatio={AVATAR_CROP_ASPECT_RATIO}
                        saving={avatarSaving}
                        onCancel={() => setCropSource(null)}
                        onSave={({ croppedDataUri, sourceDataUri }) =>
                          void saveAvatar({
                            avatar_type: "custom",
                            avatar_url: croppedDataUri,
                            avatar_source_url: sourceDataUri,
                          })
                        }
                      />
                    ) : (
                      <>
                        <div className="mb-5 flex justify-center">
                          <UserAvatar
                            initials={avatarInitials}
                            imageUrl={avatarPreviewSrc}
                            large
                            ring
                            overflowTop={avatarPreviewOverflowTop}
                            alt={displayName}
                          />
                        </div>

                        {avatarType === "custom" && (avatarSourceUrl || avatarUrl) ? (
                          <button
                            type="button"
                            disabled={avatarSaving}
                            onClick={openAdjustCrop}
                            className="mb-3 flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#0B6E66]/40 bg-white px-4 py-3 text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] disabled:opacity-60"
                          >
                            <PencilSimpleIcon size={16} />
                            Adjust crop
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={avatarSaving}
                          onClick={() => customPhotoInputRef.current?.click()}
                          className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#0B6E66]/40 bg-white px-4 py-3 text-sm font-semibold text-[#0B6E66] transition-colors hover:bg-[#E0F0EC] disabled:opacity-60"
                        >
                          <UploadSimpleIcon size={16} />
                          {avatarType === "custom" ? "Upload new photo" : "Upload photo"}
                        </button>

                        <p className="mt-5 mb-3 text-center text-xs font-semibold text-[#9A9691]">
                          or choose a wildlife avatar
                        </p>
                        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                          {PRESET_AVATARS.map((avatar) => {
                            const selected =
                              pendingPresetKey !== null
                                ? pendingPresetKey === avatar.key
                                : avatarType === "preset" && avatarKey === avatar.key;
                            return (
                              <button
                                key={avatar.key}
                                type="button"
                                disabled={avatarSaving}
                                title={avatar.label}
                                aria-label={`Select ${avatar.label} avatar`}
                                aria-pressed={selected}
                                data-avatar-type="preset"
                                data-avatar-key={avatar.key}
                                onClick={() => setPendingPresetKey(avatar.key)}
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

                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E3DDD8] pt-5">
                          <button
                            type="button"
                            disabled={avatarSaving}
                            onClick={() => closeAvatarModal()}
                            className="rounded-[4px] border border-[#D7D2CC] bg-white px-4 py-2.5 text-sm font-semibold text-[#3B372F] transition-colors hover:bg-[#F6F4F1] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <PrimaryBtn
                            disabled={avatarSaving || !presetSelectionChanged}
                            onClick={() => {
                              if (!pendingPresetKey) return;
                              void saveAvatar({
                                avatar_type: "preset",
                                avatar_key: pendingPresetKey,
                              });
                            }}
                          >
                            {avatarSaving ? "Saving…" : "Save avatar"}
                          </PrimaryBtn>
                        </div>
                      </>
                    )}

                    <input
                      ref={customPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handlePhotoFileSelected(event.target.files?.[0] ?? null)
                      }
                    />

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
                    className={`${inputClassName} ${visibleError("fullName") ? inputErrorClassName : ""}`}
                    value={fullName}
                    disabled={!user || !canEditBasicInfo}
                    aria-invalid={Boolean(visibleError("fullName"))}
                    aria-describedby={visibleError("fullName") ? "account-full-name-error" : undefined}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      markTouched("fullName");
                    }}
                    onBlur={() => markTouched("fullName")}
                  />
                  <FieldError id="account-full-name-error" message={visibleError("fullName")} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClassName} htmlFor="account-phone">
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <DialCodeSelect
                      value={phoneDial}
                      disabled={!user || PHONE_EDIT_FROZEN}
                      invalid={!PHONE_EDIT_FROZEN && Boolean(visibleError("phoneNumber"))}
                      onChange={(dial) => {
                        setPhoneDial(dial);
                        markTouched("phoneNumber");
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        id="account-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        className={`${inputClassName} ${
                          !PHONE_EDIT_FROZEN && visibleError("phoneNumber") ? inputErrorClassName : ""
                        }`}
                        value={phoneNational}
                        disabled={!user || PHONE_EDIT_FROZEN}
                        readOnly={PHONE_EDIT_FROZEN}
                        placeholder="Phone number"
                        aria-invalid={!PHONE_EDIT_FROZEN && Boolean(visibleError("phoneNumber"))}
                        aria-describedby={
                          !PHONE_EDIT_FROZEN && visibleError("phoneNumber")
                            ? "account-phone-error"
                            : undefined
                        }
                        onChange={(event) => {
                          if (PHONE_EDIT_FROZEN) return;
                          setPhoneNational(event.target.value.replace(/[^\d\s-]/g, ""));
                          markTouched("phoneNumber");
                        }}
                        onBlur={() => {
                          if (!PHONE_EDIT_FROZEN) markTouched("phoneNumber");
                        }}
                      />
                    </div>
                  </div>
                  {!PHONE_EDIT_FROZEN ? (
                    <FieldError id="account-phone-error" message={visibleError("phoneNumber")} />
                  ) : null}
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
                  <BirthDatePicker
                    value={dateOfBirth}
                    disabled={!user}
                    invalid={Boolean(visibleError("dateOfBirth"))}
                    onChange={(next) => {
                      setDateOfBirth(next);
                      markTouched("dateOfBirth");
                    }}
                  />
                  <FieldError id="account-dob-error" message={visibleError("dateOfBirth")} />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-gender">
                    Gender
                  </label>
                  <AccountSelect
                    value={gender}
                    onChange={(next) => {
                      setGender(next);
                      markTouched("gender");
                    }}
                    options={GENDER_OPTIONS}
                    placeholder="Prefer not to say"
                    disabled={!user}
                    invalid={Boolean(visibleError("gender"))}
                  />
                  <FieldError id="account-gender-error" message={visibleError("gender")} />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-location">
                    Location
                  </label>
                  <AccountSelect
                    value={locationCity}
                    onChange={(next) => {
                      setLocationCity(next);
                      if (!locationCountry) setLocationCountry(DEFAULT_PROFILE_COUNTRY);
                      markTouched("locationCity");
                    }}
                    options={PROFILE_LOCATIONS}
                    placeholder="Select location…"
                    disabled={!user}
                    searchable
                    invalid={Boolean(visibleError("locationCity"))}
                  />
                  <FieldError id="account-location-error" message={visibleError("locationCity")} />
                </div>
                <div>
                  <label className={labelClassName} htmlFor="account-country">
                    Country
                  </label>
                  <AccountSelect
                    value={locationCountry}
                    onChange={(next) => {
                      setLocationCountry(next);
                      markTouched("locationCountry");
                    }}
                    options={PROFILE_COUNTRIES}
                    placeholder="Select country…"
                    disabled={!user}
                    searchable
                    invalid={Boolean(visibleError("locationCountry"))}
                  />
                  <FieldError id="account-country-error" message={visibleError("locationCountry")} />
                </div>
              </div>

              {!canEditBasicInfo && user ? (
                <p className="text-xs text-[#73706C]">
                  You signed in with Google, so your name is managed by your Google account.
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
                    Explore Experts
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
