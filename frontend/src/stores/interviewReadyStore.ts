import { create } from 'zustand';
import { trpcClient } from '@/lib/api';

interface InterviewAnswerMetrics {
  answerDurationMs: number;
  speakingPaceWpm: number;
  pauseCount: number;
  fillerWordCount: number;
  eyeContactScore: number;
  frameStabilityScore: number;
  postureScore: number;
  gestureIntensityScore: number;
}

interface InterviewAnswerFeedback {
  score: number;
  comments: string;
}

interface InterviewQuestion {
  id: string;
  text: string;
}

interface InterviewAnswerRecord {
  questionId: string;
  questionText: string;
  transcript: string;
  metrics: InterviewAnswerMetrics;
  feedback: InterviewAnswerFeedback;
}

type SessionStatus =
  | 'setup'
  | 'processing'
  | 'asking'
  | 'listening'
  | 'feedback'
  | 'finished'
  | 'error';

interface InterviewReadyStore {
  sessionId: string | null;
  status: SessionStatus;
  error: string | null;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  currentTranscript: string;
  answers: InterviewAnswerRecord[];
  startSession: (userId: string) => Promise<void>;
  startAnswer: () => void;
  finishAnswer: (userId: string) => Promise<void>;
  nextQuestion: () => Promise<void>;
  resetSession: () => void;
}

export const useInterviewReadyStore = create<InterviewReadyStore>((set, get) => ({
  sessionId: null,
  status: 'setup',
  error: null,
  questions: [],
  currentQuestionIndex: 0,
  currentTranscript: '',
  answers: [],

  resetSession: () =>
    set({
      sessionId: null,
      status: 'setup',
      error: null,
      questions: [],
      currentQuestionIndex: 0,
      currentTranscript: '',
      answers: [],
    }),

  async startSession(userId) {
    set({ status: 'processing', error: null, questions: [], answers: [], currentQuestionIndex: 0 });
    try {
      const result = await trpcClient.interview.startSession.mutate({
        userId,
        mode: 'behavioral',
        difficulty: 'standard',
        questionCount: 3,
        recruiterPersona: 'neutral',
        selectedJobId: null,
      });
      set({ sessionId: result.sessionId, questions: result.questions, status: 'asking' });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start', status: 'error' });
    }
  },

  startAnswer: () => set({ status: 'listening', currentTranscript: '' }),

  async finishAnswer(userId) {
    const state = get();
    if (state.status !== 'listening') return;
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!state.sessionId || !currentQuestion) {
      set({ error: 'Missing session', status: 'error' });
      return;
    }

    const transcript = state.currentTranscript.trim() || 'No transcript available.';
    const metrics: InterviewAnswerMetrics = {
      answerDurationMs: 45000,
      speakingPaceWpm: 142,
      pauseCount: 3,
      fillerWordCount: 2,
      eyeContactScore: 92,
      frameStabilityScore: 88,
      postureScore: 95,
      gestureIntensityScore: 76,
    };

    set({ status: 'processing' });
    try {
      const result = await trpcClient.interview.finishAnswer.mutate({
        userId,
        sessionId: state.sessionId,
        questionId: currentQuestion.id,
        transcript,
        metrics,
      });
      const record: InterviewAnswerRecord = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        transcript,
        metrics: result.metrics,
        feedback: result.feedback,
      };
      set((s) => ({ answers: [...s.answers, record], status: 'feedback' }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit', status: 'error' });
    }
  },

  async nextQuestion() {
    const state = get();
    const next = state.currentQuestionIndex + 1;
    if (next >= state.questions.length) {
      set({ status: 'finished' });
    } else {
      set({ currentQuestionIndex: next, currentTranscript: '', status: 'asking' });
    }
  },
}));
