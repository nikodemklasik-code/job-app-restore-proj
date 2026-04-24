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

function cleanText(value?: string | null): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function extractJobSignals(jobDescription?: string): string[] {
  const description = cleanText(jobDescription);
  const keywords = description.match(/\b(?:react|typescript|javascript|node(?:\.js)?|python|java|aws|azure|gcp|sql|postgres(?:ql)?|docker|kubernetes|figma|product management|stakeholder management|project management|data analysis|communication|leadership|testing|automation|ci\/cd|rest api|graphql)\b/gi) ?? [];
  const bullets = description
    .split(/(?:\u2022|•|\n|- )/)
    .map((chunk) => cleanText(chunk))
    .filter((chunk) => chunk.length >= 12 && chunk.length <= 120)
    .filter((chunk) => /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding)/i.test(chunk));
  return uniqueStrings([...keywords, ...bullets]).slice(0, 10);
}

function buildFallbackCvText(input: {
  jobTitle: string;
  company?: string;
  profileSummary?: string;
  skills?: string[];
  jobDescription?: string;
}): string {
  const roleLine = `${input.jobTitle}${input.company ? ` at ${input.company}` : ''}`;
  const skills = uniqueStrings(input.skills ?? []).slice(0, 8);
  const jobSignals = extractJobSignals(input.jobDescription);
  const matched = skills.filter((skill) => jobSignals.some((signal) => signal.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(signal.toLowerCase()))).slice(0, 5);
  const summary = cleanText(input.profileSummary);

  const paragraphOne = matched.length > 0
    ? `Profile aligned to ${roleLine}, with relevant strength across ${matched.join(', ')}.`
    : `Profile aligned to ${roleLine}, with a practical foundation in ${skills.slice(0, 4).join(', ') || 'relevant cross-functional delivery'}.`;
  const paragraphTwo = summary
    ? `${summary.replace(/\.$/, '')}.`
    : `Brings clear communication, organised execution and role-relevant problem solving, with emphasis on the strongest overlaps with the target brief.`;
  const paragraphThree = jobSignals[0]
    ? `Priority fit areas include ${jobSignals.slice(0, 3).join(', ')}.`
    : `Tailored towards the priorities implied by the target job description.`;

  return `${paragraphOne}\n\n${paragraphTwo}\n\nCore strengths: ${skills.join(', ') || 'Relevant transferable skills'}.\n\n${paragraphThree}`;
}

