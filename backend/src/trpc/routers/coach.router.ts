import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc.js';
import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../../lib/openai/model-registry.js';
import { BillingError } from '../../services/creditsBilling.js';
import { FEATURE_COSTS } from '../../services/creditsConfig.js';
import {
  billingToTrpc,
  requireSpendApproval,
  settleSpendFailure,
  settleSpendSuccess,
} from './_shared.js';

const coachSessionCfg = FEATURE_COSTS.coach_session;
const COACH_SESSION_DEBIT =
  coachSessionCfg.kind === 'estimated' ? coachSessionCfg.maxCost : coachSessionCfg.cost;

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

const evaluateAnswerProcedure = protectedProcedure
  .use(requireSpendApproval('coach_session'))
  .input(
    z.object({
      category: z.enum(['behavioural', 'technical', 'motivation', 'situational']),
      question: z.string().max(500),
      answer: z.string().max(3000),
    }),
  );

export const coachRouter = router({
  evaluateAnswer: evaluateAnswerProcedure.mutation(async ({ ctx, input }) => {
    let spendFinalized = false;
    const commitAndReturn = async (out: {
      score: number;
      label: string;
      whatWorked: string[];
      toImprove: string[];
      expertInsight: string;
      interviewTip: string;
    }) => {
      try {
        await settleSpendSuccess(ctx, COACH_SESSION_DEBIT, 'Coach evaluateAnswer completed');
        spendFinalized = true;
      } catch (e) {
        await settleSpendFailure(ctx, e instanceof Error ? e.message : 'commit_failed');
        spendFinalized = true;
        if (e instanceof BillingError) billingToTrpc(e);
        throw e;
      }
      return { ...out, creditsUsed: COACH_SESSION_DEBIT };
    };

    try {
      const openai = tryGetOpenAiClient();

      if (!openai) {
        return commitAndReturn(buildHeuristicFeedback(input.category, input.answer));
      }

      const systemPrompt = CATEGORY_CONTEXT[input.category] ?? CATEGORY_CONTEXT.behavioural;

      const userPrompt = `Interview question: "${input.question}"

Candidate's answer:
"""
${input.answer.slice(0, 2400)}
"""

Evaluate this answer and return ONLY valid JSON matching this exact schema:
{
  "score": <integer 0-100>,
  "label": "<Excellent|Good|Developing|Needs work>",
  "whatWorked": ["<specific observation>", ...],
  "toImprove": ["<specific actionable advice>", ...],
  "expertInsight": "<2-3 sentence expert coaching insight specific to this category and question>",
  "interviewTip": "<1-2 sentence tactical tip for using or improving this answer in a live interview>"
}

SCORING CALIBRATION:
- 90-100 only for answers that are unusually strong, specific, well-structured and commercially or technically convincing.
- 75-89 for solid answers with a few gaps.
- 55-74 for answers that are usable but generic, thin or partially structured.
- Below 55 when the answer is vague, under-evidenced, rambling or missing key logic.

STRICT LANGUAGE RULES:
- Never use generic praise such as "Good job", "Well done", "Strong answer" without evidence.
- Every point must identify the specific feature, explain why it helps or hurts, and what effect it has on the interviewer.
- Prefer formulas like: "Your answer does X — this helps because Y." and "The answer misses X — this leaves the interviewer without Y."
- toImprove items must include a concrete reframe, sharper wording, or a missing layer of evidence.
- expertInsight must explain what separates an average answer from a persuasive one for this exact question type.
- interviewTip must sound practical and field-ready, not motivational.
- If the answer is short, generic or under-evidenced, say so directly.
- Do not invent metrics, projects, technologies or achievements not present in the answer.`;

      try {
        const resp = await openai.chat.completions.create({
          model: getDefaultTextModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 700,
          temperature: 0.35,
        });

        const raw = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as {
          score?: number;
          label?: string;
          whatWorked?: string[];
          toImprove?: string[];
          expertInsight?: string;
          interviewTip?: string;
        };

        const out = {
          score: typeof raw.score === 'number' ? Math.min(100, Math.max(0, raw.score)) : 50,
          label: raw.label ?? 'Developing',
          whatWorked: Array.isArray(raw.whatWorked) ? raw.whatWorked.slice(0, 3) : [],
          toImprove: Array.isArray(raw.toImprove) ? raw.toImprove.slice(0, 3) : [],
          expertInsight: raw.expertInsight ?? '',
          interviewTip: raw.interviewTip ?? '',
        };
        return commitAndReturn(out);
      } catch {
        return commitAndReturn(buildHeuristicFeedback(input.category, input.answer));
      }
    } catch (e) {
      if (!spendFinalized) {
        await settleSpendFailure(ctx, e instanceof Error ? e.message : 'coach_evaluate_failed');
      }
      if (e instanceof BillingError) billingToTrpc(e);
      if (e instanceof TRPCError) throw e;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: e instanceof Error ? e.message : 'Coach evaluation failed',
      });
    }
  }),
});

