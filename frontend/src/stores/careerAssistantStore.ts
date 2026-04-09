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
  error: string | null;
  /** Last explicit mode (quick actions set it; follow-up messages reuse it). */
  activeMode: string;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  sendMessage: (text: string, mode?: string, jobId?: string | null) => Promise<void>;
  clearMessages: () => void;
}

export const useCareerAssistantStore = create<CareerAssistantStore>((set, get) => ({
  messages: [],
  isSending: false,
  error: null,
  activeMode: 'general',
  selectedJobId: null,

  setSelectedJobId: (id) => set({ selectedJobId: id }),
  clearMessages: () => set({ messages: [], error: null, activeMode: 'general' }),

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
