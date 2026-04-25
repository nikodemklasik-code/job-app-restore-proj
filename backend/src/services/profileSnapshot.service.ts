import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  careerGoals,
  educations,
  experiences,
  profiles,
  skills,
  socialConsents,
  trainings,
  userPreferenceFlags,
} from '../db/schema.js';
import type {
  CareerGoalsSnapshot,
  ProfileSnapshot,
  ProfileStrategyJson,
  SocialConsentsSnapshot,
  UserPreferenceFlagsSnapshot,
} from '../../../shared/profile.js';
import { evaluateProfileCompletion, type ProfileCompletion } from '../../../shared/profileCompletion.js';

export type ProfileSnapshotWithCompletion = ProfileSnapshot & {
  profileCompletion: ProfileCompletion;
  missingCriticalFields: ProfileCompletion['missingCriticalFields'];
};

const DEFAULT_CAREER_GOALS: CareerGoalsSnapshot = {
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
};

const DEFAULT_SOCIAL: SocialConsentsSnapshot = {
  linkedinConsent: false,
  facebookConsent: false,
  instagramConsent: false,
};

const DEFAULT_PREFS: UserPreferenceFlagsSnapshot = {
  caseStudyOptIn: false,
  communityVisibility: false,
  referralParticipation: true,
  sharedSessionsDiscoverable: false,
  aiPersonalizationEnabled: true,
};

function workValuesFromDb(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

function normalizeStrategy(raw: unknown): ProfileStrategyJson {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as ProfileStrategyJson;
  return {};
}

function careerRowToSnapshot(row: typeof careerGoals.$inferSelect): CareerGoalsSnapshot {
  return {
    currentJobTitle: row.currentJobTitle ?? null,
    currentSalary: row.currentSalary ?? null,
    targetJobTitle: row.targetJobTitle ?? null,
    targetSalary: row.targetSalary ?? null,
    targetSalaryMin: row.targetSalaryMin ?? null,
    targetSalaryMax: row.targetSalaryMax ?? null,
    targetSeniority: row.targetSeniority ?? null,
    workValues: workValuesFromDb(row.workValues),
    autoApplyMinScore: row.autoApplyMinScore ?? 75,
    strategy: normalizeStrategy(row.strategyJson),
  };
}

function withCompletion(snapshot: ProfileSnapshot): ProfileSnapshotWithCompletion {
  const profileCompletion = evaluateProfileCompletion(snapshot);
  return {
    ...snapshot,
    profileCompletion,
    missingCriticalFields: profileCompletion.missingCriticalFields,
  };
}

export async function fetchProfileSnapshotWithCompletion(input: {
  userId: string;
  email: string;
}): Promise<ProfileSnapshotWithCompletion> {
  const [profileRecord, careerRow, socialRow, prefRow] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, input.userId)).limit(1),
    db.select().from(careerGoals).where(eq(careerGoals.userId, input.userId)).limit(1),
    db.select().from(socialConsents).where(eq(socialConsents.userId, input.userId)).limit(1),
    db.select().from(userPreferenceFlags).where(eq(userPreferenceFlags.userId, input.userId)).limit(1),
  ]);

  const careerGoalsSnapshot = careerRow[0] ? careerRowToSnapshot(careerRow[0]) : DEFAULT_CAREER_GOALS;
  const socialSnapshot: SocialConsentsSnapshot = socialRow[0]
    ? {
        linkedinConsent: socialRow[0].linkedinConsent,
        facebookConsent: socialRow[0].facebookConsent,
        instagramConsent: socialRow[0].instagramConsent,
      }
    : DEFAULT_SOCIAL;
  const preferenceSnapshot: UserPreferenceFlagsSnapshot = prefRow[0]
    ? {
        caseStudyOptIn: prefRow[0].caseStudyOptIn,
        communityVisibility: prefRow[0].communityVisibility,
        referralParticipation: prefRow[0].referralParticipation,
        sharedSessionsDiscoverable: prefRow[0].sharedSessionsDiscoverable,
        aiPersonalizationEnabled: prefRow[0].aiPersonalizationEnabled,
      }
    : DEFAULT_PREFS;

  const profile = profileRecord[0];
  if (!profile) {
    return withCompletion({
      personalInfo: {
        fullName: '',
        email: input.email,
        phone: '',
        location: '',
        headline: '',
        summary: '',
        linkedinUrl: '',
        cvUrl: '',
      },
      skills: [],
      experiences: [],
      educations: [],
      trainings: [],
      careerGoals: careerGoalsSnapshot,
      socialConsents: socialSnapshot,
      preferenceFlags: preferenceSnapshot,
    });
  }

  const [skillRecords, experienceRecords, educationRecords, trainingRecords] = await Promise.all([
    db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id)),
    db.select().from(experiences).where(eq(experiences.profileId, profile.id)),
    db.select().from(educations).where(eq(educations.profileId, profile.id)),
    db.select().from(trainings).where(eq(trainings.profileId, profile.id)),
  ]);

  return withCompletion({
    personalInfo: {
      fullName: profile.fullName,
      email: input.email,
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      headline: profile.headline ?? '',
      summary: profile.summary ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      cvUrl: profile.cvUrl ?? '',
    },
    skills: skillRecords.map((skill) => skill.name),
    experiences: experienceRecords.map((experience) => ({
      id: experience.id,
      employerName: experience.employerName,
      jobTitle: experience.jobTitle,
      startDate: experience.startDate,
      endDate: experience.endDate ?? null,
      description: experience.description ?? '',
    })),
    educations: educationRecords.map((education) => ({
      id: education.id,
      schoolName: education.schoolName,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy ?? '',
      startDate: education.startDate,
      endDate: education.endDate ?? null,
    })),
    trainings: trainingRecords.map((training) => ({
      id: training.id,
      title: training.title,
      providerName: training.providerName,
      issuedAt: training.issuedAt,
      expiresAt: training.expiresAt ?? null,
      credentialUrl: training.credentialUrl ?? '',
    })),
    careerGoals: careerGoalsSnapshot,
    socialConsents: socialSnapshot,
    preferenceFlags: preferenceSnapshot,
  });
}

export async function getProfileCompletionForUser(input: {
  userId: string;
  email: string;
}): Promise<ProfileCompletion> {
  const snapshot = await fetchProfileSnapshotWithCompletion(input);
  return snapshot.profileCompletion;
}
