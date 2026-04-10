import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

export interface ProviderStatus {
  name: string;
  label: string;
  icon: string;
  description: string;
  isEnabled: boolean;
  category: string;
  readiness: { ready: boolean; reason?: string };
  requiresSession: boolean;
  requiresApiKey: string | null;
  isAiPowered: boolean;
}

interface JobSourceSettingsStore {
  providers: ProviderStatus[];
  isLoading: boolean;
  load(userId: string): Promise<void>;
  toggle(userId: string, providerName: string, isEnabled: boolean): Promise<void>;
}

export const useJobSourceSettingsStore = create<JobSourceSettingsStore>((set, get) => ({
  providers: [],
  isLoading: false,

  async load(userId: string) {
    set({ isLoading: true });
    try {
      const result = await trpcClient.jobSources.list.query({ userId });
      set({
        providers: result.map((p) => ({
          name: p.name,
          label: p.label,
          icon: p.icon,
          description: p.description,
          isEnabled: p.isEnabled,
          category: p.category,
          readiness: p.readiness,
          requiresSession: p.requiresSession,
          requiresApiKey: p.requiresApiKey,
          isAiPowered: p.isAiPowered,
        })),
      });
    } catch (err) {
      console.error('[jobSourceSettingsStore] Failed to load:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  async toggle(userId: string, providerName: string, isEnabled: boolean) {
    // Optimistic update
    set((state) => ({
      providers: state.providers.map((p) =>
        p.name === providerName ? { ...p, isEnabled } : p,
      ),
    }));
    try {
      await trpcClient.jobSources.update.mutate({ userId, providerName, isEnabled });
    } catch (err) {
      console.error('[jobSourceSettingsStore] Failed to update:', err);
      // Revert on failure
      set((state) => ({
        providers: state.providers.map((p) =>
          p.name === providerName ? { ...p, isEnabled: !isEnabled } : p,
        ),
      }));
    }
  },
}));
