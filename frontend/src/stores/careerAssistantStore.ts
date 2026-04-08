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
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  sendMessage: (text: string, mode?: string, jobId?: string | null) => Promise<void>;
  clearMessages: () => void;
}

export const useCareerAssistantStore = create<CareerAssistantStore>((set, get) => ({
  messages: [],
  isSending: false,
  error: null,
  selectedJobId: null,

  setSelectedJobId: (id) => set({ selectedJobId: id }),
  clearMessages: () => set({ messages: [], error: null }),

  async sendMessage(text, mode = 'general', jobId = null) {
    if (!text.trim() || get().isSending) return;

    const userMessage: CareerMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      text,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ messages: [...state.messages, userMessage], isSending: true, error: null }));

    try {
      const response = await trpcClient.assistant.sendMessage.mutate({ text, mode, jobId });
      set((state) => ({ messages: [...state.messages, response] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isSending: false });
    }
  },
}));
