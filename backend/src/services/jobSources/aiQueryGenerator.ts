import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getRoutingModel } from '../../lib/openai/model-registry.js';

interface ProfileInput {
  skills?: string[];
  experiences?: Array<{ jobTitle: string }>;
  targetRole?: string;
  targetSeniority?: string | null;
  workValues?: string[];
  practiceAreas?: string[];
  blockedAreas?: string[];
}

export async function generateJobQueries(
  profile: ProfileInput,
  count = 5,
): Promise<string[]> {
  const client = tryGetOpenAiClient();
  if (client) {
    try {
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
        model: getRoutingModel(),
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
      console.error('[aiQueryGenerator] OpenAI error, using fallback query generation based on profile data:', err);
    }
  }

  return buildHeuristicQueries(profile, count);
}

function buildHeuristicQueries(profile: ProfileInput, count: number): string[] {
  const queries: string[] = [];

  if (profile.targetRole) {
    queries.push(
      profile.targetSeniority ? `${profile.targetRole} (${profile.targetSeniority})` : profile.targetRole,
    );
  }

  for (const area of profile.practiceAreas?.slice(0, 2) ?? []) {
    if (queries.length >= count) break;
    queries.push(`${profile.targetRole ?? profile.experiences?.[0]?.jobTitle ?? 'jobs'} ${area}`.trim());
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
