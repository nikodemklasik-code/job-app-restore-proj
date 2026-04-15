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
    'Give an example of when you showed leadership without formal authority.',
    'Tell me about a time you disagreed with your manager and how you handled it.',
  ],
  technical: [
    'Walk me through a technical decision you made recently and why.',
    'Describe a production issue you investigated and how you resolved it.',
    'How do you approach debugging performance problems in a frontend app?',
    'Tell me how you design maintainable API contracts across teams.',
    'Explain a tradeoff you made between speed of delivery and long-term quality.',
    'How would you design a URL shortening service from scratch?',
    'What is your approach to testing strategy in a growing codebase?',
  ],
  general: [
    'What are you looking for in your next role and why now?',
    'Why does this opportunity interest you?',
    'What strengths would your recent teammates highlight first?',
    'What type of environment helps you do your best work?',
    'What is one area you are actively improving right now?',
    'How do you prioritise when everything feels urgent?',
    'Where do you see yourself in three years?',
  ],
  hr: [
    'What are your salary expectations for this role?',
    'When are you available to start?',
    'Are you currently interviewing elsewhere?',
    'How do you prefer to receive feedback from a manager?',
    'Describe your ideal work-life balance and how you maintain it.',
    'Tell me about a time you navigated a difficult colleague relationship.',
    'What does recognition at work mean to you?',
  ],
  'case-study': [
    "A client's revenue has dropped 20% in 3 months. Walk me through how you'd diagnose and address this.",
    'Your company wants to enter a new market. How would you evaluate the opportunity?',
    'You have a $500k marketing budget for a product launch. How do you allocate it?',
    'Estimate the number of Uber rides taken in London on a typical weekday.',
    "You're the PM for a feature that's been live 2 weeks and has low adoption. What do you do?",
    'How would you prioritise a product backlog of 40 items when you can only ship 5 this sprint?',
    "A competitor just launched a feature your team has been building. What's your response?",
  ],
  'language-check': [
    "Introduce yourself in 2 minutes — tell me about your background and why you're here.",
    "Describe the most complex project you've delivered — focus on clear, concise explanation.",
    'Explain a technical concept you know well as if talking to a non-technical stakeholder.',
    'Tell me about a time you had to adapt your communication style for a different audience.',
    'What is your approach to written communication in a remote team?',
    'Summarise your career story in 3 sentences.',
    'How do you ensure your message lands clearly when presenting to senior leadership?',
  ],
};

// ── STAR detection helpers ────────────────────────────────────────────────────

function detectStar(transcript: string): { situation: boolean; task: boolean; action: boolean; result: boolean } {
  const t = transcript.toLowerCase();
  const situation = /\b(when|at the time|there was|we were|our team|last year|during|in my previous|at \w+ company|back in)\b/.test(t);
  const task = /\b(i needed to|my (task|goal|job|responsibility) was|i was responsible|i had to|assigned to|my role was|tasked with)\b/.test(t);
  const action = /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized|designed))\b/.test(t);
  const result = /\b(result(ed)?( in)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|we (launched|delivered|hit|exceeded|met))\b/.test(t);
  return { situation, task, action, result };
}

function starImprovementTip(star: ReturnType<typeof detectStar>, transcript: string): string {
  const missing = (Object.entries(star) as [string, boolean][]).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length === 0) {
    return transcript.length < 120
      ? 'Good STAR coverage — add more specific detail and quantify the result to strengthen the answer.'
      : 'Excellent STAR structure. Consider adding a quantified outcome to make it even more compelling.';
  }
  const tips: Record<string, string> = {
    situation: 'Add context — briefly describe the situation or project you were in.',
    task: 'Clarify your specific responsibility — what were you personally tasked with?',
    action: 'Emphasise your own actions — use "I did…" statements with specific steps.',
    result: 'Always close with the outcome — numbers, impact, or what was learned.',
  };
  return tips[missing[0]] ?? 'Structure your answer using STAR: Situation, Task, Action, Result.';
}

function clarityScore(transcript: string, metrics: InterviewAnswerMetrics): number {
  let score = 70;
  if (metrics.speakingPaceWpm >= 110 && metrics.speakingPaceWpm <= 160) score += 8;
  if (metrics.fillerWordCount <= 1) score += 6;
  else if (metrics.fillerWordCount >= 5) score -= 10;
  if (transcript.length >= 200) score += 6;
  else if (transcript.length < 80) score -= 12;
  if (metrics.pauseCount <= 3) score += 5;
  else if (metrics.pauseCount >= 8) score -= 8;
  return Math.max(0, Math.min(100, score));
}

function confidenceNote(metrics: InterviewAnswerMetrics, transcript: string): string {
  const t = transcript.toLowerCase();
  const hesitantWords = (t.match(/\b(um|uh|like|you know|kind of|sort of|maybe|i guess|i think i|not sure|probably)\b/g) ?? []).length;
  if (hesitantWords >= 5) return 'High hesitation detected — cut filler words and pause instead of using "um/like".';
  if (metrics.speakingPaceWpm > 180) return 'Speaking pace is very fast — slow down to sound more confident and considered.';
  if (metrics.speakingPaceWpm < 90) return 'Speaking pace is slow — try to be more decisive and direct in phrasing.';
  if (transcript.length < 60) return 'Answer is very brief — expand with specific examples to demonstrate confidence.';
  return 'Delivery is solid. Focus on grounding your answer in specific, concrete examples.';
}

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

  const starPresence = detectStar(transcript);
  const improvementTip = starImprovementTip(starPresence, transcript);
  const clarity = clarityScore(transcript, metrics);
  const confidenceN = confidenceNote(metrics, transcript);

  return { score, comments, starPresence, improvementTip, clarityScore: clarity, confidenceNote: confidenceN };
}

export function computeSessionScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}
