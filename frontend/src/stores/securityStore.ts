import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityStore {
  activeSessions: ActiveSession[];
  isLoading: boolean;
  error: string | null;
  loadSecurityData: (userId: string) => Promise<void>;
  revokeSession: (userId: string, sessionId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  activeSessions: [],
  isLoading: false,
  error: null,

  async loadSecurityData(userId) {
    set({ isLoading: true, error: null });
    try {
      const sessionsResult = await trpcClient.security.getActiveSessions.query({ userId });
      set({ activeSessions: sessionsResult, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load security data',
        isLoading: false,
      });
    }
  },

  async revokeSession(userId, sessionId) {
    try {
      const result = await trpcClient.security.revokeSession.mutate({ userId, sessionId });
      if (result.success) {
        set((state) => ({
          activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to revoke session' });
    }
  },
}));
