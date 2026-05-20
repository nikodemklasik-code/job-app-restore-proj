import { create } from 'zustand';
import { trpcClient } from '@/lib/api';
import type {
  ContractTypePreference,
  EmploymentTypePreference,
  PersonalInfo,
  PreferredWorkSetup,
  ProfileEducationInput,
  ProfileExperienceInput,
  ProfileHobbyInput,
  ProfileLanguageInput,
  ProfileSnapshot,
  ProfileTrainingInput,
  WorkModePreference,
} from '../../../shared/profile';

const EMPTY_WORK_SETUP: PreferredWorkSetup = {
  workModePreferences: [],
  employmentTypePreferences: [],
  contractPreferences: [],
  preferredHoursPerWeek: null,
  preferredWorkRatio: null,
};

type ProfilePreferencesSnapshot = {
  preferredWorkSetup?: PreferredWorkSetup;
  careerGoals?: ProfileSnapshot['careerGoals'];
  languages?: ProfileLanguageInput[];
  hobbies?: ProfileHobbyInput[];
};

type CareerGoalsInput = {
  currentJobTitle?: string | null;
  currentSalary?: number | null;
  targetJobTitle?: string | null;
  targetSalary?: number | null;
  targetSalaryMin?: number | null;
  targetSalaryMax?: number | null;
  targetSeniority?: string | null;
  workValues?: string[];
  autoApplyMinScore?: number;
  strategy?: Record<string, unknown>;
};

function mergeProfilePreferences(
  profile: ProfileSnapshot,
  preferences?: ProfilePreferencesSnapshot,
): ProfileSnapshot {
  const preferredWorkSetup =
    preferences?.preferredWorkSetup
    ?? preferences?.careerGoals?.preferredWorkSetup
    ?? profile.careerGoals?.preferredWorkSetup
    ?? EMPTY_WORK_SETUP;

  return {
    ...profile,
    languages: (preferences?.languages ?? profile.languages ?? []).map((language, index) => ({
      id: `${language.name}:${language.proficiency}:${index}`,
      name: language.name,
      proficiency: language.proficiency,
      certificate: language.certificate ?? null,
    })),
    hobbies: (preferences?.hobbies ?? profile.hobbies ?? []).map((hobby, index) => ({
      id: `${hobby.name}:${index}`,
      name: hobby.name,
      description: hobby.description ?? null,
    })),
    careerGoals: profile.careerGoals
      ? {
        ...profile.careerGoals,
        preferredWorkSetup,
      }
      : profile.careerGoals,
  };
}

async function loadOptionalProfilePreferences(): Promise<ProfilePreferencesSnapshot | undefined> {
  try {
    return await trpcClient.profilePreferences.getPreferences.query();
  } catch (error) {
    console.warn('[profile] Optional profile preferences failed to load', error);
    return undefined;
  }
}

function updatePayloadFromSnapshot(profile: ProfileSnapshot, overrides: Partial<{
  personalInfo: PersonalInfo;
  skills: string[];
  experiences: ProfileExperienceInput[];
  educations: ProfileEducationInput[];
  trainings: ProfileTrainingInput[];
  careerGoals: CareerGoalsInput;
}>) {
  const personalInfo = overrides.personalInfo ?? profile.personalInfo;
  return {
    personalInfo: {
      fullName: personalInfo.fullName,
      phone: personalInfo.phone,
      location: personalInfo.location,
      headline: personalInfo.headline,
      summary: personalInfo.summary,
      linkedinUrl: personalInfo.linkedinUrl,
      cvUrl: personalInfo.cvUrl,
    },
    skills: overrides.skills ?? profile.skills ?? [],
    experiences: overrides.experiences ?? (profile.experiences ?? []).map(({ employerName, jobTitle, startDate, endDate, description, achievements }) => ({
      employerName,
      jobTitle,
      startDate,
      endDate,
      description,
      achievements: achievements ?? [],
    })),
    educations: overrides.educations ?? (profile.educations ?? []).map(({ schoolName, degree, fieldOfStudy, startDate, endDate }) => ({
      schoolName,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
    })),
    trainings: overrides.trainings ?? (profile.trainings ?? []).map(({ title, providerName, issuedAt, expiresAt, credentialUrl }) => ({
      title,
      providerName,
      issuedAt,
      expiresAt,
      credentialUrl,
    })),
    careerGoals: overrides.careerGoals,
  };
}

