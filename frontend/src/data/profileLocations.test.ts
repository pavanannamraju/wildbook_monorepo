import { describe, expect, it } from "bun:test";
import {
  DEFAULT_PROFILE_COUNTRY,
  normalizeStoredLocation,
  PROFILE_COUNTRIES,
  statesForCountry,
} from "./profileLocations";

describe("profileLocations", () => {
  it("lists India first among countries", () => {
    expect(PROFILE_COUNTRIES[0]).toBe(DEFAULT_PROFILE_COUNTRY);
    expect(PROFILE_COUNTRIES.length).toBeGreaterThan(100);
  });

  it("returns Indian states including Karnataka", () => {
    const states = statesForCountry("India");
    expect(states).toContain("Karnataka");
    expect(states.length).toBeGreaterThan(20);
  });

  it("moves a legacy Indian state out of the country field", () => {
    expect(normalizeStoredLocation("", "Karnataka")).toEqual({
      region: "Karnataka",
      country: "India",
    });
  });
});
