import { randomUUID } from 'crypto';
import { scoreJobFit } from '../aiPersonalizer.js';
import { logScrape } from './scrapeLogStore.js';
import { getProviders } from './providerRegistry.js';
import type { DiscoveryInput, DiscoveryResult, ProviderContext, SourceJob } from './types.js';

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

export class JobDiscoveryService {
  static async discover(
    input: DiscoveryInput,
    context?: ProviderContext,
    enabledProviders?: string[],
  ): Promise<DiscoveryResult> {
    const startedAt = Date.now();
    const traceId = randomUUID();
    const allProviders = getProviders();

    // Determine which providers to run
    const targetNames = input.providers ?? enabledProviders ?? allProviders.map((p) => p.name);
    const selected = allProviders.filter((p) => targetNames.includes(p.name));

    const rawJobs: SourceJob[] = [];
    const failures: Array<{ provider: string; error: string }> = [];

    console.info('[JobDiscoveryService] discovery started', {
      traceId,
      query: input.query,
      location: input.location,
      providers: selected.map((provider) => provider.name),
      limit: input.limit,
      userIdPresent: Boolean(input.userId),
    });

    // Run all providers in parallel and time each provider separately.
    const settled = await Promise.allSettled(
      selected.map(async (provider) => {
        const providerStartedAt = Date.now();
        const jobs = await provider.discover(input, context);
        return {
          provider: provider.name,
          jobs,
          durationMs: elapsedMs(providerStartedAt),
        };
      }),
    );

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      const provider = selected[i];
      if (result.status === 'fulfilled') {
        rawJobs.push(...result.value.jobs);
        logScrape({
          ts: new Date(),
          provider: provider.name,
          query: input.query,
          location: input.location,
          count: result.value.jobs.length,
          durationMs: result.value.durationMs,
          traceId,
        });
        console.info('[JobDiscoveryService] provider completed', {
          traceId,
          provider: provider.name,
          query: input.query,
          location: input.location,
          count: result.value.jobs.length,
          durationMs: result.value.durationMs,
        });
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push({ provider: provider.name, error: errorMsg });
        logScrape({
          ts: new Date(),
          provider: provider.name,
          query: input.query,
          location: input.location,
          count: 0,
          durationMs: undefined,
          traceId,
          error: errorMsg,
        });
        console.error('[JobDiscoveryService] provider failed', {
          traceId,
          provider: provider.name,
          query: input.query,
          location: input.location,
          error: errorMsg,
        });
      }
    }

    // Deduplicate by externalId + source
    const seen = new Set<string>();
    const dedupedJobs = rawJobs.filter((job) => {
      const key = `${job.externalId.toLowerCase().trim()}|${job.source.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Score fit if userId present
    let finalJobs = dedupedJobs;
    if (input.userId && dedupedJobs.length > 0) {
      const scoringStartedAt = Date.now();
      try {
        const { db } = await import('../../db/index.js');
        const { users, profiles, skills: skillsTable } = await import('../../db/schema.js');
        const { eq } = await import('drizzle-orm');

        const userRows = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.clerkId, input.userId))
          .limit(1);

        if (userRows[0]) {
          const profileRows = await db
            .select({ id: profiles.id, summary: profiles.summary })
            .from(profiles)
            .where(eq(profiles.userId, userRows[0].id))
            .limit(1);

          if (profileRows[0]) {
            const skillRows = await db
              .select({ name: skillsTable.name })
              .from(skillsTable)
              .where(eq(skillsTable.profileId, profileRows[0].id));

            const profileForScoring = {
              summary: profileRows[0].summary ?? '',
              skills: skillRows.map((s) => s.name),
            };

            finalJobs = await Promise.all(
              dedupedJobs.map(async (job) => {
                try {
                  const { score } = await scoreJobFit(profileForScoring, job);
                  return { ...job, fitScore: score };
                } catch {
                  return job;
                }
              }),
            );
          }
        }
      } catch (err) {
        console.error('[JobDiscoveryService] Fit scoring failed:', err);
      } finally {
        console.info('[JobDiscoveryService] fit scoring completed', {
          traceId,
          jobs: dedupedJobs.length,
          durationMs: elapsedMs(scoringStartedAt),
        });
      }
    }

    const totalDurationMs = elapsedMs(startedAt);
    logScrape({
      ts: new Date(),
      provider: '__session__',
      query: input.query,
      location: input.location,
      count: finalJobs.length,
      rawCount: rawJobs.length,
      dedupedCount: dedupedJobs.length,
      durationMs: totalDurationMs,
      traceId,
      error: failures.length > 0 ? failures.map((failure) => `${failure.provider}: ${failure.error}`).join('; ') : undefined,
    });
    console.info('[JobDiscoveryService] discovery completed', {
      traceId,
      query: input.query,
      location: input.location,
      rawCount: rawJobs.length,
      dedupedCount: dedupedJobs.length,
      finalCount: finalJobs.length,
      failures,
      durationMs: totalDurationMs,
    });

    return {
      jobs: finalJobs,
      failures,
      totalRaw: rawJobs.length,
      deduped: dedupedJobs.length,
    };
  }
}
