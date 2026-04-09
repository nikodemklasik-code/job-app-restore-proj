export const interviewModes = ['behavioral', 'technical', 'general'] as const;
export type InterviewMode = (typeof interviewModes)[number];

export const interviewDifficulties = ['standard', 'stretch', 'senior'] as const;
export type InterviewDifficulty = (typeof interviewDifficulties)[number];

export interface InterviewAnswerMetrics {
  answerDurationMs: number;
  speakingPaceWpm: number;
  pauseCount: number;
  fillerWordCount: number;
  eyeContactScore: number;
  frameStabilityScore: number;
  postureScore: number;
  gestureIntensityScore: number;
}

export interface InterviewAnswerFeedback {
  score: number;
  comments: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
}

export interface InterviewAnswerRecord {
  id: string;
  sessionId: string;
  questionId: string;
  questionText: string;
  transcript: string;
  metrics: InterviewAnswerMetrics;
  feedback: InterviewAnswerFeedback;
  createdAt: string;
}

export interface InterviewSessionHistoryItem {
  id: string;
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  status: 'in_progress' | 'completed';
  score: number | null;
  questionCount: number;
  recruiterPersona: string | null;
  selectedJobId: string | null;
  createdAt: string;
  updatedAt: string;
  answers: InterviewAnswerRecord[];
}

export interface StartInterviewSessionInput {
  mode: InterviewMode;
  difficulty: InterviewDifficulty;
  questionCount: number;
  recruiterPersona?: string | null;
  selectedJobId?: string | null;
}

export interface StartInterviewSessionResult {
  sessionId: string;
  questions: InterviewQuestion[];
}

export interface FinishInterviewAnswerInput {
  sessionId: string;
  questionId: string;
  questionText: string;
  transcript: string;
  metrics: InterviewAnswerMetrics;
}

export interface FinishInterviewAnswerResult {
  answer: InterviewAnswerRecord;
}

export interface CompleteInterviewSessionResult {
  sessionId: string;
  status: 'completed';
  score: number;
}
