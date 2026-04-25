import { describe, expect, it } from 'vitest';
import type { ProfileSnapshot } from '../../../shared/profile.js';
import { evaluateProfileCompletion } from '../../../shared/profileCompletion.js';

function baseSnapshot(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    personalInfo: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '',
      location: 'London',
      headline: 'Product Owner',
      summary: 'Product owner with delivery experience.',
      linkedinUrl: '',
      cvUrl: '',
    },
    skills: ['Product discovery', 'Stakeholder management'],
    experiences: [
      {
        id: 'exp-1',
        employerName: 'Example Ltd',
        jobTitle: 'Product Owner',
        startDate: '2022-01',
        endDate: null,
        description: 'Owned backlog and discovery.',
      },
    ],
    educations: [],
    trainings: [],
    careerGoals: {
      currentJobTitle: 'Product Owner',
      currentSalary: 45000,
      targetJobTitle: 'Senior Product Owner',
      targetSalary: null,
      targetSalaryMin: 55000,
      targetSalaryMax: 65000,
      targetSeniority: 'senior',
      workValues: ['growth'],
      autoApplyMinScore: 75,
      strategy: {},
    },
    socialConsents: {
      linkedinConsent: false,
      facebookConsent: false,
      instagramConsent: false,
    },
    preferenceFlags: {
      caseStudyOptIn: false,
      communityVisibility: false,
      referralParticipation: true,
      sharedSessionsDiscoverable: false,
      aiPersonalizationEnabled: true,
    },
    ...overrides,
  };
}

describe('evaluateProfileCompletion', () => {
  it('marks a profile complete when target role, target salary, skills and experience exist', () => {
    const result = evaluateProfileCompletion(baseSnapshot());

    expect(result.isComplete).toBe(true);
    expect(result.completeness).toBe(100);
    expect(result.missingCriticalFields).toEqual([]);
  });

  it('detects every critical field missing from an empty profile', () => {
    const result = evaluateProfileCompletion(
      baseSnapshot({
        skills: [],
        experiences: [],
        careerGoals: {
          currentJobTitle: null,
          currentSalary: null,
          targetJobTitle: null,
          targetSalary: null,
          targetSalaryMin: null,
          targetSalaryMax: null,
          targetSeniority: null,
          workValues: [],
          autoApplyMinScore: 75,
          strategy: {},
        },
      }),
    );

    expect(result.isComplete).toBe(false);
    expect(result.completeness).toBe(0);
    expect(result.missingCriticalFields).toEqual([
      'targetRole',
      'targetSalary',
      'skills',
      'experience',
    ]);
  });

  it('accepts targetSalary when a single target salary is present', () => {
    const result = evaluateProfileCompletion(
      baseSnapshot({
        careerGoals: {
          currentJobTitle: 'Product Owner',
          currentSalary: 45000,
          targetJobTitle: 'Senior Product Owner',
          targetSalary: 62000,
          targetSalaryMin: null,
          targetSalaryMax: null,
          targetSeniority: 'senior',
          workValues: [],
          autoApplyMinScore: 75,
          strategy: {},
        },
      }),
    );

    expect(result.isComplete).toBe(true);
    expect(result.missingCriticalFields).toEqual([]);
  });

  it('detects invalid salary range as missing targetSalary', () => {
    const result = evaluateProfileCompletion(
      baseSnapshot({
        careerGoals: {
          currentJobTitle: 'Product Owner',
          currentSalary: 45000,
          targetJobTitle: 'Senior Product Owner',
          targetSalary: null,
          targetSalaryMin: 70000,
          targetSalaryMax: 60000,
          targetSeniority: 'senior',
          workValues: [],
          autoApplyMinScore: 75,
          strategy: {},
        },
      }),
    );

    expect(result.isComplete).toBe(false);
    expect(result.missingCriticalFields).toEqual(['targetSalary']);
  });
});
