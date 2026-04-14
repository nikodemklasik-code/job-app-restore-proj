import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { subscriptions, users } from '../../db/schema.js';

const CREDITS_PER_EVALUATION = 5;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const CATEGORY_CONTEXT: Record<string, string> = {
  behavioural: `You are an expert career coach specialising in behavioural interview technique.
Your job is to evaluate the candidate's answer against the STAR framework (Situation, Task, Action, Result) and competency evidence.
Focus on: ownership language, specific personal actions, measurable outcomes, narrative clarity, and avoidance of vague generalisations.
Use British English throughout.`,

  technical: `You are a senior technical interviewer and career coach with deep expertise in software engineering.
Your job is to evaluate the candidate's answer for technical depth, clarity of reasoning, trade-off awareness, and communication of complex ideas.
Focus on: specificity of technical decisions, awareness of alternatives, real-world applicability, and ability to explain clearly to both technical and non-technical audiences.
Use British English throughout.`,

  motivation: `You are an expert career coach specialising in values-based and motivational interview technique.
Your job is to evaluate how authentically and specifically the candidate communicates their motivations, values, and career goals.
Focus on: specificity (not generic answers), alignment with the role, genuine self-awareness, and forward-looking narrative.
Use British English throughout.`,

  situational: `You are an expert career coach specialising in situational and scenario-based interview technique.
Your job is to evaluate how the candidate approaches hypothetical challenges — their decision-making logic, stakeholder awareness, and practical problem-solving.
Focus on: structured thinking, prioritisation, communication, risk awareness, and realistic action plans.
Use British English throughout.`,
};

export const coachRouter = router({
  evaluateAnswer: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      category: z.enum(['behavioural', 'technical', 'motivation', 'situational']),
      question: z.string().max(500),
      answer: z.string().max(3000),
    }))
    .mutation(async ({ input }) => {
      // ── Resolve local user + check credits ────────────────────────────────
      const userRow = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRow[0]?.id;

      if (localUserId) {
        const sub = (await db.select({ credits: subscriptions.credits, plan: subscriptions.plan })
          .from(subscriptions)
          .where(eq(subscriptions.userId, localUserId))
          .limit(1))[0];

        const currentCredits = sub?.credits ?? 100;
        if (currentCredits < CREDITS_PER_EVALUATION) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Not enough credits. Coach evaluation costs ${CREDITS_PER_EVALUATION} credits. You have ${currentCredits} remaining.`,
          });
        }

        // Deduct credits immediately
        await db.update(subscriptions)
          .set({ credits: sql`${subscriptions.credits} - ${CREDITS_PER_EVALUATION}` })
          .where(eq(subscriptions.userId, localUserId));
      }

      // ── OpenAI evaluation ─────────────────────────────────────────────────
      const openai = getOpenAI();

      if (!openai) {
        // Fallback: client-side heuristic
        return buildHeuristicFeedback(input.category, input.answer);
      }

      const systemPrompt = CATEGORY_CONTEXT[input.category] ?? CATEGORY_CONTEXT.behavioural;

      const userPrompt = `Interview question: "${input.question}"

Candidate's answer:
"""
${input.answer.slice(0, 2000)}
"""

Evaluate this answer and return ONLY valid JSON matching this exact schema:
{
  "score": <integer 0-100>,
  "label": "<Excellent|Good|Developing|Needs work>",
  "whatWorked": ["<specific observation>", ...],
  "toImprove": ["<specific actionable advice>", ...],
  "expertInsight": "<2-3 sentence expert coaching insight specific to this category and question — what separates a good answer from a great one for this exact question>",
  "interviewTip": "<1-2 sentence tactical tip: how to use or improve this answer in a real interview situation>"
}

STRICT LANGUAGE RULES — these override everything:
- NEVER use generic praise phrases: "That was great!", "Good job!", "Well done!", "That was a good answer", "Nice work"
- Every observation must name the specific element, explain why it works or doesn't, and what effect it has on the interviewer
- Format: "Your answer [describes specific element] — this [explains the effect/impact]. [Optional: alternatively, consider…]"
- toImprove items must give a concrete reframe, example phrasing, or perspective shift — not just "add more detail"
- expertInsight must offer a professional lens the candidate hasn't considered, not a summary of what they already said
- If the answer is blank or very short, all scores should be low and feedback should explain exactly what is missing and why it matters`;

      try {
        const resp = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 600,
          temperature: 0.4,
        });

        const raw = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as {
          score?: number;
          label?: string;
          whatWorked?: string[];
          toImprove?: string[];
          expertInsight?: string;
          interviewTip?: string;
        };

        return {
          score: typeof raw.score === 'number' ? Math.min(100, Math.max(0, raw.score)) : 50,
          label: raw.label ?? 'Developing',
          whatWorked: Array.isArray(raw.whatWorked) ? raw.whatWorked.slice(0, 3) : [],
          toImprove: Array.isArray(raw.toImprove) ? raw.toImprove.slice(0, 3) : [],
          expertInsight: raw.expertInsight ?? '',
          interviewTip: raw.interviewTip ?? '',
          creditsUsed: CREDITS_PER_EVALUATION,
        };
      } catch {
        return buildHeuristicFeedback(input.category, input.answer);
      }
    }),
});

// ── Heuristic fallback (no OpenAI) ────────────────────────────────────────────

function buildHeuristicFeedback(category: string, answer: string) {
  const t = answer.trim().toLowerCase();
  const words = t.split(/\s+/).length;
  const hasSituation = /\b(when|during|at my|in my previous|back in)\b/.test(t);
  const hasAction = /\b(i (did|led|built|created|implemented|decided|introduced))\b/.test(t);
  const hasResult = /\b(result|outcome|achiev|improv|reduc|increas|saved|delivered|launched)\b/.test(t);

  let score = 50;
  if (words >= 80) score += 15; else if (words < 20) score -= 15;
  if (hasSituation) score += 8;
  if (hasAction) score += 10;
  if (hasResult) score += 12;
  score = Math.max(20, Math.min(100, Math.round(score)));

  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Developing' : 'Needs work';

  const INSIGHTS: Record<string, string> = {
    behavioural: 'The strongest behavioural answers use the full STAR structure and close with a specific, measurable result. Interviewers are trained to listen for all four components.',
    technical: 'Expert technical answers explain not just what you did, but why you chose that approach over alternatives — demonstrating judgement, not just knowledge.',
    motivation: 'The best motivation answers are specific to the role and company. Generic answers ("I want to grow") are easy to spot; specific ones ("I want to work on distributed systems at scale") signal genuine interest.',
    situational: 'Strong situational answers show structured thinking: identify the problem, consider options, choose a path, and explain the reasoning — not just what you would do, but why.',
  };

  return {
    score,
    label,
    whatWorked: hasSituation ? ['You provided context — the interviewer can follow the story.'] : [],
    toImprove: [
      !hasSituation ? 'Open with a clear context: "At my previous company…" or "In my last role…"' : '',
      !hasAction ? 'Make your personal contribution explicit: "I decided…", "I built…", "I led…"' : '',
      !hasResult ? 'Close with the outcome: "As a result…", "This led to…". Add a number if possible.' : '',
    ].filter(Boolean),
    expertInsight: INSIGHTS[category] ?? INSIGHTS.behavioural,
    interviewTip: 'Prepare 3-5 strong stories before any interview. Each story should cover all four STAR elements and include at least one number.',
    creditsUsed: CREDITS_PER_EVALUATION,
  };
}
