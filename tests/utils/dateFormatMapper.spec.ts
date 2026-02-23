// __tests__/utils/dateFormatMapper.spec.ts
import { describe, it, expect } from "vitest";
import { determineDateFormatFromCountry } from "@/utils/dateFormatMapper";
import { DateFormatTemplate } from "@/types/CommonTypes";

describe("determineDateFormatFromCountry", () => {
  // GROUP 1: USA/Canada
  describe("North American Formats", () => {
    it("should return DateFormatTemplate.USA for US and CA (case-insensitive)", () => {
      expect(determineDateFormatFromCountry("US")).toBe(DateFormatTemplate.USA);
      expect(determineDateFormatFromCountry("ca")).toBe(DateFormatTemplate.USA);
    });
  });

  // GROUP 2: European
  describe("European Formats", () => {
    it("should return DateFormatTemplate.EUR for specific European country codes", () => {
      // We check a subset of the array to verify the logic
      const euroCodes = ["GB", "DE", "FR", "RU"];
      euroCodes.forEach((code) => {
        expect(determineDateFormatFromCountry(code)).toBe(DateFormatTemplate.EUR);
        expect(determineDateFormatFromCountry(code.toLowerCase())).toBe(DateFormatTemplate.EUR);
      });
    });
  });

  // GROUP 3: ISO / Fallbacks
  describe("Default/ISO Formats", () => {
    it("should return ISO for unknown or empty country codes", () => {
      expect(determineDateFormatFromCountry("JP")).toBe(DateFormatTemplate.ISO);
      expect(determineDateFormatFromCountry("AU")).toBe(DateFormatTemplate.ISO);
      expect(determineDateFormatFromCountry("")).toBe(DateFormatTemplate.ISO);
      // @ts-ignore - testing null handling
      expect(determineDateFormatFromCountry(null)).toBe(DateFormatTemplate.ISO);
    });
  });
});
