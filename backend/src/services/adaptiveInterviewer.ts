import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { interviewSessions, interviewAnswers } from '../db/schema.js';

export interface CandidateInsights {
  averageScore: number;
  sessionCount: number;
  weakAreas: string[];       // question patterns where score < 60
  strongAreas: string[];     // question patterns where score >= 80
  lastMode: string | null;
  suggestedDifficulty: 'standard' | 'stretch' | 'senior';
  adaptationNote: string;    // human-readable coaching note for the AI
}

export async function buildCandidateInsights(userId: string): Promise<CandidateInsights> {
  // Get last 5 completed sessions
  const sessions = await db
    .select({ id: interviewSessions.id, score: interviewSessions.score, mode: interviewSessions.mode, difficulty: interviewSessions.difficulty })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt))
    .limit(5);

  if (sessions.length === 0) {
    return {
      averageScore: 0,
      sessionCount: 0,
      weakAreas: [],
      strongAreas: [],
      lastMode: null,
      suggestedDifficulty: 'standard',
      adaptationNote: 'First session — start with a warm, encouraging tone and standard difficulty.',
    };
  }

  // Get answers from recent sessions
  const sessionIds = sessions.map(s => s.id);
  const answers = await Promise.all(
    sessionIds.map(id =>
      db.select({
        questionId: interviewAnswers.questionId,
        feedback: interviewAnswers.feedback,
      })
      .from(interviewAnswers)
      .where(eq(interviewAnswers.sessionId, id))
    )
  );
  const allAnswers = answers.flat();

  const scores = sessions.filter(s => s.score !== null).map(s => s.score as number);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Analyze answer-level scores
  const answerScores: Record<string, number[]> = {};
  for (const answer of allAnswers) {
    const feedback = answer.feedback as { score: number; comments: string } | null;
    if (!feedback) continue;
    const key = answer.questionId; // e.g. 'q1', 'q2'
    if (!answerScores[key]) answerScores[key] = [];
    answerScores[key].push(feedback.score);
  }

  const weakAreas: string[] = [];
  const strongAreas: string[] = [];
  for (const [qId, qScores] of Object.entries(answerScores)) {
    const avg = qScores.reduce((a, b) => a + b, 0) / qScores.length;
    if (avg < 60) weakAreas.push(qId);
    else if (avg >= 80) strongAreas.push(qId);
  }

  // Suggest difficulty based on average score
  let suggestedDifficulty: 'standard' | 'stretch' | 'senior' = 'standard';
  if (averageScore >= 80) suggestedDifficulty = 'senior';
  else if (averageScore >= 65) suggestedDifficulty = 'stretch';

  // Build coaching note
  let adaptationNote = '';
  if (averageScore >= 80) {
    adaptationNote = `Candidate is performing well (avg ${averageScore}/100). Push deeper — ask for specifics, challenge assumptions, probe edge cases. Increase question complexity.`;
  } else if (averageScore >= 60) {
    adaptationNote = `Candidate is at mid-level (avg ${averageScore}/100). Be encouraging but probe for structure — ask for STAR format, quantified outcomes. Gentle challenge.`;
  } else if (sessions.length <= 2) {
    adaptationNote = `Early sessions (avg ${averageScore}/100). Be warm and supportive. Give candidate time to think. Ask clarifying follow-ups before moving on.`;
  } else {
    adaptationNote = `Candidate struggling (avg ${averageScore}/100 across ${sessions.length} sessions). Be patient and constructive. Break questions into smaller parts. Offer hints via follow-up.`;
  }

  return {
    averageScore,
    sessionCount: sessions.length,
    weakAreas,
    strongAreas,
    lastMode: sessions[0]?.mode ?? null,
    suggestedDifficulty,
    adaptationNote,
  };
}