function buildHeuristicFeedback(category: string, answer: string) {
  const t = answer.trim().toLowerCase();
  const words = t ? t.split(/\s+/).length : 0;
  const hasSituation = /\b(when|during|at my|in my previous|back in|in that role)\b/.test(t);
  const hasAction = /\b(i (did|led|built|created|implemented|decided|introduced|owned|designed|fixed))\b/.test(t);
  const hasResult = /\b(result|outcome|achiev|improv|reduc|increas|saved|delivered|launched|grew)\b/.test(t);
  const hasMetric = /\b\d+\s?(%|percent|users|clients|days|weeks|months|hours|k|m|million|thousand)?\b/.test(t);

  let score = 48;
  if (words >= 110) score += 16;
  else if (words >= 60) score += 8;
  else if (words < 20) score -= 18;
  if (hasSituation) score += 8;
  if (hasAction) score += 12;
  if (hasResult) score += 12;
  if (hasMetric) score += 8;
  score = Math.max(20, Math.min(100, Math.round(score)));

  const label = score >= 88 ? 'Excellent' : score >= 72 ? 'Good' : score >= 55 ? 'Developing' : 'Needs work';

  const INSIGHTS: Record<string, string> = {
    behavioural:
      'Strong behavioural answers do not just tell a story. They make personal ownership unmistakable and close with a result the interviewer can trust.',
    technical:
      'Technical answers become persuasive when they expose judgement: why this design, what trade-off was accepted, and what risk was deliberately managed.',
    motivation:
      'Motivation answers land better when they sound role-specific and earned, not aspirational by default. The interviewer needs a believable reason, not a polished slogan.',
    situational:
      'Situational answers are strongest when the reasoning chain is visible: what you would assess first, what you would prioritise, and how you would sequence action under constraint.',
  };

  return {
    score,
    label,
    whatWorked: [
      hasSituation ? 'Your answer sets some context — this gives the interviewer a situation to anchor to.' : '',
      hasAction ? 'Your wording shows some personal action — this makes your contribution easier to attribute.' : '',
      hasResult ? 'You point to an outcome — this helps the interviewer judge impact rather than effort alone.' : '',
    ].filter(Boolean).slice(0, 3),
    toImprove: [
      !hasSituation ? 'Open with one crisp context line so the interviewer knows what problem or moment you are describing.' : '',
      !hasAction ? 'Replace passive wording with direct ownership, for example: "I led...", "I decided...", or "I introduced...".' : '',
      !hasResult ? 'End with the outcome and why it mattered. Without that, the answer sounds unfinished.' : '',
      !hasMetric ? 'Add one concrete number, timeframe or scale marker so the impact feels credible rather than generic.' : '',
    ].filter(Boolean).slice(0, 3),
    expertInsight: INSIGHTS[category] ?? INSIGHTS.behavioural,
    interviewTip:
      'Before your next interview, rewrite this answer into four lines: context, responsibility, action, result. Then practise saying it out loud without filler phrasing.',
  };
}
