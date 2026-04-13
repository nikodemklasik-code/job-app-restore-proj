import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications } from '../../db/schema.js';
import OpenAI from 'openai';

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface RadarSkill {
  skill: string;
  trend: 'rising' | 'hot' | 'emerging';
  reason: string;
  timeframe: string;
  courses: Array<{ title: string; provider: string; url: string; level: string }>;
}

export interface RadarResult {
  sector: string;
  generatedAt: string;
  skills: RadarSkill[];
  summary: string;
}

export const radarRouter = router({
  generate: protectedProcedure
    .input(z.object({ sector: z.string().max(100).optional() }))
    .mutation(async ({ ctx, input }): Promise<RadarResult> => {
      const userId = ctx.user.id;

      // Gather recent application job titles to infer sector
      const recentApps = await db
        .select({ jobTitle: applications.jobTitle, company: applications.company })
        .from(applications)
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.createdAt))
        .limit(30);

      const jobTitles = recentApps.map((a) => a.jobTitle).filter(Boolean).slice(0, 20);
      const sectorHint = input.sector ?? (jobTitles.length > 0 ? `roles including: ${jobTitles.slice(0, 8).join(', ')}` : 'general professional roles');

      const openai = getOpenAI();
      const prompt = `You are a labour-market intelligence analyst. Based on the candidate's job search history (${sectorHint}), predict which skills will be most in demand in their sector over the next 6–12 months.

Return a JSON object with this exact structure (no markdown, pure JSON):
{
  "sector": "<inferred sector name>",
  "summary": "<2-sentence plain-language summary of the outlook>",
  "skills": [
    {
      "skill": "<skill name>",
      "trend": "<rising|hot|emerging>",
      "reason": "<1-2 sentences why this skill is trending>",
      "timeframe": "<e.g. 'Hot now' or 'Rising in 6 months' or 'Emerging in 12 months'>",
      "courses": [
        { "title": "<course title>", "provider": "<Coursera|LinkedIn Learning|Udemy|Google|AWS|Microsoft|edX|freeCodeCamp>", "url": "<https://...>", "level": "<Beginner|Intermediate|Advanced>" }
      ]
    }
  ]
}

Rules:
- Return exactly 5 skills.
- Each skill has exactly 2 course suggestions with real URLs from established providers.
- Do not invent company names or fake course URLs — use real known course URLs or approximate them.
- trend values must be exactly: "rising", "hot", or "emerging".
- Never mention the candidate's name or profile — only skills and market context.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      let parsed: { sector?: string; summary?: string; skills?: RadarSkill[] };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = {};
      }

      return {
        sector: parsed.sector ?? 'Your sector',
        generatedAt: new Date().toISOString(),
        skills: parsed.skills ?? [],
        summary: parsed.summary ?? '',
      };
    }),
});
