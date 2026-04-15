import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import OpenAI from 'openai';
import { buildUniversalBehaviorLayer } from '../../prompts/shared/universal-behavior-layer.js';
import { getUserPlan, planToPromptBehaviorTier } from '../../services/billingGuard.js';

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function universalLayerForClerk(clerkId: string): Promise<string> {
  const plan = await getUserPlan(clerkId);
  return buildUniversalBehaviorLayer(planToPromptBehaviorTier(plan));
}

export const styleRouter = router({
  analyzeDocument: publicProcedure
    .input(z.object({
      userId: z.string(),
      text: z.string().max(5000),
      documentType: z.enum(['cv', 'cover_letter', 'skills', 'references']),
    }))
    .mutation(async ({ input }) => {
      const openai = getOpenAI();
      if (!openai) {
        // Heuristic fallback
        const words = input.text.split(/\s+/).length;
        const sentences = input.text.split(/[.!?]+/).filter(Boolean).length;
        return {
          wordCount: words,
          sentenceCount: sentences,
          avgSentenceLength: sentences > 0 ? Math.round(words / sentences) : 0,
          tone: { professional: 60, confident: 30, formal: 10 },
          topVerbs: ['managed', 'developed', 'led', 'created', 'improved'],
          suggestions: ['Add more quantified achievements', 'Use stronger action verbs', 'Tailor keywords to job descriptions'],
          score: 65,
        };
      }

      const prompt = `Analyse this ${input.documentType.replace('_', ' ')} and respond with JSON only:
{
  "wordCount": number,
  "sentenceCount": number,
  "avgSentenceLength": number,
  "tone": { "professional": 0-100, "confident": 0-100, "formal": 0-100 },
  "topVerbs": ["verb1", "verb2", "verb3", "verb4", "verb5"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "score": 0-100
}

Document text:
${input.text.slice(0, 3000)}`;

      const universalLayer = await universalLayerForClerk(input.userId);

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You analyse career documents (CV, cover letter, skills text, employer or character reference letters) and respond with JSON only.\n\n${universalLayer}`,
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 400,
        });
        const result = JSON.parse(resp.choices[0]?.message?.content ?? '{}');
        return result;
      } catch {
        return { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, tone: {}, topVerbs: [], suggestions: ['Analysis unavailable'], score: 0 };
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
      const openai = getOpenAI();
      if (!openai) return { rewritten: input.text, changes: 'OpenAI not configured' };

      const universalLayer = await universalLayerForClerk(input.userId);

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
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

  suggestCoursesForSkill: publicProcedure
    .input(z.object({
      skill: z.string().max(100),
    }))
    .mutation(async ({ input }) => {
      const openai = getOpenAI();
      if (!openai) {
        // Static fallback
        return {
          courses: [
            { title: `${input.skill} Fundamentals`, provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/', level: 'Beginner' },
            { title: `${input.skill} in Practice`, provider: 'Coursera', url: 'https://www.coursera.org/', level: 'Intermediate' },
            { title: `Advanced ${input.skill}`, provider: 'Udemy', url: 'https://www.udemy.com/', level: 'Advanced' },
          ],
        };
      }

      const universalLayer = buildUniversalBehaviorLayer('standard');

      const prompt = `Suggest 3 online courses for someone wanting to improve their "${input.skill}" skill. Return JSON only:
{
  "courses": [
    { "title": "Course name", "provider": "Provider name", "url": "https://...", "level": "Beginner|Intermediate|Advanced" }
  ]
}
Use real, current courses from Coursera, Udemy, LinkedIn Learning, Pluralsight, freeCodeCamp, or official docs. Always include the actual course URL.`;

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You recommend real, current online courses. Return JSON only.\n\n${universalLayer}`,
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        });
        const result = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as { courses?: { title: string; provider: string; url: string; level: string }[] };
        return { courses: result.courses ?? [] };
      } catch {
        return { courses: [] };
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
      const openai = getOpenAI();

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
          text: `Dear Hiring Team,\n\nI am writing to apply for the **${input.jobTitle}** position${input.company ? ` at **${input.company}**` : ''}. With my background in **${skillList || 'relevant technologies'}**, I am confident in my ability to contribute effectively to your team.\n\nI look forward to discussing this opportunity further.\n\nYours sincerely,\n${input.senderName ?? ''}`,
        };
      }

      const universalLayer = await universalLayerForClerk(input.userId);
      const senderDisplayName = input.senderName?.trim() || 'the candidate';

      const baseSystem = input.type === 'cv'
        ? `You are an expert UK CV writer. Generate a professional, tailored CV summary and skills section (no template headings, pure prose sections ready to paste). Tailor it specifically to the job description provided. Use British English.`
        : `You are an expert UK cover letter writer. Write a concise, compelling cover letter (3 short paragraphs, ready to send).
Rules:
- Do NOT include any placeholders like [Your Address], [City], [Postcode], [Date], [Company Address], [Hiring Manager Name], or any square-bracket tokens
- Start the letter body directly with the opening paragraph (e.g. "Dear Hiring Team," then the first paragraph)
- Bold (**text**) the 2–3 most important keywords or achievements in each paragraph so they stand out
- End the letter with: "Yours sincerely,\\n${senderDisplayName}"
- Use British English throughout
- Output only the letter body — no preamble, no explanations`;

      const systemPrompt = `${baseSystem}\n\n${universalLayer}`;

      const userPrompt = input.type === 'cv'
        ? `Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}\nJob description: ${input.jobDescription ?? 'Not provided'}\n\nCandidate profile:\n${profileContext}\n\nWrite a tailored CV professional summary section and highlight the most relevant skills.`
        : `Job: ${input.jobTitle}${input.company ? ` at ${input.company}` : ''}\nJob description: ${input.jobDescription ?? 'Not provided'}\n\nCandidate profile:\n${profileContext}\nApplicant name: ${senderDisplayName}\n\nWrite a compelling cover letter addressed to the hiring team at ${input.company ?? 'the company'}.`;

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
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
