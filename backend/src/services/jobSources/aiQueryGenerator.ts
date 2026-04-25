import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getRoutingModel } from '../../lib/openai/model-registry.js';

interface ProfileInput {
  skills?: string[];
  experiences?: Array<{ jobTitle: string }>;
  targetRole?: string;
  currentJobTitle?: string | null;
  targetSeniority?: string | null;
  summary?: string | null;
  workValues?: string[];
  practiceAreas?: string[];
  blockedAreas?: string[];
}

function compact(value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueQueries(values: string[], count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
    if (out.length >= count) break;
  }
  return out;
}

function inferRoleFromSummary(summary: string | null | undefined): string | null {
  const text = compact(summary);
  if (!text) return null;

  const patterns = [
    /(?:want|wants|looking|seeking|targeting|interested)\s+(?:to\s+work\s+as\s+|as\s+|for\s+)?(?:an?\s+)?([a-z][a-z0-9 /+-]{2,80})/i,
    /(?:chc[eę]|szukam|celuj[eę]|interesuje mnie|chcialbym|chciałbym)\s+(?:pracowa[cć]\s+jako\s+|jako\s+|w\s+)?([a-ząćęłńóśźż0-9 /+-]{2,80})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1];
    if (!match) continue;
    return match
      .split(/[.,;\n]/)[0]
      .replace(/\b(remote|hybrid|full[- ]?time|part[- ]?time|zdalnie|hybrydowo)\b/gi, '')
      .trim() || null;
  }

  return null;
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
        profile.currentJobTitle ? `Current job title: ${profile.currentJobTitle}` : '',
        profile.targetSeniority ? `Target seniority: ${profile.targetSeniority}` : '',
        profile.experiences?.length
          ? `Recent job title: ${profile.experiences[0].jobTitle}`
          : '',
        profile.skills?.length
          ? `Skills: ${profile.skills.slice(0, 10).join(', ')}`
          : '',
        profile.summary ? `Profile summary / user intent: ${profile.summary.slice(0, 900)}` : '',
        profile.workValues?.length ? `Work values: ${profile.workValues.slice(0, 6).join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('. ');

      const response = await client.chat.completions.create({
        model: getRoutingModel(),
        messages: [
          {
            role: 'system',
            content:
              'You generate varied UK job search query strings. Return only a JSON array of short strings. Prefer the candidate target role and explicit user intent over old job history. Do not include explanations.',
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
        return uniqueQueries(parsed, count);
      }
    } catch (err) {
      console.error('[aiQueryGenerator] OpenAI error, using fallback query generation based on profile data:', err);
    }
  }

  return buildHeuristicQueries(profile, count);
}

function buildHeuristicQueries(profile: ProfileInput, count: number): string[] {
  const queries: string[] = [];
  const recentTitle = compact(profile.experiences?.[0]?.jobTitle);
  const inferredFromSummary = inferRoleFromSummary(profile.summary);
  const baseRole = compact(profile.targetRole) ?? compact(profile.currentJobTitle) ?? recentTitle ?? inferredFromSummary;

  if (baseRole) {
    queries.push(
      profile.targetSeniority ? `${baseRole} ${profile.targetSeniority}` : baseRole,
    );
  }

  for (const area of profile.practiceAreas?.slice(0, 2) ?? []) {
    queries.push(`${baseRole ?? recentTitle ?? 'jobs'} ${area}`.trim());
  }

  if (recentTitle && recentTitle.toLowerCase() !== baseRole?.toLowerCase()) {
    queries.push(recentTitle);
  }

  const skills = profile.skills ?? [];
  for (const skill of skills.slice(0, 4)) {
    queries.push(`${baseRole ?? recentTitle ?? 'developer'} ${skill}`);
  }

  if (profile.workValues?.some((value) => /remote|zdal/i.test(value)) && baseRole) {
    queries.push(`${baseRole} remote`);
  }

  if (queries.length === 0) {
    queries.push('software developer', 'software engineer', 'full stack developer');
  }

  return uniqueQueries(queries, count);
}
