import type { InterviewFeedback } from '../../prompts/schemas/interview-feedback.schema.js';
import type { CoachHandoff } from '../../prompts/schemas/handoff.schema.js';

export interface PdfReportPayload {
  sessionMetadata: {
    role: string;
    level: string;
    persona: string;
    date: string;
  };
  interviewFeedback: InterviewFeedback;
  coachHandoff: CoachHandoff;
}

export function buildPdfReportPayload(params: PdfReportPayload) {
  return {
    title: 'Interview Report',
    ...params,
  };
}
