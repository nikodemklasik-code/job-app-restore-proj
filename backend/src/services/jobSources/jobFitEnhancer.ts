/**
 * Advanced job fit scoring using AI when available.
 * Falls back to heuristic scoring if OpenAI is not configured.
 */

import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../../lib/openai/model-registry.js';
import type { SourceJob } from './types.js';

interface ProfileForScoring {
  skills: string[];
  summary?: string;
  targetRole?: string;
  targetSeniority?: string;
  experiences?: Array<{ jobTitle: string }>;
}

/**
 * Use AI to score job fit if OpenAI is available.
 * Returns enhanced fitScore with reasoning.
 */
export async function enhanceJobFitWithAI(
  profile: ProfileForScoring,
  job: SourceJob,
): Promise<{ fitScore: number; aiReasoning?: string }> {
  const client = tryGetOpenAiClient();
  if (!client) {
    // No AI available — return current score
    return { fitScore: job.fitScore ?? 50 };
  }

  try {
    const prompt = `Analyse job fit on a scale 0-100. Return JSON only.

Job:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${(job.description ?? '').slice(0, 600)}
- Requirements: ${(job.requirements ?? []).slice(0, 5).join(', ') || 'Not specified'}
- Salary: ${job.salaryMin ? `£${job.salaryMin.toLocaleString()}-£${job.salaryMax?.toLocaleString() ?? 'negotiable'}` : 'Not specified'}
- Work mode: ${job.workMode ?? 'Not specified'}

Candidate:
- Target role: ${profile.targetRole ?? 'Not specified'}
- Seniority: ${profile.targetSeniority ?? 'Not specified'}
- Skills: ${profile.skills.slice(0, 10).join(', ') || 'Not specified'}
- Summary: ${(profile.summary ?? '').slice(0, 300) || 'Not specified'}
- Recent roles: ${profile.experiences?.slice(0, 3).map((e) => e.jobTitle).join(', ') || 'Not specified'}

Return: { "score": 0-100, "reasoning": "1-2 sentences on fit" }
Consider: skill overlap, role alignment, seniority match, salary expectations, work mode preference.`;

    const response = await client.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}') as {
      score?: number;
      reasoning?: string;
    };

    const aiScore = typeof result.score === 'number' ? Math.min(99, Math.max(10, result.score)) : job.fitScore ?? 50;
    return {
      fitScore: Math.max(job.fitScore ?? 0, aiScore),
      aiReasoning: result.reasoning,
    };
  } catch (err) {
    console.error('[jobFitEnhancer] AI scoring failed:', err);
    return { fitScore: job.fitScore ?? 50 };
  }
}

/**
 * Batch enhance multiple jobs with AI scoring.
 * Limits to 5 jobs per batch to avoid rate limits.
 */
export async function enhanceJobsWithAI(
  profile: ProfileForScoring,
  jobs: SourceJob[],
  maxJobs = 5,
): Promise<SourceJob[]> {
  const topJobs = jobs.slice(0, maxJobs);
  const enhanced = await Promise.all(
    topJobs.map(async (job) => {
      const { fitScore, aiReasoning } = await enhanceJobFitWithAI(profile, job);
      return {
        ...job,
        fitScore,
        // Store AI reasoning in a custom field if needed
        ...(aiReasoning ? { _aiReasoning: aiReasoning } : {}),
      };
    }),
  );

  // Merge enhanced jobs back with original list, maintaining order
  const enhancedMap = new Map(enhanced.map((j) => [j.externalId, j]));
  return jobs.map((j) => enhancedMap.get(j.externalId) ?? j);
}
