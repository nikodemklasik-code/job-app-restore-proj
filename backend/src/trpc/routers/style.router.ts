import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import OpenAI from 'openai';

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const styleRouter = router({
  analyzeDocument: publicProcedure
    .input(z.object({
      userId: z.string(),
      text: z.string().max(5000),
      documentType: z.enum(['cv', 'cover_letter', 'skills']),
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

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
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

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are a UK career document specialist. Rewrite the given text to be more ${input.tone}. Keep it concise and impactful. Return only the rewritten text, no explanations.`,
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
});
