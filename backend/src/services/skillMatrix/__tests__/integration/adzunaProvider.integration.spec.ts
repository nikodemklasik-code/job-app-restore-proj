/**
 * Integration Test — Adzuna UK Provider
 * Tests salary normalization and category mapping (no live API calls).
 */

import { describe, it, expect } from 'vitest';
import { normalizeSalaryToAnnualGBP, mapCategoryToSkills } from '../../providers/adzunaUk.provider.js';

describe('Adzuna UK Provider — Salary Normalization', () => {
    it('passes through annual salaries unchanged', () => {
        const result = normalizeSalaryToAnnualGBP(50000, 70000);
        expect(result.min).toBe(50000);
        expect(result.max).toBe(70000);
    });

    it('converts daily rates to annual (×220)', () => {
        const result = normalizeSalaryToAnnualGBP(400, 600);
        expect(result.min).toBe(88000); // 400 * 220
        expect(result.max).toBe(132000); // 600 * 220
    });

    it('converts low values as daily rates to annual (×220)', () => {
        const result = normalizeSalaryToAnnualGBP(50, 75);
        expect(result.min).toBe(11000); // 50 * 220 (heuristic: < 500 = daily)
        expect(result.max).toBe(16500); // 75 * 220
    });

    it('handles missing salary gracefully', () => {
        const result = normalizeSalaryToAnnualGBP(undefined, undefined);
        expect(result.min).toBeNull();
        expect(result.max).toBeNull();
    });
});

describe('Adzuna UK Provider — Category Mapping', () => {
    it('maps IT jobs to tech skills', () => {
        const skills = mapCategoryToSkills('it-jobs');
        expect(skills.length).toBeGreaterThan(0);
        expect(skills).toContain('typescript');
        expect(skills).toContain('react');
    });

    it('maps engineering jobs to engineering skills', () => {
        const skills = mapCategoryToSkills('engineering-jobs');
        expect(skills.length).toBeGreaterThan(0);
        expect(skills).toContain('agile');
    });

    it('returns empty array for unknown category', () => {
        const skills = mapCategoryToSkills('unknown-category');
        expect(skills).toEqual([]);
    });
});
