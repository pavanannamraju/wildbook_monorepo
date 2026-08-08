/**
 * Offline ISO 3166-1 countries + ISO 3166-2 subdivisions (states / regions).
 * No geocoding API — autocomplete filters this bundled list in the browser.
 */
import iso3166 from "iso-3166-2";

export const DEFAULT_PROFILE_COUNTRY = "India";

const countriesByName = new Map(
  Object.values(iso3166.data).map((country) => [country.name, country] as const),
);

/** India first (Wildbook default), then A–Z. */
export const PROFILE_COUNTRIES: string[] = [
  DEFAULT_PROFILE_COUNTRY,
  ...Object.values(iso3166.data)
    .map((country) => country.name)
    .filter((name) => name !== DEFAULT_PROFILE_COUNTRY)
    .sort((a, b) => a.localeCompare(b)),
];

const knownCountries = new Set(PROFILE_COUNTRIES);

export function isKnownCountry(name: string): boolean {
  return knownCountries.has(name.trim());
}

export function statesForCountry(countryName: string): string[] {
  const country = countriesByName.get(countryName.trim());
  if (!country) return [];
  return Object.values(country.sub)
    .map((sub) => sub.name)
    .sort((a, b) => a.localeCompare(b));
}

function isStateOfCountry(countryName: string, stateName: string): boolean {
  const needle = stateName.trim().toLowerCase();
  if (!needle) return false;
  return statesForCountry(countryName).some((name) => name.toLowerCase() === needle);
}

/**
 * Prefer a real country. Legacy rows sometimes stored an Indian state in
 * `location_country`; move that into the region field when city is empty.
 */
export function normalizeStoredLocation(
  city: string,
  country: string,
): { region: string; country: string } {
  const region = city.trim();
  const trimmedCountry = country.trim();
  if (!trimmedCountry) return { region, country: "" };
  if (isKnownCountry(trimmedCountry)) return { region, country: trimmedCountry };
  if (isStateOfCountry(DEFAULT_PROFILE_COUNTRY, trimmedCountry)) {
    return { region: region || trimmedCountry, country: DEFAULT_PROFILE_COUNTRY };
  }
  return { region, country: trimmedCountry };
}
