/**
 * Field-level validation for the account profile form.
 *
 * Limits mirror the backend contracts in `app/models/auth.py`
 * (EmailSignupProfileUpsertRequest / ProfileDetailsUpdateRequest) so the user sees
 * the exact problem while typing instead of a generic 422 after saving.
 */

export const PROFILE_LIMITS = {
  fullName: { min: 2, max: 120 },
  phone: { min: 5, max: 30, minDigits: 7, maxDigits: 15 },
  bio: { max: 500 },
  gender: { max: 40 },
  location: { max: 100 },
  emergencyContactName: { max: 120 },
  tagList: { maxItems: 20 },
  age: { min: 13, max: 120 },
} as const;

export type ProfileField =
  | "fullName"
  | "phoneNumber"
  | "bio"
  | "dateOfBirth"
  | "gender"
  | "locationCity"
  | "locationCountry"
  | "interests"
  | "preferredLanguages"
  | "emergencyContactName"
  | "emergencyContactPhone";

export type ProfileFormValues = {
  fullName: string;
  phoneNumber: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  locationCity: string;
  locationCountry: string;
  interests: string[];
  preferredLanguages: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type ProfileErrors = Partial<Record<ProfileField, string>>;

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u;
const PHONE_ALLOWED_PATTERN = /^\+?[\d\s()-]+$/;

function validateName(value: string, label: string, max: number, min = 0): string | null {
  const trimmed = value.trim();
  if (!trimmed) return min > 0 ? `${label} is required.` : null;
  if (trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label} can only contain letters, spaces, apostrophes, hyphens and periods.`;
  }
  return null;
}

function validateOptionalText(value: string, label: string, max: number): string | null {
  const trimmed = value.trim();
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

function validateOptionalPhone(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const { min, max, minDigits, maxDigits } = PROFILE_LIMITS.phone;
  if (!PHONE_ALLOWED_PATTERN.test(trimmed)) {
    return `${label} can only contain digits, spaces, brackets, hyphens and a leading +.`;
  }
  if (trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  const digitCount = trimmed.replace(/\D/g, "").length;
  if (digitCount < minDigits) return `${label} must have at least ${minDigits} digits.`;
  if (digitCount > maxDigits) return `${label} cannot have more than ${maxDigits} digits.`;
  return null;
}

/**
 * National number only (country dial is chosen separately). Digits required when filled.
 */
export function validateNationalPhone(national: string, label = "Phone number"): string | null {
  const digits = national.replace(/\D/g, "");
  if (!national.trim()) return null;
  if (/\D/.test(national.replace(/[\s-]/g, ""))) {
    return `${label} can only contain digits.`;
  }
  const { minDigits, maxDigits } = PROFILE_LIMITS.phone;
  // National part excludes country code digits, so allow a slightly lower floor.
  if (digits.length < Math.max(6, minDigits - 3)) {
    return `${label} must have at least ${Math.max(6, minDigits - 3)} digits.`;
  }
  if (digits.length > maxDigits) {
    return `${label} cannot have more than ${maxDigits} digits.`;
  }
  return null;
}

function validateDateOfBirth(value: string, today: Date): string | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Enter a valid date.";
  if (parsed > today) return "Date of birth cannot be in the future.";
  const age = ageInYears(parsed, today);
  const { min, max } = PROFILE_LIMITS.age;
  if (age < min) return `You must be at least ${min} years old.`;
  if (age > max) return "Please check your date of birth.";
  return null;
}

function ageInYears(birthDate: Date, today: Date): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function validateTagList(values: string[], label: string): string | null {
  const { maxItems } = PROFILE_LIMITS.tagList;
  if (values.length > maxItems) return `Select up to ${maxItems} ${label}.`;
  return null;
}

/**
 * `isNameEditable` is false for OAuth accounts, where the name is managed by the provider
 * and therefore must not be reported as invalid.
 */
export function validateProfileForm(
  values: ProfileFormValues,
  isNameEditable: boolean,
  today: Date = new Date(),
): ProfileErrors {
  const errors: ProfileErrors = {};

  if (isNameEditable) {
    const fullNameError = validateName(
      values.fullName,
      "Full name",
      PROFILE_LIMITS.fullName.max,
      PROFILE_LIMITS.fullName.min,
    );
    if (fullNameError) errors.fullName = fullNameError;
  }

  const phoneError = validateOptionalPhone(values.phoneNumber, "Phone number");
  if (phoneError) errors.phoneNumber = phoneError;

  const bioError = validateOptionalText(values.bio, "About you", PROFILE_LIMITS.bio.max);
  if (bioError) errors.bio = bioError;

  const dateOfBirthError = validateDateOfBirth(values.dateOfBirth, today);
  if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;

  const genderError = validateOptionalText(values.gender, "Gender", PROFILE_LIMITS.gender.max);
  if (genderError) errors.gender = genderError;

  const cityError = validateName(values.locationCity, "City", PROFILE_LIMITS.location.max);
  if (cityError) errors.locationCity = cityError;

  const countryError = validateName(values.locationCountry, "Country", PROFILE_LIMITS.location.max);
  if (countryError) errors.locationCountry = countryError;

  const interestsError = validateTagList(values.interests, "interests");
  if (interestsError) errors.interests = interestsError;

  const languagesError = validateTagList(values.preferredLanguages, "languages");
  if (languagesError) errors.preferredLanguages = languagesError;

  const emergencyNameError = validateName(
    values.emergencyContactName,
    "Emergency contact name",
    PROFILE_LIMITS.emergencyContactName.max,
  );
  if (emergencyNameError) errors.emergencyContactName = emergencyNameError;

  const emergencyPhoneError = validateOptionalPhone(values.emergencyContactPhone, "Emergency contact phone");
  if (emergencyPhoneError) errors.emergencyContactPhone = emergencyPhoneError;

  // An emergency contact is only usable when both halves are present.
  if (!errors.emergencyContactName && values.emergencyContactPhone.trim() && !values.emergencyContactName.trim()) {
    errors.emergencyContactName = "Add a name for this emergency contact.";
  }
  if (!errors.emergencyContactPhone && values.emergencyContactName.trim() && !values.emergencyContactPhone.trim()) {
    errors.emergencyContactPhone = "Add a phone number for this emergency contact.";
  }
  if (
    !errors.emergencyContactPhone &&
    values.emergencyContactPhone.trim() &&
    isSamePhoneNumber(values.emergencyContactPhone, values.phoneNumber)
  ) {
    errors.emergencyContactPhone = "Emergency contact phone must be different from your own number.";
  }

  return errors;
}

/**
 * ponytail: suffix match on digits, so "+91 98765 43210" and "9876543210" count as one number
 * without pulling in a phone-parsing library. Upgrade to libphonenumber if real E.164
 * normalisation is ever needed elsewhere.
 */
function isSamePhoneNumber(first: string, second: string): boolean {
  const a = first.replace(/\D/g, "");
  const b = second.replace(/\D/g, "");
  if (!a || !b) return false;
  return a.endsWith(b) || b.endsWith(a);
}
