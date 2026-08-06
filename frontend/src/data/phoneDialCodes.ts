/** Common dial codes for the profile phone picker. India first as the default. */
export const PHONE_DIAL_CODES = [
  { dial: "+91", label: "India" },
  { dial: "+1", label: "United States / Canada" },
  { dial: "+44", label: "United Kingdom" },
  { dial: "+61", label: "Australia" },
  { dial: "+971", label: "United Arab Emirates" },
  { dial: "+65", label: "Singapore" },
  { dial: "+977", label: "Nepal" },
  { dial: "+94", label: "Sri Lanka" },
  { dial: "+880", label: "Bangladesh" },
  { dial: "+92", label: "Pakistan" },
  { dial: "+66", label: "Thailand" },
  { dial: "+84", label: "Vietnam" },
  { dial: "+62", label: "Indonesia" },
  { dial: "+60", label: "Malaysia" },
  { dial: "+81", label: "Japan" },
  { dial: "+82", label: "South Korea" },
  { dial: "+86", label: "China" },
  { dial: "+49", label: "Germany" },
  { dial: "+33", label: "France" },
  { dial: "+39", label: "Italy" },
  { dial: "+34", label: "Spain" },
  { dial: "+31", label: "Netherlands" },
  { dial: "+41", label: "Switzerland" },
  { dial: "+46", label: "Sweden" },
  { dial: "+47", label: "Norway" },
  { dial: "+45", label: "Denmark" },
  { dial: "+353", label: "Ireland" },
  { dial: "+27", label: "South Africa" },
  { dial: "+254", label: "Kenya" },
  { dial: "+255", label: "Tanzania" },
  { dial: "+250", label: "Rwanda" },
] as const;

export const DEFAULT_PHONE_DIAL = "+91";

export type PhoneDialOption = (typeof PHONE_DIAL_CODES)[number];

/** Unique dial codes, longest first so "+971" wins over "+9" when parsing. */
const DIALS_BY_LENGTH = [...new Set(PHONE_DIAL_CODES.map((item) => item.dial))].sort(
  (a, b) => b.length - a.length,
);

export function dialOptionLabel(option: PhoneDialOption): string {
  return `${option.dial} ${option.label}`;
}

export function findDialOption(dial: string): PhoneDialOption | undefined {
  return PHONE_DIAL_CODES.find((item) => item.dial === dial);
}

/**
 * Split a stored phone string into dial code + national digits.
 * Unknown / missing country codes default to India (+91).
 */
export function parsePhoneParts(stored: string | null | undefined): {
  dial: string;
  national: string;
} {
  const trimmed = (stored ?? "").trim();
  if (!trimmed) return { dial: DEFAULT_PHONE_DIAL, national: "" };

  const compact = trimmed.replace(/[\s()-]/g, "");
  const withPlus = compact.startsWith("+") ? compact : compact.replace(/^00/, "+");

  for (const dial of DIALS_BY_LENGTH) {
    if (withPlus.startsWith(dial)) {
      return { dial, national: withPlus.slice(dial.length).replace(/\D/g, "") };
    }
  }

  return { dial: DEFAULT_PHONE_DIAL, national: withPlus.replace(/\D/g, "") };
}

/** Compose storage form: "+91 9876543210". */
export function composePhoneNumber(dial: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  if (!digits) return "";
  return `${dial} ${digits}`;
}
