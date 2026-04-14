export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate' | 'system';
  text: string;
  timestamp?: string;
}

export interface InterviewSession {
  sessionId: string;
  targetRole: string;
  targetLevel: string;
  persona: 'sarah' | 'james' | 'alex';
  turns: TranscriptTurn[];
}
