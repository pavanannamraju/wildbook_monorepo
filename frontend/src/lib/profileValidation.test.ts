import { describe, expect, it } from "bun:test";
import { validateProfileForm, type ProfileFormValues } from "./profileValidation";

const TODAY = new Date("2026-08-05T00:00:00");

function values(overrides: Partial<ProfileFormValues> = {}): ProfileFormValues {
  return {
    fullName: "Pavan Kumar",
    phoneNumber: "+91 98765 43210",
    bio: "Birder, chasing owls.",
    dateOfBirth: "1995-04-12",
    gender: "Male",
    locationCity: "Karnataka",
    locationCountry: "India",
    interests: ["Birding"],
    preferredLanguages: ["English"],
    emergencyContactName: "Asha Kumar",
    emergencyContactPhone: "+91 98765 43211",
    ...overrides,
  };
}

describe("validateProfileForm", () => {
  it("accepts a fully valid profile", () => {
    expect(validateProfileForm(values(), true, TODAY)).toEqual({});
  });

  it("requires a full name only when the name is editable", () => {
    expect(validateProfileForm(values({ fullName: " " }), true, TODAY).fullName).toContain("required");
    expect(validateProfileForm(values({ fullName: " " }), false, TODAY).fullName).toBeUndefined();
  });

  it("rejects names with digits and too-short names", () => {
    expect(validateProfileForm(values({ fullName: "Pavan2" }), true, TODAY).fullName).toContain("letters");
    expect(validateProfileForm(values({ fullName: "P" }), true, TODAY).fullName).toContain("at least 2");
  });

  it("treats blank optional fields as valid", () => {
    const blank = values({
      phoneNumber: "",
      bio: "",
      dateOfBirth: "",
      gender: "",
      locationCity: "",
      locationCountry: "",
      interests: [],
      preferredLanguages: [],
      emergencyContactName: "",
      emergencyContactPhone: "",
    });
    expect(validateProfileForm(blank, true, TODAY)).toEqual({});
  });

  it("reports the exact phone problem", () => {
    expect(validateProfileForm(values({ phoneNumber: "98765abc" }), true, TODAY).phoneNumber).toContain("digits");
    expect(validateProfileForm(values({ phoneNumber: "12345" }), true, TODAY).phoneNumber).toContain("at least 7 digits");
    expect(validateProfileForm(values({ phoneNumber: "1234567890123456" }), true, TODAY).phoneNumber).toContain(
      "more than 15 digits",
    );
  });

  it("rejects future and implausible birth dates", () => {
    expect(validateProfileForm(values({ dateOfBirth: "2027-01-01" }), true, TODAY).dateOfBirth).toContain("future");
    expect(validateProfileForm(values({ dateOfBirth: "2020-01-01" }), true, TODAY).dateOfBirth).toContain("13 years");
    expect(validateProfileForm(values({ dateOfBirth: "1880-01-01" }), true, TODAY).dateOfBirth).toContain("check");
  });

  it("accepts a birthday reached exactly today", () => {
    expect(validateProfileForm(values({ dateOfBirth: "2013-08-05" }), true, TODAY).dateOfBirth).toBeUndefined();
    expect(validateProfileForm(values({ dateOfBirth: "2013-08-06" }), true, TODAY).dateOfBirth).toContain("13 years");
  });

  it("enforces backend length limits", () => {
    expect(validateProfileForm(values({ bio: "x".repeat(501) }), true, TODAY).bio).toContain("500");
    expect(validateProfileForm(values({ interests: Array(21).fill("Birding") }), true, TODAY).interests).toContain("20");
  });

  it("requires both halves of an emergency contact", () => {
    expect(
      validateProfileForm(values({ emergencyContactName: "" }), true, TODAY).emergencyContactName,
    ).toContain("Add a name");
    expect(
      validateProfileForm(values({ emergencyContactPhone: "" }), true, TODAY).emergencyContactPhone,
    ).toContain("Add a phone number");
  });

  it("rejects an emergency contact that repeats the user's own number", () => {
    expect(
      validateProfileForm(values({ emergencyContactPhone: "9876543210" }), true, TODAY).emergencyContactPhone,
    ).toContain("different");
  });
});
