import { useEffect, useState } from "react";
import {
  fetchCurrentUser,
  updateProfileDetails,
  upsertEmailSignupProfile,
  type CurrentUser,
  type TravelExperienceLevel,
} from "../../api/auth";
import { PageErrorState } from "../../components/common/PageErrorState";
import { LanguageSelect } from "../../components/guide/LanguageSelect";
import { TagSelector } from "../../components/guide/TagSelector";
import { WORLD_LANGUAGES } from "../../data/languages";
import { PROFILE_LIMITS, validateProfileForm, type ProfileField } from "../../lib/profileValidation";

const ROLE_LABELS: Record<CurrentUser["role"], string> = {
  USER: "Traveller",
  GUIDE: "Guide",
  ADMIN: "Admin",
};

const INTEREST_PRESETS = [
  "Birding",
  "Herping",
  "Mammals",
  "Botany",
  "Entomology",
  "Photography",
  "Trekking",
  "Night Safari",
  "Marine Life",
  "Big Cats",
] as const;

const LANGUAGE_PRESETS = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi"] as const;

const EXPERIENCE_LEVEL_LABELS: Record<TravelExperienceLevel, string> = {
  beginner: "Beginner — new to wildlife travel",
  intermediate: "Intermediate — been on a few trips",
  advanced: "Advanced — seasoned wildlife traveller",
};

const inputClassName =
  "h-11 w-full rounded border border-black/10 bg-white px-4 text-[15px] text-[#2f2b28] outline-none focus:border-(--color-wildbook-teal) disabled:bg-black/5 disabled:text-(--color-wildbook-muted)";

const textAreaClassName =
  "min-h-[96px] w-full rounded border border-black/10 bg-white px-4 py-3 text-[15px] text-[#2f2b28] outline-none focus:border-(--color-wildbook-teal)";

const errorClassName = "border-red-500 focus:border-red-500";

const labelClassName = "mb-1.5 block text-sm font-medium text-(--color-wildbook-text)";

const BASIC_INFO_FIELDS: ProfileField[] = ["fullName", "phoneNumber"];

const PERSONAL_DETAILS_FIELDS: ProfileField[] = [
  "phoneNumber",
  "bio",
  "dateOfBirth",
  "gender",
  "locationCity",
  "locationCountry",
  "interests",
  "preferredLanguages",
  "emergencyContactName",
  "emergencyContactPhone",
];

type SaveStatus = "idle" | "saving" | "success" | "error";

const SAVED_MESSAGE_MS = 3500;

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-red-600">
      {message}
    </p>
  );
}

