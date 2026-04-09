import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface CareerMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'error' | 'safety_refusal' | 'skill_verification_result';
  text?: string;
  createdAt: string;
}

interface CareerAssistantStore {
  messages: CareerMessage[];
  isSending: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  /** Last explicit mode (quick actions set it; follow-up messages reuse it). */
  activeMode: string;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  sendMessage: (text: string, mode?: string, jobId?: string | null) => Promise<void>;
  clearMessages: () => void;
  loadHistory: (userId: string) => Promise<void>;
}

export const useCareerAssistantStore = create<CareerAssistantStore>((set, get) => ({
  messages: [],
  isSending: false,
  isLoadingHistory: false,
  error: null,
  activeMode: 'general',
  selectedJobId: null,

  setSelectedJobId: (id) => set({ selectedJobId: id }),
  clearMessages: () => set({ messages: [], error: null, activeMode: 'general' }),

  async loadHistory(userId) {
    if (!userId || get().messages.length > 0) return;
    set({ isLoadingHistory: true });
    try {
      const history = await trpcClient.assistant.getHistory.query({ userId, limit: 20 });
      // getHistory returns conversation metadata rows (counts/timestamps), not message text.
      // Build a synthetic welcome message when there is prior activity so the user sees context.
      if (history.length > 0) {
        const latest = history[0];
        const lastDate = latest?.lastMessageAt
          ? new Date(latest.lastMessageAt as string | Date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : null;
        const welcomeBack: CareerMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          text: `Welcome back! You have a previous conversation${lastDate ? ` (last active ${lastDate})` : ''}. Feel free to continue where you left off.`,
          createdAt: new Date().toISOString(),
        };
        set({ messages: [welcomeBack] });
      }
    } catch {
      // non-fatal — just don't populate history
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  async sendMessage(text, modeArg, jobId = null) {
    if (!text.trim() || get().isSending) return;

    const mode = modeArg ?? get().activeMode;
    if (modeArg) {
      set({ activeMode: modeArg });
    }

    const history = get()
      .messages.filter((m) => (m.role === 'user' || m.role === 'assistant') && m.text)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text! }));

    const userMessage: CareerMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      text,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ messages: [...state.messages, userMessage], isSending: true, error: null }));

    try {
      const response = await trpcClient.assistant.sendMessage.mutate({
        text,
        mode,
        jobId,
        history: history.length > 0 ? history : undefined,
      });
      set((state) => ({ messages: [...state.messages, response] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isSending: false });
    }
  },
}));
