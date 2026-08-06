import { describe, expect, it } from "bun:test";
import { composePhoneNumber, parsePhoneParts } from "./phoneDialCodes";

describe("parsePhoneParts", () => {
  it("defaults empty phones to India", () => {
    expect(parsePhoneParts("")).toEqual({ dial: "+91", national: "" });
    expect(parsePhoneParts(null)).toEqual({ dial: "+91", national: "" });
  });

  it("splits a known dial code from the national number", () => {
    expect(parsePhoneParts("+91 98765 43210")).toEqual({ dial: "+91", national: "9876543210" });
    expect(parsePhoneParts("+971501234567")).toEqual({ dial: "+971", national: "501234567" });
  });

  it("treats bare digits as an Indian national number", () => {
    expect(parsePhoneParts("9876543210")).toEqual({ dial: "+91", national: "9876543210" });
  });
});

describe("composePhoneNumber", () => {
  it("joins dial and national digits", () => {
    expect(composePhoneNumber("+91", "98765 43210")).toBe("+91 9876543210");
  });

  it("returns empty when there is no national number", () => {
    expect(composePhoneNumber("+91", "  ")).toBe("");
  });
});
