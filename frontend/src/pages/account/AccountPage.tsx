import {
  BinocularsIcon,
  MapPinIcon,
  PencilSimpleIcon,
  SignOutIcon,
  TranslateIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  fetchCurrentUser,
  updateProfileDetails,
  updateUserAvatar,
  upsertEmailSignupProfile,
  type AvatarType,
  type AvatarUpdateInput,
  type CurrentUser,
} from "../../api/auth";
import { useAuth } from "../../auth/AuthProvider";
import { AccountAvatarModal } from "../../components/account/AccountAvatarModal";
import { AccountBookingsSection } from "../../components/account/AccountBookingsSection";
import { AccountBookmarksSection } from "../../components/account/AccountBookmarksSection";
import {
  AccountSelect,
  AddCustomValue,
  DialCodeSelect,
  PrimaryBtn,
  SelectableTag,
} from "../../components/account/AccountFormControls";
import { BirthDatePicker } from "../../components/account/BirthDatePicker";
import { cardClassName, SectionTitle } from "../../components/account/AccountSection";
import { StickyTopNavbar } from "../../components/common/StickyTopNavbar";
import { PageErrorState } from "../../components/common/PageErrorState";
import { UserAvatar } from "../../components/common/UserAvatar";
import { WORLD_LANGUAGES } from "../../data/languages";
import {
  composePhoneNumber,
  DEFAULT_PHONE_DIAL,
  parsePhoneParts,
} from "../../data/phoneDialCodes";
import {
  normalizeStoredLocation,
  PROFILE_COUNTRIES,
  statesForCountry,
} from "../../data/profileLocations";
import { resolveUserAvatarSrc } from "../../data/presetAvatars";
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

type SaveStatus = "idle" | "saving" | "success" | "error";

function initialsFromName(name: string | null | undefined, fallback = "WB"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (!first) return fallback;
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

function locationDisplayValue(region: string, country: string): string {
  const parts = [region.trim(), country.trim()].filter(Boolean);
  return parts.join(", ");
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

  function applyUser(current: CurrentUser) {
    setUser(current);
    setProfile(current);
    setFullName(current.full_name ?? "");
    const phoneParts = parsePhoneParts(current.phone_number);
    setPhoneDial(phoneParts.dial);
    setPhoneNational(phoneParts.national);
    setDateOfBirth(current.date_of_birth ?? "");
    setGender(current.gender ?? "");
    const location = normalizeStoredLocation(
      current.location_city ?? "",
      current.location_country ?? "",
    );
    setLocationCity(location.region);
    setLocationCountry(location.country);
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

  const displayName = fullName.trim() || user?.email || "Wildbook traveller";
  const avatarInitials = initialsFromName(displayName);
  const phoneNumber = composePhoneNumber(phoneDial, phoneNational);
  const profileAvatarSrc = resolveUserAvatarSrc({
    avatarType,
    avatarKey,
    avatarUrl,
  });
  const locationValue = locationDisplayValue(locationCity, locationCountry);
  const regionOptions = statesForCountry(locationCountry);
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
      setAvatarOpen(false);
    } catch (error) {
      setAvatarSaveError(error instanceof Error ? error.message : "Failed to save photo.");
    } finally {
      setAvatarSaving(false);
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
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-[#73706C]">
                    {locationValue ? (
                      <>
                        <MapPinIcon size={13} /> {locationValue}
                      </>
                    ) : (
                      <span>Add your location to help us match local guides</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <AccountAvatarModal
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          displayName={displayName}
          initials={avatarInitials}
          avatarType={avatarType}
          avatarKey={avatarKey}
          avatarUrl={avatarUrl}
          avatarSourceUrl={avatarSourceUrl}
          saving={avatarSaving}
          saveError={avatarSaveError}
          onSave={saveAvatar}
        />

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
                  <label className={labelClassName} htmlFor="account-country">
                    Country
                  </label>
                  <AccountSelect
                    value={locationCountry}
                    onChange={(next) => {
                      setLocationCountry(next);
                      if (!statesForCountry(next).includes(locationCity)) {
                        setLocationCity("");
                      }
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
                <div>
                  <label className={labelClassName} htmlFor="account-location">
                    State / region
                  </label>
                  <AccountSelect
                    value={locationCity}
                    onChange={(next) => {
                      setLocationCity(next);
                      markTouched("locationCity");
                    }}
                    options={regionOptions}
                    placeholder={
                      locationCountry ? "Select state / region…" : "Select country first…"
                    }
                    disabled={!user || !locationCountry || regionOptions.length === 0}
                    searchable
                    invalid={Boolean(visibleError("locationCity"))}
                  />
                  <FieldError id="account-location-error" message={visibleError("locationCity")} />
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
                  <SelectableTag
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
                  <SelectableTag
                    key={lang}
                    variant="language"
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

        <AccountBookingsSection />
        <AccountBookmarksSection />

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
