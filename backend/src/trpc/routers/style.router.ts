import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { buildUniversalBehaviorLayer } from '../../prompts/shared/universal-behavior-layer.js';
import { getUserPlan, planToPromptBehaviorTier } from '../../services/billingGuard.js';
import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../../lib/openai/model-registry.js';
import { BillingError } from '../../services/creditsBilling.js';
import { FEATURE_COSTS } from '../../services/creditsConfig.js';
import {
  analyzeCareerDocumentText,
  suggestCoursesForSkillText,
  type AnalyzeDocumentResult,
} from '../../services/styleDocumentAnalysis.service.js';
import {
  billingToTrpc,
  requireSpendApproval,
  settleSpendFailure,
  settleSpendSuccess,
} from './_shared.js';

async function universalLayerForClerk(clerkId: string): Promise<string> {
  const plan = await getUserPlan(clerkId);
  return buildUniversalBehaviorLayer(planToPromptBehaviorTier(plan));
}

const STYLE_ANALYZE_DEBIT =
  FEATURE_COSTS.style_analyze_document.kind === 'estimated'
    ? FEATURE_COSTS.style_analyze_document.maxCost
    : FEATURE_COSTS.style_analyze_document.cost;

const SKILL_LAB_COURSE_DEBIT =
  FEATURE_COSTS.skill_lab_course_suggest.kind === 'estimated'
    ? FEATURE_COSTS.skill_lab_course_suggest.maxCost
    : FEATURE_COSTS.skill_lab_course_suggest.cost;

export const styleRouter = router({
  analyzeDocument: protectedProcedure
    .use(requireSpendApproval('style_analyze_document'))
    .input(
      z.object({
        text: z.string().max(5000),
        documentType: z.enum(['cv', 'cover_letter', 'skills', 'references']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }
      let spendFinalized = false;
      const commitAndReturn = async (out: AnalyzeDocumentResult) => {
        try {
          await settleSpendSuccess(ctx, STYLE_ANALYZE_DEBIT, 'style.analyzeDocument');
          spendFinalized = true;
        } catch (e) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'commit_failed');
          spendFinalized = true;
          if (e instanceof BillingError) billingToTrpc(e);
          throw e;
        }
        return out;
      };

      try {
        const result: AnalyzeDocumentResult = await analyzeCareerDocumentText({
          clerkId: user.clerkId,
          text: input.text,
          documentType: input.documentType,
        });
        return commitAndReturn(result);
      } catch (e) {
        if (!spendFinalized) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'style_analyze_failed');
        }
        if (e instanceof BillingError) billingToTrpc(e);
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e instanceof Error ? e.message : 'Document analysis failed',
        });
      }
    }),

  rewriteSection: publicProcedure
    .input(z.object({
      userId: z.string(),
      text: z.string().max(2000),
      instruction: z.string().max(200),
      tone: z.enum(['professional', 'confident', 'concise', 'creative']).default('professional'),
    }))
    .mutation(async ({ input }) => {
      const openai = tryGetOpenAiClient();
      if (!openai) return { rewritten: input.text, changes: 'OpenAI not configured' };

      const universalLayer = await universalLayerForClerk(input.userId);

      try {
        const resp = await openai.chat.completions.create({
          model: getDefaultTextModel(),
          messages: [{
            role: 'system',
            content: `You are a UK career document specialist. Rewrite the given text to be more ${input.tone}. Keep it concise and impactful. Return only the rewritten text, no explanations.\n\n${universalLayer}`,
          }, {
            role: 'user',
            content: `Instruction: ${input.instruction}\n\nText to rewrite:\n${input.text}`,
          }],
          max_tokens: 500,
        });
        const rewritten = resp.choices[0]?.message?.content ?? input.text;
        return { rewritten, changes: 'AI rewrite applied' };
      } catch {
        return { rewritten: input.text, changes: 'Rewrite failed' };
      }
    }),

  suggestCoursesForSkill: protectedProcedure
    .use(requireSpendApproval('skill_lab_course_suggest'))
    .input(
      z.object({
        skill: z.string().max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let spendFinalized = false;
      const commitAndReturn = async (out: { courses: { title: string; provider: string; url: string; level: string }[] }) => {
        try {
          await settleSpendSuccess(ctx, SKILL_LAB_COURSE_DEBIT, 'style.suggestCoursesForSkill');
          spendFinalized = true;
        } catch (e) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'commit_failed');
          spendFinalized = true;
          if (e instanceof BillingError) billingToTrpc(e);
          throw e;
        }
        return out;
      };

      try {
        const result = await suggestCoursesForSkillText(input.skill);
        return commitAndReturn(result);
      } catch (e) {
        if (!spendFinalized) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'skill_lab_course_suggest_failed');
        }
        if (e instanceof BillingError) billingToTrpc(e);
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e instanceof Error ? e.message : 'Course suggestion failed',
        });
      }
    }),

  generateFromJob: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['cv', 'coverletter']),
      jobTitle: z.string().max(200),
      jobDescription: z.string().max(4000).optional(),
      company: z.string().max(200).optional(),
      profileSummary: z.string().max(2000).optional(),
      skills: z.array(z.string()).optional(),
      senderName: z.string().max(200).optional(),
    }))
    .mutation(async ({ input }) => {
      const openai = tryGetOpenAiClient();

      const skillList = (input.skills ?? []).slice(0, 15).join(', ');
      const profileContext = [
        input.profileSummary ? `Professional summary: ${input.profileSummary}` : '',
        skillList ? `Key skills: ${skillList}` : '',
      ].filter(Boolean).join('\n');

      if (!openai) {
        // Heuristic fallback
        if (input.type === 'cv') {
          return {
            text: `PROFESSIONAL SUMMARY\n${input.profileSummary ?? 'Experienced professional seeking new challenges.'}\n\nKEY SKILLS\n${skillList}\n\nTailored for: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}\n`,
          };
        }
        return {
          text: `Dear Hiring Team,\n\nI am writing to apply for the ${input.jobTitle} position${input.company ? ` at ${input.company}` : ''}. With my background in ${skillList || 'relevant technologies'}, I am confident in my ability to contribute effectively.\n\nI look forward to discussing this opportunity further.\n\nYours sincerely,\n${input.senderName ?? 'Applicant'}`,
        };
      }

      const universalLayer = await universalLayerForClerk(input.userId);

      const baseSystem = input.type === 'cv'
        ? `You are an expert UK CV writer. Generate a professional, tailored CV summary and skills section (no template headings, pure prose sections ready to paste). Tailor it specifically to the job description provided. Use British English.`
        : `You are an expert UK cover letter writer. Write a concise, compelling cover letter (3 paragraphs, no placeholders, ready to send). Match the tone to the company and role. Use British English.`;

      const systemPrompt = `${baseSystem}\n\n${universalLayer}`;

      const userPrompt = input.type === 'cv'
        ? `Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}\nJob description: ${input.jobDescription ?? 'Not provided'}\n\nCandidate profile:\n${profileContext}\n\nWrite a tailored CV professional summary section and highlight the most relevant skills.`
        : `Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}\nJob description: ${input.jobDescription ?? 'Not provided'}\n\nCandidate profile:\n${profileContext}\nApplicant name: ${input.senderName ?? 'Applicant'}\n\nWrite a compelling cover letter.`;

      try {
        const resp = await openai.chat.completions.create({
          model: getDefaultTextModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 800,
        });
        const text = resp.choices[0]?.message?.content ?? '';
        return { text };
      } catch {
        return { text: '' };
      }
    }),
});
