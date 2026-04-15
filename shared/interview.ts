export const interviewModes = ['behavioral', 'technical', 'general', 'hr', 'case-study', 'language-check'] as const;
export type InterviewMode = (typeof interviewModes)[number];

export const interviewModeLabels: Record<InterviewMode, { label: string; emoji: string; description: string }> = {
  behavioral: { label: 'Behavioral', emoji: '🧠', description: 'STAR-method questions about past experience' },
  technical: { label: 'Technical', emoji: '⚙️', description: 'System design, code, architecture decisions' },
  general: { label: 'General HR', emoji: '💼', description: 'Motivations, culture fit, career goals' },
  hr: { label: 'HR Screen', emoji: '🤝', description: 'Salary, availability, soft skills, expectations' },
  'case-study': { label: 'Case Study', emoji: '📊', description: 'Business problem-solving and analytical thinking' },
  'language-check': { label: 'Language Check', emoji: '🌍', description: 'Fluency, clarity, and communication in English' },
};

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
  // enriched fields (present when LLM scoring is used)
  starPresence?: { situation: boolean; task: boolean; action: boolean; result: boolean };
  improvementTip?: string;
  clarityScore?: number;   // 0-100
  confidenceNote?: string; // e.g. "Answer was hesitant — lacked specific examples"
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
