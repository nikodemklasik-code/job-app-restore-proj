import { create } from 'zustand';
import { trpcClient } from '@/lib/api';
import type { AssistantHistoryMessage } from '../../../shared/assistant';

type AssistantStatus = 'idle' | 'syncing' | 'sending' | 'error';

interface CareerAssistantStore {
  conversationId: string | null;
  messages: AssistantHistoryMessage[];
  status: AssistantStatus;
  error: string | null;
  /** True when server history failed — chat still works; product memory is document-led, not this list. */
  historyLoadFailed: boolean;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  loadHistory: () => Promise<void>;
  sendMessage: (text: string, mode?: 'general' | 'cv' | 'interview' | 'salary') => Promise<void>;
  resetError: () => void;
  dismissHistoryWarning: () => void;
  clearMessages: () => void;
}

function sortAsc(msgs: AssistantHistoryMessage[]): AssistantHistoryMessage[] {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export const useCareerAssistantStore = create<CareerAssistantStore>((set, get) => ({
  conversationId: null,
  messages: [],
  status: 'idle',
  error: null,
  historyLoadFailed: false,
  selectedJobId: null,

  setSelectedJobId: (id) => set({ selectedJobId: id }),

  async loadHistory() {
    if (get().status === 'syncing') return;
    set({ status: 'syncing', error: null, historyLoadFailed: false });
    try {
      const history = await trpcClient.assistant.getHistory.query();
      set({
        messages: sortAsc(history as AssistantHistoryMessage[]),
        conversationId: (history[0] as AssistantHistoryMessage | undefined)?.conversationId ?? null,
        status: 'idle',
        error: null,
        historyLoadFailed: false,
      });
    } catch {
      set({
        messages: [],
        conversationId: null,
        status: 'idle',
        error: null,
        historyLoadFailed: true,
      });
    }
  },

  async sendMessage(text, mode = 'general') {
    const trimmed = text.trim();
    if (!trimmed || get().status === 'sending') return;

    const optimistic: AssistantHistoryMessage = {
      id: crypto.randomUUID(),
      conversationId: get().conversationId ?? 'pending',
      role: 'user',
      text: trimmed,
      sourceType: 'manual_user_input',
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      messages: sortAsc([...s.messages, optimistic]),
      status: 'sending',
      error: null,
    }));

    try {
      const resp = await trpcClient.assistant.sendMessage.mutate({
        text: trimmed,
        mode,
        sourceType: 'manual_user_input',
        jobId: get().selectedJobId,
      });
      if ('status' in resp && resp.status === 'incomplete_profile') {
        // Profile incomplete — silently roll back optimistic message
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== optimistic.id),
          status: 'idle',
          error: null,
        }));
        return;
      }
      const okResp = resp as { conversationId: string; userRecord: unknown; aiRecord: unknown };
      set((s) => ({
        conversationId: okResp.conversationId,
        messages: sortAsc([
          ...s.messages.filter((m) => m.id !== optimistic.id),
          okResp.userRecord as AssistantHistoryMessage,
          okResp.aiRecord as AssistantHistoryMessage,
        ]),
        status: 'idle',
        error: null,
      }));
    } catch {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== optimistic.id),
        status: 'error',
        error: 'Message could not be sent. Please try again.',
      }));
    }
  },

  resetError() {
    set({ status: 'idle', error: null });
  },

  dismissHistoryWarning() {
    set({ historyLoadFailed: false });
  },

  clearMessages() {
    // Clears local view only — starts fresh conversation thread on next message
    set({ messages: [], conversationId: null, status: 'idle', error: null, historyLoadFailed: false });
  },
}));
