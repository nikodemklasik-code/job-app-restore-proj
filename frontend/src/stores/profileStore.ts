import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
}

interface Profile {
  personalInfo: PersonalInfo;
  skills: string[];
}

interface ProfileStore {
  profile: Profile | null;
  isLoadingProfile: boolean;
  isSaving: boolean;
  error: string | null;
  loadProfile: (userId: string) => Promise<void>;
  savePersonalInfo: (userId: string, data: PersonalInfo) => Promise<void>;
  saveSkills: (userId: string, skills: string[]) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoadingProfile: false,
  isSaving: false,
  error: null,

  async loadProfile(userId) {
    set({ isLoadingProfile: true, error: null });
    try {
      const data = await trpcClient.profile.getProfile.query({ userId });
      if (data) set({ profile: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load profile' });
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  async savePersonalInfo(userId, data) {
    set({ isSaving: true, error: null });
    try {
      await trpcClient.profile.savePersonalInfo.mutate({ userId, ...data });
      set((state) => ({
        profile: state.profile ? { ...state.profile, personalInfo: data } : null,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save' });
    } finally {
      set({ isSaving: false });
    }
  },

  async saveSkills(userId, skills) {
    set({ isSaving: true, error: null });
    try {
      await trpcClient.profile.saveSkills.mutate({ userId, skills });
      set((state) => ({
        profile: state.profile ? { ...state.profile, skills } : null,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save' });
    } finally {
      set({ isSaving: false });
    }
  },
}));