interface ProfileStore {
  profile: ProfileSnapshot | null;
  isLoadingProfile: boolean;
  isSaving: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  savePersonalInfo: (data: PersonalInfo) => Promise<void>;
  saveSkills: (skills: string[]) => Promise<void>;
  replaceExperiences: (experiences: ProfileExperienceInput[]) => Promise<void>;
  replaceEducations: (educations: ProfileEducationInput[]) => Promise<void>;
  replaceTrainings: (trainings: ProfileTrainingInput[]) => Promise<void>;
  saveCareerGoals: (data: CareerGoalsInput) => Promise<void>;
  saveWorkSetup: (data: {
    workModePreferences: WorkModePreference[];
    employmentTypePreferences: EmploymentTypePreference[];
    contractPreferences: ContractTypePreference[];
    preferredHoursPerWeek?: number | null;
    preferredWorkRatio?: number | null;
  }) => Promise<void>;
  replaceLanguages: (languages: ProfileLanguageInput[]) => Promise<void>;
  replaceHobbies: (hobbies: ProfileHobbyInput[]) => Promise<void>;
  generateAiRoadmap: (overrides?: { targetRole?: string | null; targetSeniority?: string | null }) => Promise<void>;
  dismissError: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoadingProfile: false,
  isSaving: false,
  error: null,

  dismissError() {
    set({ error: null });
  },

  async loadProfile() {
    set({ isLoadingProfile: true, error: null });
    try {
      const profile = await trpcClient.profile.getProfile.query();
      const preferences = await loadOptionalProfilePreferences();
      set({ profile: mergeProfilePreferences(profile, preferences) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load profile' });
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  async savePersonalInfo(data) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { personalInfo: data }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save personal info' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveSkills(nextSkills) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { skills: nextSkills }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save skills' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceExperiences(nextExperiences) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { experiences: nextExperiences }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save experiences' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceEducations(nextEducations) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { educations: nextEducations }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save educations' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceTrainings(nextTrainings) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { trainings: nextTrainings }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save trainings' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveCareerGoals(data) {
    set({ isSaving: true, error: null });
    try {
      const current = get().profile;
      if (!current) throw new Error('Profile is not loaded');
      await trpcClient.profile.updateProfile.mutate(updatePayloadFromSnapshot(current, { careerGoals: data }));
      const refreshed = await trpcClient.profile.getProfile.query();
      set({ profile: mergeProfilePreferences(refreshed, current) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save career goals' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveWorkSetup(data) {
    set({ isSaving: true, error: null });
    try {
      const preferredWorkSetup = await trpcClient.profilePreferences.saveWorkSetup.mutate(data);
      const current = get().profile;
      if (current) set({ profile: mergeProfilePreferences(current, { preferredWorkSetup }) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save work preferences' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceLanguages(languages) {
    set({ isSaving: true, error: null });
    try {
      const updatedLanguages = await trpcClient.profilePreferences.replaceLanguages.mutate({ languages });
      const current = get().profile;
      if (current) set({ profile: mergeProfilePreferences(current, { languages: updatedLanguages }) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save languages' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceHobbies(hobbies) {
    set({ isSaving: true, error: null });
    try {
      const updatedHobbies = await trpcClient.profilePreferences.replaceHobbies.mutate({ hobbies });
      const current = get().profile;
      if (current) set({ profile: mergeProfilePreferences(current, { hobbies: updatedHobbies }) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save hobbies' });
    } finally {
      set({ isSaving: false });
    }
  },

  async generateAiRoadmap(overrides) {
    set({ isSaving: true, error: null });
    try {
      const api = trpcClient as unknown as { profile: { generateAiRoadmap?: { mutate: (input: unknown) => Promise<ProfileSnapshot> } } };
      if (api.profile.generateAiRoadmap) {
        const updated = await api.profile.generateAiRoadmap.mutate(overrides ?? {});
        set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
      } else {
        await get().loadProfile();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate AI roadmap' });
    } finally {
      set({ isSaving: false });
    }
  },
}));
