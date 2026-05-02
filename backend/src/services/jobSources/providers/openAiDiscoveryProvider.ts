import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

/**
 * OpenAI Discovery Provider
 *
 * Uses GPT to generate realistic, plausible job listings that match the user's
 * query and location when real providers return no results. This is a fallback
 * of last resort — AI-generated listings are clearly tagged with source='openai-discovery'
 * and do NOT have real apply URLs.
 */

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

interface GeneratedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workMode: 'remote' | 'hybrid' | 'on-site' | null;
  requirements: string[];
}

async function generateJobsWithOpenAI(
  query: string,
  location: string,
  limit: number,
): Promise<GeneratedJob[]> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  if (!key) return [];

  const prompt = `Generate ${Math.min(limit, 8)} realistic job listings for the following search:
Query: "${query}"
Location: "${location || 'United Kingdom'}"

Return a JSON array. Each job must have:
- title: string (exact job title)
- company: string (realistic UK company name)
- location: string (specific city/town in or near "${location || 'United Kingdom'}")
- description: string (2-3 sentences describing the role)
- salaryMin: number | null (annual salary in GBP, or null)
- salaryMax: number | null (annual salary in GBP, or null)
- workMode: "remote" | "hybrid" | "on-site" | null
- requirements: string[] (3-5 key requirements, each under 100 chars)

Use realistic UK salaries. Mix companies of different sizes. Return only valid JSON array, no markdown.`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      console.error('[OpenAiDiscoveryProvider] API error:', res.status);
      return [];
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';

    // Strip markdown fences if present
    const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(jsonStr) as GeneratedJob[];

    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, limit);
  } catch (err) {
    console.error('[OpenAiDiscoveryProvider] Failed to generate jobs:', err);
    return [];
  }
}

export class OpenAiDiscoveryProvider implements JobSourceProvider {
  name = 'openai-discovery';
  label = 'AI Discovery';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (!process.env.OPENAI_API_KEY) {
      return { ready: false, reason: 'OPENAI_API_KEY not set' };
    }
    return { ready: true };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    if (!process.env.OPENAI_API_KEY) return [];
    if (!input.query?.trim()) return [];

    const generated = await generateJobsWithOpenAI(
      input.query,
      input.location ?? 'United Kingdom',
      input.limit ?? 10,
    );

    return generated.map((job): SourceJob => ({
      externalId: randomUUID(),
      source: 'openai-discovery',
      title: norm(job.title),
      company: norm(job.company),
      location: norm(job.location),
      description: norm(job.description),
      applyUrl: '',
      salaryMin: typeof job.salaryMin === 'number' ? job.salaryMin : null,
      salaryMax: typeof job.salaryMax === 'number' ? job.salaryMax : null,
      workMode: job.workMode ?? null,
      requirements: Array.isArray(job.requirements) ? job.requirements.map(norm).filter(Boolean) : [],
      postedAt: new Date().toISOString(),
    }));
  }
}
