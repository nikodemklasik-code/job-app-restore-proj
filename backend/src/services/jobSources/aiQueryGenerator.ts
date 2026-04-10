import OpenAI from 'openai';

interface ProfileInput {
  skills?: string[];
  experiences?: Array<{ jobTitle: string }>;
  targetRole?: string;
}

export async function generateJobQueries(
  profile: ProfileInput,
  count = 5,
): Promise<string[]> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const profileSummary = [
        profile.targetRole ? `Target role: ${profile.targetRole}` : '',
        profile.experiences?.length
          ? `Recent job title: ${profile.experiences[0].jobTitle}`
          : '',
        profile.skills?.length
          ? `Skills: ${profile.skills.slice(0, 10).join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('. ');

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You generate varied job search query strings. Return only a JSON array of strings, no explanation.',
          },
          {
            role: 'user',
            content: `Generate ${count} varied job search queries for a candidate with this profile: ${profileSummary}. Return as JSON array of short query strings.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content ?? '[]';
      const parsed = JSON.parse(content) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, count);
      }
    } catch (err) {
      console.error('[aiQueryGenerator] OpenAI error, falling back to heuristic:', err);
    }
  }

  return buildHeuristicQueries(profile, count);
}

function buildHeuristicQueries(profile: ProfileInput, count: number): string[] {
  const queries: string[] = [];

  if (profile.targetRole) {
    queries.push(profile.targetRole);
  }

  const recentTitle = profile.experiences?.[0]?.jobTitle;
  if (recentTitle) {
    queries.push(recentTitle);
  }

  const skills = profile.skills ?? [];
  for (const skill of skills.slice(0, 3)) {
    if (queries.length >= count) break;
    queries.push(`${recentTitle ?? profile.targetRole ?? 'developer'} ${skill}`);
  }

  if (queries.length === 0) {
    queries.push('software developer', 'software engineer', 'full stack developer');
  }

  return queries.slice(0, count);
}