export function MyProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [basicSaveStatus, setBasicSaveStatus] = useState<SaveStatus>("idle");
  const [basicSaveError, setBasicSaveError] = useState<string | null>(null);

  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<TravelExperienceLevel | "">("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [detailsSaveStatus, setDetailsSaveStatus] = useState<SaveStatus>("idle");
  const [detailsSaveError, setDetailsSaveError] = useState<string | null>(null);

  const [touchedFields, setTouchedFields] = useState<ProfileField[]>([]);

  const markTouched = (...fields: ProfileField[]) => {
    setTouchedFields((current) => [...new Set([...current, ...fields])]);
  };

  function applyUser(current: CurrentUser) {
    setUser(current);
    setFullName(current.full_name ?? "");
    setPhoneNumber(current.phone_number ?? "");
    setBio(current.bio ?? "");
    setDateOfBirth(current.date_of_birth ?? "");
    setGender(current.gender ?? "");
    setLocationCity(current.location_city ?? "");
    setLocationCountry(current.location_country ?? "");
    setInterests(current.interests);
    setPreferredLanguages(current.preferred_languages);
    setExperienceLevel(current.experience_level ?? "");
    setEmergencyContactName(current.emergency_contact_name ?? "");
    setEmergencyContactPhone(current.emergency_contact_phone ?? "");
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
    if (basicSaveStatus !== "success") return;
    const timer = window.setTimeout(() => setBasicSaveStatus("idle"), SAVED_MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [basicSaveStatus]);

  useEffect(() => {
    if (detailsSaveStatus !== "success") return;
    const timer = window.setTimeout(() => setDetailsSaveStatus("idle"), SAVED_MESSAGE_MS);
    return () => window.clearTimeout(timer);
  }, [detailsSaveStatus]);

  if (loadError) {
    return <PageErrorState message={loadError} />;
  }

  if (!user) {
    return <p className="text-(--color-wildbook-muted)">Loading your profile…</p>;
  }

  const canEditBasicInfo = user.auth_provider === "EMAIL";

  const validationErrors = validateProfileForm(
    {
      fullName,
      phoneNumber,
      bio,
      dateOfBirth,
      gender,
      locationCity,
      locationCountry,
      interests,
      preferredLanguages,
      emergencyContactName,
      emergencyContactPhone,
    },
    canEditBasicInfo,
  );

  // Errors surface as soon as a field has been edited or its section was submitted.
  const visibleError = (field: ProfileField): string | undefined =>
    touchedFields.includes(field) ? validationErrors[field] : undefined;

  const hasErrorsIn = (fields: ProfileField[]) => fields.some((field) => validationErrors[field]);

  const handleSaveBasicInfo = async () => {
    markTouched(...BASIC_INFO_FIELDS, ...(canEditBasicInfo ? [] : PERSONAL_DETAILS_FIELDS));
    if (hasErrorsIn(canEditBasicInfo ? BASIC_INFO_FIELDS : PERSONAL_DETAILS_FIELDS)) {
      setBasicSaveStatus("error");
      setBasicSaveError("Please fix the highlighted fields.");
      return;
    }
    setBasicSaveStatus("saving");
    setBasicSaveError(null);
    try {
      if (canEditBasicInfo) {
        const updated = await upsertEmailSignupProfile({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim() || undefined,
        });
        applyUser(updated);
      } else {
        const updated = await updateProfileDetails({
          bio: bio.trim() || undefined,
          date_of_birth: dateOfBirth || undefined,
          gender: gender.trim() || undefined,
          location_city: locationCity.trim() || undefined,
          location_country: locationCountry.trim() || undefined,
          interests,
          preferred_languages: preferredLanguages,
          experience_level: experienceLevel || undefined,
          emergency_contact_name: emergencyContactName.trim() || undefined,
          emergency_contact_phone: emergencyContactPhone.trim() || undefined,
          phone_number: phoneNumber.trim() || undefined,
        });
        applyUser(updated);
      }
      setBasicSaveStatus("success");
    } catch (error) {
      setBasicSaveStatus("error");
      setBasicSaveError(error instanceof Error ? error.message : "Failed to save profile.");
    }
  };

  const handleSaveDetails = async () => {
    markTouched(...PERSONAL_DETAILS_FIELDS);
    if (hasErrorsIn(PERSONAL_DETAILS_FIELDS)) {
      setDetailsSaveStatus("error");
      setDetailsSaveError("Please fix the highlighted fields.");
      return;
    }
    setDetailsSaveStatus("saving");
    setDetailsSaveError(null);
    try {
      const updated = await updateProfileDetails({
        bio: bio.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: gender.trim() || undefined,
        location_city: locationCity.trim() || undefined,
        location_country: locationCountry.trim() || undefined,
        interests,
        preferred_languages: preferredLanguages,
        experience_level: experienceLevel || undefined,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
      });
      applyUser(updated);
      setDetailsSaveStatus("success");
    } catch (error) {
      setDetailsSaveStatus("error");
      setDetailsSaveError(error instanceof Error ? error.message : "Failed to save profile details.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[18px] font-semibold text-(--color-wildbook-text) sm:text-[20px] md:text-[22px]">My Profile</h1>
        <p className="mt-1 text-sm text-(--color-wildbook-muted)">
          The more we know about you, the better we can match you with the right guides and experiences.
        </p>
      </div>

      <section>
        <h2 className="text-[16px] font-semibold text-(--color-wildbook-text)">Basic info</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="full-name">
              Full name
            </label>
            <input
              id="full-name"
              className={`${inputClassName} ${visibleError("fullName") ? errorClassName : ""}`}
              value={fullName}
              disabled={!canEditBasicInfo}
              maxLength={PROFILE_LIMITS.fullName.max}
              aria-invalid={Boolean(visibleError("fullName"))}
              aria-describedby={visibleError("fullName") ? "full-name-error" : undefined}
              onChange={(event) => {
                setFullName(event.target.value);
                markTouched("fullName");
              }}
              onBlur={() => markTouched("fullName")}
            />
            <FieldError id="full-name-error" message={visibleError("fullName")} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="phone-number">
              Phone number
            </label>
            <input
              id="phone-number"
              type="tel"
              className={`${inputClassName} ${visibleError("phoneNumber") ? errorClassName : ""}`}
              value={phoneNumber}
              maxLength={PROFILE_LIMITS.phone.max}
              aria-invalid={Boolean(visibleError("phoneNumber"))}
              aria-describedby={visibleError("phoneNumber") ? "phone-number-error" : undefined}
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                markTouched("phoneNumber");
              }}
              onBlur={() => markTouched("phoneNumber")}
              placeholder="Add your phone number"
            />
            <FieldError id="phone-number-error" message={visibleError("phoneNumber")} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="email">
              Email
            </label>
            <input id="email" className={inputClassName} value={user.email} disabled />
          </div>

          <div>
            <label className={labelClassName} htmlFor="account-type">
              Account type
            </label>
            <input id="account-type" className={inputClassName} value={ROLE_LABELS[user.role]} disabled />
          </div>
        </div>

        {!canEditBasicInfo ? (
          <p className="mt-4 text-sm text-(--color-wildbook-muted)">
            You signed in with Google, so your name is managed by your Google account. You can still update your
            phone number.
          </p>
        ) : null}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded bg-(--color-wildbook-teal) px-6 text-sm font-medium text-white transition-colors hover:bg-[#095852] disabled:opacity-60"
            disabled={basicSaveStatus === "saving"}
            onClick={() => void handleSaveBasicInfo()}
          >
            {basicSaveStatus === "saving" ? "Saving…" : "Save changes"}
          </button>
          {basicSaveStatus === "success" ? (
            <span className="text-sm text-(--color-wildbook-teal)">Saved.</span>
          ) : null}
          {basicSaveStatus === "error" && basicSaveError ? (
            <span className="text-sm text-red-600">{basicSaveError}</span>
          ) : null}
        </div>
      </section>

      <section className="border-t border-black/10 pt-8">
        <h2 className="text-[16px] font-semibold text-(--color-wildbook-text)">Personal details</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClassName} htmlFor="bio">
              About you
            </label>
            <textarea
              id="bio"
              className={`${textAreaClassName} ${visibleError("bio") ? errorClassName : ""}`}
              placeholder="Tell guides a bit about yourself and what you're hoping to see."
              maxLength={PROFILE_LIMITS.bio.max}
              value={bio}
              aria-invalid={Boolean(visibleError("bio"))}
              aria-describedby={visibleError("bio") ? "bio-error" : undefined}
              onChange={(event) => {
                setBio(event.target.value);
                markTouched("bio");
              }}
              onBlur={() => markTouched("bio")}
            />
            <div className="mt-1.5 flex items-start justify-between gap-4">
              <FieldError id="bio-error" message={visibleError("bio")} />
              <span className="ml-auto text-[13px] text-(--color-wildbook-muted)">
                {bio.trim().length}/{PROFILE_LIMITS.bio.max}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClassName} htmlFor="date-of-birth">
              Date of birth
            </label>
            <input
              id="date-of-birth"
              type="date"
              className={`${inputClassName} ${visibleError("dateOfBirth") ? errorClassName : ""}`}
              value={dateOfBirth}
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={Boolean(visibleError("dateOfBirth"))}
              aria-describedby={visibleError("dateOfBirth") ? "date-of-birth-error" : undefined}
              onChange={(event) => {
                setDateOfBirth(event.target.value);
                markTouched("dateOfBirth");
              }}
              onBlur={() => markTouched("dateOfBirth")}
            />
            <FieldError id="date-of-birth-error" message={visibleError("dateOfBirth")} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="gender">
              Gender
            </label>
            <input
              id="gender"
              list="gender-options"
              className={`${inputClassName} ${visibleError("gender") ? errorClassName : ""}`}
              placeholder="e.g. Female"
              value={gender}
              maxLength={PROFILE_LIMITS.gender.max}
              aria-invalid={Boolean(visibleError("gender"))}
              aria-describedby={visibleError("gender") ? "gender-error" : undefined}
              onChange={(event) => {
                setGender(event.target.value);
                markTouched("gender");
              }}
              onBlur={() => markTouched("gender")}
            />
            <datalist id="gender-options">
              <option value="Female" />
              <option value="Male" />
              <option value="Non-binary" />
              <option value="Prefer not to say" />
            </datalist>
            <FieldError id="gender-error" message={visibleError("gender")} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="city">
              City
            </label>
            <input
              id="city"
              className={`${inputClassName} ${visibleError("locationCity") ? errorClassName : ""}`}
              value={locationCity}
              maxLength={PROFILE_LIMITS.location.max}
              aria-invalid={Boolean(visibleError("locationCity"))}
              aria-describedby={visibleError("locationCity") ? "city-error" : undefined}
              onChange={(event) => {
                setLocationCity(event.target.value);
                markTouched("locationCity");
              }}
              onBlur={() => markTouched("locationCity")}
            />
            <FieldError id="city-error" message={visibleError("locationCity")} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="country">
              Country
            </label>
            <input
              id="country"
              className={`${inputClassName} ${visibleError("locationCountry") ? errorClassName : ""}`}
              value={locationCountry}
              maxLength={PROFILE_LIMITS.location.max}
              aria-invalid={Boolean(visibleError("locationCountry"))}
              aria-describedby={visibleError("locationCountry") ? "country-error" : undefined}
              onChange={(event) => {
                setLocationCountry(event.target.value);
                markTouched("locationCountry");
              }}
              onBlur={() => markTouched("locationCountry")}
            />
            <FieldError id="country-error" message={visibleError("locationCountry")} />
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 pt-8">
        <h2 className="text-[16px] font-semibold text-(--color-wildbook-text)">Travel preferences</h2>
        <p className="mt-1 text-sm text-(--color-wildbook-muted)">
          Helps us connect you with guides who match what you're looking for.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <TagSelector
              title="Interests"
              subtitle="What do you most want to experience?"
              presets={INTEREST_PRESETS}
              selected={interests}
              onChange={(next) => {
                setInterests(next);
                markTouched("interests");
              }}
              customPlaceholder="Add another interest..."
            />
            <FieldError id="interests-error" message={visibleError("interests")} />
          </div>

          <div>
            <LanguageSelect
              title="Preferred languages"
              subtitle="Languages you'd like your guide to speak."
              presets={LANGUAGE_PRESETS}
              options={WORLD_LANGUAGES}
              selected={preferredLanguages}
              onChange={(next) => {
                setPreferredLanguages(next);
                markTouched("preferredLanguages");
              }}
            />
            <FieldError id="preferred-languages-error" message={visibleError("preferredLanguages")} />
          </div>

          <div className="max-w-sm">
            <label className={labelClassName} htmlFor="experience-level">
              Your wildlife travel experience
            </label>
            <select
              id="experience-level"
              className={inputClassName}
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value as TravelExperienceLevel | "")}
            >
              <option value="">Prefer not to say</option>
              {(Object.keys(EXPERIENCE_LEVEL_LABELS) as TravelExperienceLevel[]).map((level) => (
                <option key={level} value={level}>
                  {EXPERIENCE_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 pt-8">
        <h2 className="text-[16px] font-semibold text-(--color-wildbook-text)">Contact & safety</h2>
        <p className="mt-1 text-sm text-(--color-wildbook-muted)">
          Shared with your guide or host only for confirmed bookings, in case of an emergency.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="emergency-contact-name">
              Emergency contact name
            </label>
            <input
              id="emergency-contact-name"
              className={`${inputClassName} ${visibleError("emergencyContactName") ? errorClassName : ""}`}
              value={emergencyContactName}
              maxLength={PROFILE_LIMITS.emergencyContactName.max}
              aria-invalid={Boolean(visibleError("emergencyContactName"))}
              aria-describedby={visibleError("emergencyContactName") ? "emergency-contact-name-error" : undefined}
              onChange={(event) => {
                setEmergencyContactName(event.target.value);
                markTouched("emergencyContactName");
              }}
              onBlur={() => markTouched("emergencyContactName", "emergencyContactPhone")}
            />
            <FieldError id="emergency-contact-name-error" message={visibleError("emergencyContactName")} />
          </div>
          <div>
            <label className={labelClassName} htmlFor="emergency-contact-phone">
              Emergency contact phone
            </label>
            <input
              id="emergency-contact-phone"
              type="tel"
              className={`${inputClassName} ${visibleError("emergencyContactPhone") ? errorClassName : ""}`}
              value={emergencyContactPhone}
              maxLength={PROFILE_LIMITS.phone.max}
              aria-invalid={Boolean(visibleError("emergencyContactPhone"))}
              aria-describedby={visibleError("emergencyContactPhone") ? "emergency-contact-phone-error" : undefined}
              onChange={(event) => {
                setEmergencyContactPhone(event.target.value);
                markTouched("emergencyContactPhone");
              }}
              onBlur={() => markTouched("emergencyContactName", "emergencyContactPhone")}
            />
            <FieldError id="emergency-contact-phone-error" message={visibleError("emergencyContactPhone")} />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-black/10 pt-6">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded bg-(--color-wildbook-teal) px-6 text-sm font-medium text-white transition-colors hover:bg-[#095852] disabled:opacity-60"
          disabled={detailsSaveStatus === "saving"}
          onClick={() => void handleSaveDetails()}
        >
          {detailsSaveStatus === "saving" ? "Saving…" : "Save profile details"}
        </button>
        {detailsSaveStatus === "success" ? (
          <span className="text-sm text-(--color-wildbook-teal)">Saved.</span>
        ) : null}
        {detailsSaveStatus === "error" && detailsSaveError ? (
          <span className="text-sm text-red-600">{detailsSaveError}</span>
        ) : null}
      </div>
    </div>
  );
}
