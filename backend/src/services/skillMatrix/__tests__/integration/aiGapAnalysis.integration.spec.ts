/**
 * Integration Test — AI Gap Analysis
 */

import { describe, it, expect } from 'vitest';
import { generateGapAnalysis } from '../../../scoring/aiGapAnalysis.js';

describe('AI Gap Analysis — Integration', () => {
    it('generates gaps for missing skills', () => {
        const result = generateGapAnalysis({
            userId: 'user-1',
            userSkills: [
                { skillId: 'ts', skillName: 'TypeScript', evidenceLevel: 'demonstrated', confidence: 0.8 },
                { skillId: 'react', skillName: 'React', evidenceLevel: 'verified', confidence: 0.9 },
            ],
            targetRoleRequirements: [
                { skillId: 'ts', skillName: 'TypeScript', weight: 1.0, frequency: 0.9 },
                { skillId: 'react', skillName: 'React', weight: 0.8, frequency: 0.85 },
                { skillId: 'k8s', skillName: 'Kubernetes', weight: 0.7, frequency: 0.75 },
                { skillId: 'aws', skillName: 'AWS', weight: 0.6, frequency: 0.6 },
            ],
            targetRole: 'Senior Full-Stack Engineer',
        });

        // Should identify Kubernetes and AWS as gaps (user doesn't have them)
        expect(result.totalGaps).toBe(2);
        expect(result.gaps.some((g) => g.skillName === 'Kubernetes')).toBe(true);
        expect(result.gaps.some((g) => g.skillName === 'AWS')).toBe(true);

        // Kubernetes should be critical (frequency >= 0.7)
        const k8sGap = result.gaps.find((g) => g.skillName === 'Kubernetes')!;
        expect(k8sGap.severity).toBe('critical');

        // Should have trust metadata
        expect(result.trustMetadata).toBeDefined();
        expect(result.trustMetadata.confidence).toBeGreaterThan(0);

        // Summary should use signal language
        expect(result.summary.toLowerCase()).not.toContain('you must');
        expect(result.summary.toLowerCase()).not.toContain('do not apply');
    });

    it('returns no gaps when user covers all requirements', () => {
        const result = generateGapAnalysis({
            userId: 'user-1',
            userSkills: [
                { skillId: 'ts', skillName: 'TypeScript', evidenceLevel: 'verified', confidence: 0.9 },
                { skillId: 'react', skillName: 'React', evidenceLevel: 'demonstrated', confidence: 0.8 },
            ],
            targetRoleRequirements: [
                { skillId: 'ts', skillName: 'TypeScript', weight: 1.0, frequency: 0.9 },
                { skillId: 'react', skillName: 'React', weight: 0.8, frequency: 0.85 },
            ],
            targetRole: 'Frontend Developer',
        });

        expect(result.totalGaps).toBe(0);
        expect(result.summary).toContain('well-aligned');
    });
});
