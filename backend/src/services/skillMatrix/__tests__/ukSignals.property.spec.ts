/**
 * Property-Based Tests — UK Signal Detection (Property 22)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectAllSignals, type JobListingInput } from '../../employerIntel/signalDetector.js';

const baseListing: JobListingInput = {
    title: 'Software Engineer',
    description: '',
    company: 'Test Co',
};

describe('Property 22: UK Signal Detection Matches Keyword Presence', () => {
    it('visa keywords produce visa_sponsorship signal', () => {
        const visaKeywords = ['visa sponsor', 'sponsorship available', 'tier 2'];

        for (const keyword of visaKeywords) {
            const listing = { ...baseListing, description: `We offer ${keyword} for the right candidate.` };
            const signals = detectAllSignals(listing);
            const visaSignal = signals.find((s) => s.signalType === 'visa_sponsorship');
            expect(visaSignal).toBeDefined();
            expect(visaSignal!.category).toBe('uk_local_risks');
        }
    });

    it('IR35 keywords produce ir35_status signal', () => {
        const ir35Keywords = ['ir35', 'inside ir35', 'outside ir35'];

        for (const keyword of ir35Keywords) {
            const listing = { ...baseListing, description: `This role is ${keyword}.` };
            const signals = detectAllSignals(listing);
            const ir35Signal = signals.find((s) => s.signalType === 'ir35_status');
            expect(ir35Signal).toBeDefined();
            expect(ir35Signal!.category).toBe('uk_local_risks');
        }
    });

    it('security clearance keywords produce security_clearance signal', () => {
        const clearanceKeywords = ['sc clearance', 'dv clearance', 'ctc', 'bpss'];

        for (const keyword of clearanceKeywords) {
            const listing = { ...baseListing, description: `Requires ${keyword} level access.` };
            const signals = detectAllSignals(listing);
            const clearanceSignal = signals.find((s) => s.signalType === 'security_clearance');
            expect(clearanceSignal).toBeDefined();
        }
    });

    it('absence of UK keywords produces no UK-specific signals', () => {
        const listing = { ...baseListing, description: 'A standard software engineering role with React and Node.js.' };
        const signals = detectAllSignals(listing);
        const ukSignals = signals.filter(
            (s) => s.category === 'uk_local_risks' && ['visa_sponsorship', 'ir35_status', 'security_clearance'].includes(s.signalType),
        );
        expect(ukSignals).toHaveLength(0);
    });
});
