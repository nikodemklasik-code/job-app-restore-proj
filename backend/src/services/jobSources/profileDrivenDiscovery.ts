import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, profiles, experiences, skills } from '../../db/schema.js';
import { generateJobQueries } from './aiQueryGenerator.js';
import type { DiscoveryInput, ProviderContext, SourceJob } from './types.js';
import type { ProviderName } from '../../../../shared/jobSources.js';

const DELEGATE_NAMES: ProviderName[] = [
  'reed',
  'adzuna',
  'jooble',
  'indeed-browser',
  'database',
  'manual',
  'company-targets',
];

export async function discoverJobsForProfile(
  input: DiscoveryInput,
  context?: ProviderContext,
): Promise<SourceJob[]> {
  // Lazy import to avoid circular dependency with jobDiscoveryService
  const { JobDiscoveryService } = await import('./jobDiscoveryService.js');

  // Load user profile from DB
  let profileData: {
    skills?: string[];
    experiences?: Array<{ jobTitle: string }>;
    targetRole?: string;
  } = {};

  if (input.userId) {
    try {
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
          const [skillRows, expRows] = await Promise.all([
            db
              .select({ name: skills.name })
              .from(skills)
              .where(eq(skills.profileId, profileRows[0].id)),
            db
              .select({ jobTitle: experiences.jobTitle })
              .from(experiences)
              .where(eq(experiences.profileId, profileRows[0].id))
              .limit(5),
          ]);

          profileData = {
            skills: skillRows.map((s) => s.name),
            experiences: expRows.map((e) => ({ jobTitle: e.jobTitle })),
          };
        }
      }
    } catch (err) {
      console.error('[profileDrivenDiscovery] Failed to load profile:', err);
    }
  }

  const queries = await generateJobQueries(profileData, 5);

  const allJobs: SourceJob[] = [];
  for (const query of queries) {
    try {
      const result = await JobDiscoveryService.discover(
        { ...input, query, providers: DELEGATE_NAMES },
        context,
      );
      allJobs.push(...result.jobs);
    } catch (err) {
      console.error(`[profileDrivenDiscovery] Query "${query}" failed:`, err);
    }
  }

  // Deduplicate by externalId + source
  const seen = new Set<string>();
  const deduped = allJobs.filter((j) => {
    const key = `${j.externalId.toLowerCase().trim()}|${j.source.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by fitScore descending, return top N
  return deduped
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    .slice(0, input.limit);
}
