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
  saveCareerGoals: (data: {
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
  }) => Promise<void>;
  saveWorkSetup: (data: {
    workModePreferences: WorkModePreference[];
    employmentTypePreferences: EmploymentTypePreference[];
    contractPreferences: ContractTypePreference[];
    preferredHoursPerWeek?: number | null;
    preferredWorkRatio?: number | null;
  }) => Promise<void>;
  replaceLanguages: (languages: ProfileLanguageInput[]) => Promise<void>;
  replaceHobbies: (hobbies: ProfileHobbyInput[]) => Promise<void>;
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
      const updated = await trpcClient.profile.savePersonalInfo.mutate(data);
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save personal info' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveSkills(skills) {
    set({ isSaving: true, error: null });
    try {
      const updated = await trpcClient.profile.saveSkills.mutate({ skills });
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save skills' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceExperiences(experiences) {
    set({ isSaving: true, error: null });
    try {
      const updated = await trpcClient.profile.replaceExperiences.mutate({ experiences });
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save experiences' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceEducations(educations) {
    set({ isSaving: true, error: null });
    try {
      const updated = await trpcClient.profile.replaceEducations.mutate({ educations });
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save educations' });
    } finally {
      set({ isSaving: false });
    }
  },

  async replaceTrainings(trainings) {
    set({ isSaving: true, error: null });
    try {
      const updated = await trpcClient.profile.replaceTrainings.mutate({ trainings });
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save trainings' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveCareerGoals(data) {
    set({ isSaving: true, error: null });
    try {
      const updated = await trpcClient.profile.saveCareerGoals.mutate(data);
      set({ profile: mergeProfilePreferences(updated, get().profile ?? undefined) });
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
      if (current) {
        set({ profile: mergeProfilePreferences(current, { preferredWorkSetup }) });
      }
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
      if (current) {
        set({ profile: mergeProfilePreferences(current, { languages: updatedLanguages }) });
      }
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
      if (current) {
        set({ profile: mergeProfilePreferences(current, { hobbies: updatedHobbies }) });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save hobbies' });
    } finally {
      set({ isSaving: false });
    }
  },
}));
