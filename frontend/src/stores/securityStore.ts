import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface Passkey {
  id: string;
  name: string;
  lastUsed: string;
  isActive: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityStore {
  passkeys: Passkey[];
  activeSessions: ActiveSession[];
  isLoading: boolean;
  error: string | null;
  loadSecurityData: (userId: string) => Promise<void>;
  revokeSession: (userId: string, sessionId: string) => Promise<void>;
  removePasskey: (userId: string, passkeyId: string) => Promise<void>;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  passkeys: [],
  activeSessions: [],
  isLoading: false,
  error: null,

  async loadSecurityData(userId) {
    set({ isLoading: true, error: null });
    try {
      const [passkeysResult, sessionsResult] = await Promise.all([
        trpcClient.security.getPasskeys.query({ userId }),
        trpcClient.security.getActiveSessions.query({ userId }),
      ]);
      set({ passkeys: passkeysResult, activeSessions: sessionsResult, isLoading: false });
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

  async removePasskey(userId, passkeyId) {
    try {
      const result = await trpcClient.security.removePasskey.mutate({ userId, passkeyId });
      if (result.success) {
        set((state) => ({
          passkeys: state.passkeys.filter((p) => p.id !== passkeyId),
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove passkey' });
    }
  },
}));
