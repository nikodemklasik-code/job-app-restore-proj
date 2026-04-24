import { create } from 'zustand';
import { trpcClient } from '@/lib/api';
import type {
  ProfileSnapshot,
  PersonalInfo,
  ProfileExperienceInput,
  ProfileEducationInput,
  ProfileTrainingInput,
} from '../../../shared/profile';

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
  dismissError: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
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
      const data = await trpcClient.profile.getProfile.query();
      if (data) set({ profile: data });
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
      set({ profile: updated });
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
      set({ profile: updated });
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
      set({ profile: updated });
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
      set({ profile: updated });
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
      set({ profile: updated });
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
      set({ profile: updated });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save career goals' });
    } finally {
      set({ isSaving: false });
    }
  },
}));
