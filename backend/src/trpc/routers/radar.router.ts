import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications, profiles, skills, experiences } from '../../db/schema.js';
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
  userHasSkill: boolean;           // ← NEW: does user already have this skill?
  userSkillLevel?: number;         // ← NEW: 1-10 if they have it
  gapPriority: 'none' | 'nice' | 'important' | 'critical';  // ← NEW
  courses: Array<{ title: string; provider: string; url: string; level: string }>;
}

export interface RadarResult {
  sector: string;
  generatedAt: string;
  skills: RadarSkill[];
  summary: string;
  userProfile: {                   // ← NEW: profile context shown in UI
    totalSkills: number;
    topSkills: string[];
    currentRole: string | null;
    previousRoles: string[];
    coverageScore: number;         // % of trending skills user already has
  };
}

export const radarRouter = router({
  generate: protectedProcedure
    .input(z.object({ sector: z.string().max(100).optional() }))
    .mutation(async ({ ctx, input }): Promise<RadarResult> => {
      const userId = ctx.user.id;

      // ── 1. Load user profile ──────────────────────────────────────────────
      const profileRow = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      const profile = profileRow[0] ?? null;
      const profileId = profile?.id ?? null;

      // ── 2. Load skills matrix ─────────────────────────────────────────────
      const userSkills = profileId
        ? await db
            .select({ name: skills.name, level: skills.level })
            .from(skills)
            .where(eq(skills.profileId, profileId))
        : [];

      const skillNames = userSkills.map((s) => s.name);
      const skillMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level ?? 5]));

      // ── 3. Load employment matrix (experience history) ────────────────────
      const userExperiences = profileId
        ? await db
            .select({
              jobTitle: experiences.jobTitle,
              employerName: experiences.employerName,
              startDate: experiences.startDate,
              endDate: experiences.endDate,
              description: experiences.description,
            })
            .from(experiences)
            .where(eq(experiences.profileId, profileId))
            .orderBy(desc(experiences.startDate))
        : [];

      const currentRole = userExperiences.find((e) => !e.endDate || e.endDate === '' || e.endDate === 'present')?.jobTitle ?? null;
      const previousRoles = userExperiences
        .filter((e) => e.endDate && e.endDate !== '' && e.endDate !== 'present')
        .map((e) => e.jobTitle)
        .slice(0, 5);

      // ── 4. Load recent applications (for sector inference) ────────────────
      const recentApps = await db
        .select({ jobTitle: applications.jobTitle, company: applications.company })
        .from(applications)
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.createdAt))
        .limit(20);

      const appJobTitles = recentApps.map((a) => a.jobTitle).filter(Boolean).slice(0, 10);

      // ── 5. Build sector context for prompt ────────────────────────────────
      const employmentSummary = userExperiences.length > 0
        ? userExperiences.slice(0, 5).map((e) => {
            const period = e.endDate && e.endDate !== '' && e.endDate !== 'present'
              ? `${e.startDate}–${e.endDate}`
              : `${e.startDate}–present`;
            return `${e.jobTitle} at ${e.employerName} (${period})`;
          }).join('; ')
        : null;

      const sectorHint = input.sector
        ?? (currentRole ? `current role: ${currentRole}` : null)
        ?? (appJobTitles.length > 0 ? `recently applied for: ${appJobTitles.slice(0, 5).join(', ')}` : null)
        ?? 'general professional roles';

      const skillsContext = skillNames.length > 0
        ? `User's current skills (from their skills matrix): ${skillNames.join(', ')}.`
        : 'User has not added skills to their profile yet.';

      const employmentContext = employmentSummary
        ? `User's employment history: ${employmentSummary}.`
        : 'No employment history available.';

      const profileSummaryContext = profile?.summary
        ? `User's career summary: ${profile.summary}`
        : '';

      // ── 6. GPT prompt ─────────────────────────────────────────────────────
      const openai = getOpenAI();
      const prompt = `You are a labour-market intelligence analyst with access to real-time hiring data.

CANDIDATE CONTEXT:
- Sector/role focus: ${sectorHint}
- ${skillsContext}
- ${employmentContext}
${profileSummaryContext ? `- ${profileSummaryContext}` : ''}

TASK: Predict which skills will be most in demand in this candidate's sector over the next 6–12 months.

For each skill, check if the candidate ALREADY HAS it (based on their skills matrix above).

Return a JSON object with this exact structure (no markdown, pure JSON):
{
  "sector": "<inferred sector name, e.g. 'Frontend Engineering' or 'Product Management'>",
  "summary": "<2-3 sentence plain-language market outlook for this sector, mentioning the candidate's current position in the market>",
  "skills": [
    {
      "skill": "<skill name>",
      "trend": "<rising|hot|emerging>",
      "reason": "<2-3 sentences: why this skill is trending AND specifically how it relates to this candidate's background>",
      "timeframe": "<e.g. 'Critical now' or 'Rising fast — 3 months' or 'Emerging — 9 months'>",
      "userHasSkill": <true if this skill appears in the user's skills list above, otherwise false>,
      "userSkillLevel": <null if they don't have it, otherwise a number 1-10 estimating their level based on context>,
      "gapPriority": "<none if user has it at good level, nice if minor gap, important if significant gap, critical if must-have and missing>",
      "courses": [
        { "title": "<course title>", "provider": "<Coursera|LinkedIn Learning|Udemy|Google|AWS|Microsoft|edX|freeCodeCamp>", "url": "<https://...>", "level": "<Beginner|Intermediate|Advanced>" }
      ]
    }
  ]
}

Rules:
- Return exactly 7 skills (mix of skills the user HAS and skills they're MISSING).
- Include at least 3 skills the user does NOT have (to show gaps).
- Include at least 2 skills the user DOES have (to show what to keep developing).
- Each skill has exactly 2 course suggestions with real, working URLs.
- trend must be exactly: "rising", "hot", or "emerging".
- gapPriority must be exactly: "none", "nice", "important", or "critical".
- userHasSkill must be a boolean true or false.
- Courses for skills the user already has should be intermediate/advanced level.
- Courses for missing skills should include at least one beginner option.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2400,
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      let parsed: { sector?: string; summary?: string; skills?: RadarSkill[] };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = {};
      }

      const resultSkills: RadarSkill[] = (parsed.skills ?? []).map((s) => ({
        ...s,
        userHasSkill: s.userHasSkill ?? skillMap.has(s.skill?.toLowerCase() ?? ''),
        userSkillLevel: s.userSkillLevel ?? (skillMap.get(s.skill?.toLowerCase() ?? '') ?? undefined),
        gapPriority: s.gapPriority ?? 'nice',
      }));

      // Coverage score: % of trending skills user already has
      const coverageScore = resultSkills.length > 0
        ? Math.round((resultSkills.filter((s) => s.userHasSkill).length / resultSkills.length) * 100)
        : 0;

      return {
        sector: parsed.sector ?? 'Your sector',
        generatedAt: new Date().toISOString(),
        skills: resultSkills,
        summary: parsed.summary ?? '',
        userProfile: {
          totalSkills: skillNames.length,
          topSkills: skillNames.slice(0, 6),
          currentRole,
          previousRoles,
          coverageScore,
        },
      };
    }),
});
