import { create } from 'zustand';

interface SettingsStore {
  emailNotifications: boolean;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  toggleEmailNotifications: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  emailNotifications: true,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 200));
    set({ isLoading: false });
  },

  toggleEmailNotifications: () =>
    set((state) => ({ emailNotifications: !state.emailNotifications })),
}));
