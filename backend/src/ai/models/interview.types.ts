export type PersonaId = 'sarah' | 'james' | 'alex';
export type InterviewMode = 'interview' | 'coach';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';

export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate' | 'system';
  text: string;
  timestamp?: string;
}

export interface MultimodalSignalsInput {
  voice?: {
    pacing?: 'slow' | 'balanced' | 'fast' | 'variable';
    hesitationLevel?: 'low' | 'medium' | 'high';
    vocalStability?: 'low' | 'medium' | 'high';
    fillerWordLevel?: 'low' | 'medium' | 'high';
  };
  visual?: {
    eyeContact?: 'low' | 'medium' | 'high';
    facialComposure?: 'low' | 'medium' | 'high';
    postureStability?: 'low' | 'medium' | 'high';
  };
}

export interface InterviewSessionContext {
  sessionId: string;
  targetRole: string;
  targetLevel: SeniorityLevel | string;
  persona: PersonaId;
  transcript: TranscriptTurn[];
  multimodalSignals?: MultimodalSignalsInput;
}

export interface InterviewTurnInput extends InterviewSessionContext {
  latestCandidateAnswer: string;
}

export interface InterviewTurnOutput {
  interviewerReply: string;
  shouldEnd: boolean;
  reasoningNotes?: string[];
}

export interface ClosingSummaryOutput {
  overall: string;
  strengths: string[];
  growthFocus: string;
  spokenVersion: string;
}

export interface CoachHandoffOutput {
  topStrengths: string[];
  areasToStrengthen: string[];
  weakestSections: string[];
  communicationPatterns: string[];
  recommendedCoachModules: string[];
}

export interface InterviewReportOutput {
  sessionMetadata: {
    sessionId: string;
    role: string;
    level: string;
    persona: PersonaId;
    generatedAt: string;
  };
  overallSummary: string;
  topStrengths: string[];
  areasToStrengthen: string[];
  recruiterPerspective: string;
  nextInterviewFocus: string[];
  selectedAnswerAnalysis: Array<{
    question: string;
    answer: string;
    whatWorked: string[];
    whatToStrengthen: string[];
  }>;
  coachRecommendations: string[];
}
