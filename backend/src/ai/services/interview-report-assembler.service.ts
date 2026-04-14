import {
  ClosingSummaryOutput,
  CoachHandoffOutput,
  InterviewReportOutput,
  InterviewSessionContext,
} from '../models/interview.types.js';

export function assembleInterviewReport(params: {
  session: InterviewSessionContext;
  closingSummary: ClosingSummaryOutput;
  coachHandoff: CoachHandoffOutput;
}): InterviewReportOutput {
  const { session, closingSummary, coachHandoff } = params;

  return {
    sessionMetadata: {
      sessionId: session.sessionId,
      role: session.targetRole,
      level: String(session.targetLevel),
      persona: session.persona,
      generatedAt: new Date().toISOString(),
    },
    overallSummary: closingSummary.overall,
    topStrengths: coachHandoff.topStrengths,
    areasToStrengthen: coachHandoff.areasToStrengthen,
    recruiterPerspective:
      'From the interviewer perspective, the candidate shows a credible professional base, with the strongest impact coming from clearer ownership, concrete examples, and visible outcomes.',
    nextInterviewFocus: [
      'Bring the main point earlier',
      'Make personal ownership more visible',
      'Close answers with a concrete result',
    ],
    selectedAnswerAnalysis: [],
    coachRecommendations: coachHandoff.recommendedCoachModules,
  };
}
