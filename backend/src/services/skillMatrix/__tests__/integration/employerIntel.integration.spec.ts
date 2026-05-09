/**
 * Integration Test — Employer Intelligence Service
 * End-to-end employer signal detection with mocked sources.
 */

import { describe, it, expect } from 'vitest';
import { detectAllSignals, type JobListingInput } from '../../../employerIntel/signalDetector.js';

describe('Employer Intelligence — Signal Detection Integration', () => {
    it('detects multiple signal categories from a realistic listing', () => {
        const listing: JobListingInput = {
            title: 'Senior Software Engineer',
            description: `
        We are looking for a Senior Software Engineer to join our growing team.
        You will work with TypeScript, React, Node.js, and AWS in a microservices architecture.
        We offer visa sponsorship for the right candidate.
        Benefits include private medical insurance, pension contribution, equity, and a learning budget.
        Our interview process consists of 3 stages: technical screen, system design, and culture fit.
        Salary: £80,000 - £110,000 depending on experience.
        Flexible working with 2 days in our London office.
      `,
            salaryMin: 80000,
            salaryMax: 110000,
            location: 'London, UK',
            company: 'TechCorp Ltd',
            contractType: 'permanent',
            sourceUrl: 'https://example.com/job/123',
        };

        const signals = detectAllSignals(listing);

        // Should detect signals across multiple categories
        const categories = new Set(signals.map((s) => s.category));
        expect(categories.size).toBeGreaterThanOrEqual(3);

        // Should detect salary disclosure (positive)
        const salarySignal = signals.find((s) => s.signalType === 'salary_disclosed');
        expect(salarySignal).toBeDefined();
        expect(salarySignal!.score).toBeGreaterThan(0);

        // Should detect visa sponsorship
        const visaSignal = signals.find((s) => s.signalType === 'visa_sponsorship');
        expect(visaSignal).toBeDefined();

        // Should detect modern tech stack
        const techSignal = signals.find((s) => s.signalType === 'modern_stack');
        expect(techSignal).toBeDefined();

        // Should detect benefits
        const benefitsSignal = signals.find((s) => s.signalType === 'benefits_comprehensive');
        expect(benefitsSignal).toBeDefined();

        // Should detect process described
        const processSignal = signals.find((s) => s.signalType === 'process_described');
        expect(processSignal).toBeDefined();

        // All signals should have trust metadata
        for (const signal of signals) {
            expect(signal.trustMetadata).toBeDefined();
            expect(signal.trustMetadata.sourceName).toBeTruthy();
            expect(signal.trustMetadata.confidence).toBeGreaterThan(0);
        }
    });

    it('detects scam signals from suspicious listing', () => {
        const listing: JobListingInput = {
            title: 'Easy Work From Home',
            description: 'Earn £5000/week! Pay upfront registration fee of £50 to get started. Send bank details.',
            salaryMin: 260000,
            salaryMax: 260000,
            company: '',
            sourceUrl: null,
        };

        const signals = detectAllSignals(listing);

        const scamSignals = signals.filter((s) => s.category === 'scam_fraud');
        expect(scamSignals.length).toBeGreaterThanOrEqual(2);

        // Should detect upfront payment
        expect(scamSignals.some((s) => s.signalType === 'upfront_payment')).toBe(true);

        // Should detect data overreach
        expect(scamSignals.some((s) => s.signalType === 'data_overreach')).toBe(true);

        // Should detect suspicious salary
        expect(scamSignals.some((s) => s.signalType === 'salary_suspicious')).toBe(true);
    });
});
