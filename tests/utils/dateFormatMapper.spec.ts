// __tests__/utils/dateFormatMapper.spec.ts

import { describe, it, expect } from 'vitest';
import { determineDateFormatFromCountry } from '@/utils/dateFormatMapper';
// Ensure you import the enum used in your production code
import { DateFormatTemplate } from '@/types/CommonTypes';

describe('determineDateFormatFromCountry', () => {

    // Test Case 1: USA/Canada format
    it('should return DateFormatTemplate.USA for US and CA country codes (case-insensitive)', () => {
        expect(determineDateFormatFromCountry('US')).toBe(DateFormatTemplate.USA);
        expect(determineDateFormatFromCountry('ca')).toBe(DateFormatTemplate.USA); // Test lowercase
    });

    // Test Case 2: European format
    it('should return DateFormatTemplate.EUR for European country codes', () => {
        expect(determineDateFormatFromCountry('GB')).toBe(DateFormatTemplate.EUR);
        expect(determineDateFormatFromCountry('DE')).toBe(DateFormatTemplate.EUR);
        expect(determineDateFormatFromCountry('fr')).toBe(DateFormatTemplate.EUR); // Test lowercase
        expect(determineDateFormatFromCountry('RU')).toBe(DateFormatTemplate.EUR);
    });

    // Test Case 3: ISO/Default format
    it('should return DateFormatTemplate.ISO for all other country codes (default)', () => {
        // Test an unknown code
        expect(determineDateFormatFromCountry('JP')).toBe(DateFormatTemplate.ISO);
        // Test a format that shouldn't be matched
        expect(determineDateFormatFromCountry('AU')).toBe(DateFormatTemplate.ISO);
        // Test an empty string
        expect(determineDateFormatFromCountry('')).toBe(DateFormatTemplate.ISO);
    });
});