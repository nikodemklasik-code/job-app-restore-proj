import { create } from 'zustand';

interface JobSource {
  id: string;
  name: string;
  connected: boolean;
}

interface SettingsStore {
  emailNotifications: boolean;
  jobSources: JobSource[];
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  toggleEmailNotifications: () => void;
  toggleJobSource: (sourceId: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  emailNotifications: true,
  jobSources: [
    { id: '1', name: 'Indeed', connected: true },
    { id: '2', name: 'LinkedIn', connected: true },
    { id: '3', name: 'Glassdoor', connected: false },
    { id: '4', name: 'AngelList', connected: false },
  ],
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 200));
    set({ isLoading: false });
  },

  toggleEmailNotifications: () =>
    set((state) => ({ emailNotifications: !state.emailNotifications })),

  toggleJobSource: (sourceId) =>
    set((state) => ({
      jobSources: state.jobSources.map((s) =>
        s.id === sourceId ? { ...s, connected: !s.connected } : s
      ),
    })),
}));
