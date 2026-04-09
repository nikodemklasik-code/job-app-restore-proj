import type {
  InterviewAnswerFeedback,
  InterviewAnswerMetrics,
  InterviewMode,
  InterviewQuestion,
} from '../../../shared/interview.js';

const questionBank: Record<InterviewMode, string[]> = {
  behavioral: [
    'Tell me about yourself and the experience most relevant to this role.',
    'Describe a time you handled conflicting priorities under pressure.',
    'Tell me about a mistake you made and how you fixed it.',
    'Describe a project where you influenced a team decision.',
    'Tell me about a time you had to learn something quickly to deliver.',
  ],
  technical: [
    'Walk me through a technical decision you made recently and why.',
    'Describe a production issue you investigated and how you resolved it.',
    'How do you approach debugging performance problems in a frontend app?',
    'Tell me how you design maintainable API contracts across teams.',
    'Explain a tradeoff you made between speed of delivery and long-term quality.',
  ],
  general: [
    'What are you looking for in your next role and why now?',
    'Why does this opportunity interest you?',
    'What strengths would your recent teammates highlight first?',
    'What type of environment helps you do your best work?',
    'What is one area you are actively improving right now?',
  ],
};

export function buildInterviewQuestions(
  mode: InterviewMode,
  questionCount: number,
): InterviewQuestion[] {
  const bank = questionBank[mode];
  return Array.from({ length: questionCount }, (_, index) => ({
    id: `q${index + 1}`,
    text: bank[index % bank.length],
  }));
}

export function scoreInterviewAnswer(
  metrics: InterviewAnswerMetrics,
  transcript: string,
): InterviewAnswerFeedback {
  const eyeContactContribution = Math.round(metrics.eyeContactScore * 0.08);
  const postureContribution = Math.round(metrics.postureScore * 0.05);
  const paceContribution =
    metrics.speakingPaceWpm >= 110 && metrics.speakingPaceWpm <= 160 ? 6 : 0;
  const fillerPenalty = metrics.fillerWordCount * 2;
  const pausePenalty = Math.max(0, metrics.pauseCount - 2);
  const shortAnswerPenalty = transcript.trim().length < 40 ? 8 : 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      72 +
        eyeContactContribution +
        postureContribution +
        paceContribution -
        fillerPenalty -
        pausePenalty -
        shortAnswerPenalty,
    ),
  );

  let comments = 'Good structure overall. Add more quantified examples and tighten your closing sentence.';
  if (score >= 90) comments = 'Excellent answer. Clear structure, strong examples, confident delivery.';
  else if (score >= 80) comments = 'Strong answer. Add one more specific example with a measurable outcome.';
  else if (score < 60) comments = 'Answer needs more depth. Aim for the STAR format: Situation, Task, Action, Result.';

  return { score, comments };
}

export function computeSessionScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}
