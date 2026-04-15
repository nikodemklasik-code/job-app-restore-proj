import { create } from 'zustand';
import { trpcClient } from '@/lib/api';
import type {
  InterviewMode,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewAnswerMetrics,
  InterviewSessionHistoryItem,
} from '../../../shared/interview';

type SessionPhase =
  | 'idle'
  | 'starting'
  | 'in_progress'
  | 'saving'
  | 'completing'
  | 'done'
  | 'error';

interface InterviewStore {
  phase: SessionPhase;
  sessionId: string | null;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  history: InterviewSessionHistoryItem[];
  error: string | null;

  startSession: (params: {
    mode: InterviewMode;
    difficulty: InterviewDifficulty;
    questionCount: number;
    recruiterPersona?: string | null;
    selectedJobId?: string | null;
  }) => Promise<void>;

  saveAnswer: (params: {
    questionId: string;
    questionText: string;
    transcript: string;
    metrics: InterviewAnswerMetrics;
  }) => Promise<{ score: number; comments: string } | null>;

  completeSession: () => Promise<{ score: number } | null>;

  loadHistory: () => Promise<void>;

  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  phase: 'idle',
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  history: [],
  error: null,

  async startSession(params) {
    set({ phase: 'starting', error: null });
    try {
      const result = await trpcClient.interview.startSession.mutate(params);
      set({
        phase: 'in_progress',
        sessionId: result.sessionId,
        questions: result.questions,
        currentQuestionIndex: 0,
      });
    } catch (e: unknown) {
      set({
        phase: 'error',
        error: e instanceof Error ? e.message : 'Failed to start',
      });
    }
  },

  async saveAnswer(params) {
    const { sessionId } = get();
    if (!sessionId) return null;
    set({ phase: 'saving' });
    try {
      const result = await trpcClient.interview.saveAnswer.mutate({
        sessionId,
        ...params,
      });
      set((s) => ({
        phase: 'in_progress',
        currentQuestionIndex: s.currentQuestionIndex + 1,
      }));
      return result.answer.feedback;
    } catch (e: unknown) {
      set({
        phase: 'error',
        error: e instanceof Error ? e.message : 'Failed to save answer',
      });
      return null;
    }
  },

  async completeSession() {
    const { sessionId } = get();
    if (!sessionId) return null;
    set({ phase: 'completing' });
    try {
      const result = await trpcClient.interview.completeSession.mutate({
        sessionId,
      });
      set({ phase: 'done' });
      return { score: result.score };
    } catch (e: unknown) {
      set({
        phase: 'error',
        error: e instanceof Error ? e.message : 'Failed to complete',
      });
      return null;
    }
  },

  async loadHistory() {
    try {
      const history = await trpcClient.interview.getHistory.query({});
      set({ history: history as unknown as InterviewSessionHistoryItem[] });
    } catch {
      // non-fatal — history is cosmetic
    }
  },

  reset() {
    set({
      phase: 'idle',
      sessionId: null,
      questions: [],
      currentQuestionIndex: 0,
      error: null,
    });
  },
}));