function buildFallbackCoverLetterText(input: {
  jobTitle: string;
  company?: string;
  profileSummary?: string;
  skills?: string[];
  senderName?: string;
  jobDescription?: string;
}): string {
  const roleLine = `${input.jobTitle}${input.company ? ` at ${input.company}` : ''}`;
  const skills = uniqueStrings(input.skills ?? []).slice(0, 8);
  const jobSignals = extractJobSignals(input.jobDescription);
  const matched = skills.filter((skill) => jobSignals.some((signal) => signal.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(signal.toLowerCase()))).slice(0, 4);
  const summary = cleanText(input.profileSummary);

  const p1 = matched.length > 0
    ? `The ${roleLine} opportunity is a strong match for my background, particularly in ${matched.join(', ')}.`
    : `The ${roleLine} opportunity is a strong match for my background and the way I approach delivery, communication and problem solving.`;
  const p2 = summary
    ? `My background includes ${summary.charAt(0).toLowerCase() + summary.slice(1).replace(/\.$/, '')}, and I would bring that same practical focus to the role.`
    : `My experience has given me a solid base in ${skills.slice(0, 4).join(', ') || 'relevant role-based work'}, and I would bring that same practical focus to the role.`;
  const p3 = jobSignals[0]
    ? `I would welcome the chance to discuss how I could contribute to your priorities around ${jobSignals[0].replace(/\.$/, '')}.\n\nYours sincerely,\n${input.senderName ?? 'Applicant'}`
    : `I would welcome the chance to discuss how I could contribute to the role.\n\nYours sincerely,\n${input.senderName ?? 'Applicant'}`;

  return `${p1}\n\n${p2}\n\n${p3}`;
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

      const skillList = uniqueStrings(input.skills ?? []).slice(0, 15);
      const jobSignals = extractJobSignals(input.jobDescription);
      const matchedSkills = skillList.filter((skill) => jobSignals.some((signal) => signal.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(signal.toLowerCase()))).slice(0, 8);
      const profileContext = [
        input.profileSummary ? `Professional summary: ${cleanText(input.profileSummary)}` : '',
        skillList.length > 0 ? `Key skills: ${skillList.join(', ')}` : '',
        matchedSkills.length > 0 ? `Strong role overlaps: ${matchedSkills.join(', ')}` : '',
        jobSignals.length > 0 ? `Priority job signals: ${jobSignals.join(' | ')}` : '',
      ].filter(Boolean).join('\n');

      if (!openai) {
        return {
          text: input.type === 'cv'
            ? buildFallbackCvText(input)
            : buildFallbackCoverLetterText(input),
        };
      }

      const universalLayer = await universalLayerForClerk(input.userId);

      const baseSystem = input.type === 'cv'
        ? `You are an expert UK CV writer. Produce targeted CV copy that is ready to paste into a CV. Focus on precision, relevance and credibility.`
        : `You are an expert UK cover letter writer. Produce a concise, credible cover letter that sounds tailored and commercially aware.`;

      const systemPrompt = `${baseSystem}

${universalLayer}

Hard rules:
- British English only.
- No placeholders.
- No fabricated metrics, employers, certifications or years of experience.
- No generic filler such as "results-driven professional", "dynamic team", "excited to apply" unless directly justified.
- Emphasise the strongest overlap between profile and role.
- Keep tone sharp, modern and believable.`;

      const userPrompt = input.type === 'cv'
        ? `Create tailored CV copy for this role.

Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}
Job description: ${cleanText(input.jobDescription).slice(0, 2000) || 'Not provided'}
Candidate profile:
${profileContext || 'No candidate profile context provided'}

Return valid JSON only in this shape:
{
  "summary": "2-3 sentence professional summary, 70-110 words",
  "highlightSkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "evidenceBullets": ["bullet 1", "bullet 2", "bullet 3"]
}

Rules for bullets:
- one line each
- action + capability + outcome style
- do not invent numbers or achievements`
        : `Create a tailored cover letter for this role.

Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}
Job description: ${cleanText(input.jobDescription).slice(0, 2000) || 'Not provided'}
Candidate profile:
${profileContext || 'No candidate profile context provided'}
Applicant name: ${input.senderName ?? 'Applicant'}

Return valid JSON only in this shape:
{
  "opening": "paragraph 1",
  "body": "paragraph 2",
  "closing": "paragraph 3 before sign-off",
  "signoff": "Yours sincerely,\\nName"
}

Rules:
- 3 compact paragraphs total
- under 260 words total
- specific, restrained, credible
- no clichés or empty enthusiasm`;

      try {
        const resp = await openai.chat.completions.create({
          model: getDefaultTextModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.35,
          max_tokens: 900,
        });
        const raw = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as {
          summary?: string;
          highlightSkills?: string[];
          evidenceBullets?: string[];
          opening?: string;
          body?: string;
          closing?: string;
          signoff?: string;
        };

        if (input.type === 'cv') {
          const text = [
            cleanText(raw.summary),
            raw.highlightSkills && raw.highlightSkills.length > 0
              ? `Core strengths: ${uniqueStrings(raw.highlightSkills).slice(0, 6).join(', ')}.`
              : '',
            raw.evidenceBullets && raw.evidenceBullets.length > 0
              ? uniqueStrings(raw.evidenceBullets).slice(0, 3).map((bullet) => `• ${bullet}`).join('\n')
              : '',
          ].filter(Boolean).join('\n\n');
          return { text: text || buildFallbackCvText(input) };
        }

        const coverLetter = [
          cleanText(raw.opening),
          cleanText(raw.body),
          cleanText(raw.closing),
          cleanText(raw.signoff) || `Yours sincerely,\n${input.senderName ?? 'Applicant'}`,
        ].filter(Boolean).join('\n\n');
        return { text: coverLetter || buildFallbackCoverLetterText(input) };
      } catch {
        return {
          text: input.type === 'cv'
            ? buildFallbackCvText(input)
            : buildFallbackCoverLetterText(input),
        };
      }
    }),
});
