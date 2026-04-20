import { describe, expect, it } from 'vitest';
import { buildSkillLabCoreSignals, mapCoursesToSkills } from '../skillLabCore.service.js';

describe('buildSkillLabCoreSignals', () => {
  it('produces bands and hooks without numeric salary claims', () => {
    const out = buildSkillLabCoreSignals({
      profile: {
        summaryPresent: true,
        experienceCount: 2,
        educationCount: 1,
        profileSkillNames: ['TypeScript', 'React'],
        trainingTitles: [{ title: 'Advanced TypeScript', providerName: 'Example Org' }],
        recentJobTitles: ['Senior Engineer'],
      },
      claims: [
        { skillKey: 'typescript', claimedLevel: 'advanced', claimSource: 'cv' },
        { skillKey: 'python', claimedLevel: 'basic', claimSource: 'manual_edit' },
      ],
    });
    expect(out.skillValueByClaim).toHaveLength(2);
    expect(out.salaryImpact.tier).not.toBe('unknown');
    expect(out.cvValueSignals.length).toBeGreaterThan(0);
    expect(out.growthHooks.length).toBeGreaterThan(0);
    expect(out.salaryImpact.rationale).not.toMatch(/\$\d|£\d|\d{3,}\s*(USD|EUR|GBP|PLN)/i);
  });
});

describe('mapCoursesToSkills', () => {
  it('matches course title tokens to profile skills', () => {
    const rows = mapCoursesToSkills([{ title: 'React patterns', providerName: 'Academy' }], ['React', 'Go']);
    expect(rows[0]?.matchedSkills).toContain('react');
  });
});
