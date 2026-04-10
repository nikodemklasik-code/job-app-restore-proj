import { scoreJobFit } from '../../aiPersonalizer.js';
import { logScrape } from './scrapeLogStore.js';
import { getProviders } from './providerRegistry.js';
import type { DiscoveryInput, DiscoveryResult, ProviderContext, SourceJob } from './types.js';

export class JobDiscoveryService {
  static async discover(
    input: DiscoveryInput,
    context?: ProviderContext,
    enabledProviders?: string[],
  ): Promise<DiscoveryResult> {
    const allProviders = getProviders();

    // Determine which providers to run
    const targetNames = input.providers ?? enabledProviders ?? allProviders.map((p) => p.name);
    const selected = allProviders.filter((p) => targetNames.includes(p.name));

    const rawJobs: SourceJob[] = [];
    const failures: Array<{ provider: string; error: string }> = [];

    // Run all providers in parallel
    const settled = await Promise.allSettled(
      selected.map((provider) =>
        provider.discover(input, context).then((jobs) => ({ provider: provider.name, jobs })),
      ),
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
          count: result.value.jobs.length,
        });
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push({ provider: provider.name, error: errorMsg });
        logScrape({
          ts: new Date(),
          provider: provider.name,
          query: input.query,
          count: 0,
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
      }
    }

    return {
      jobs: finalJobs,
      failures,
      totalRaw: rawJobs.length,
      deduped: dedupedJobs.length,
    };
  }
}
