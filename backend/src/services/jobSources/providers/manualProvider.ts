import { eq, and, like, or } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { jobs } from '../../../db/schema.js';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

export class ManualProvider implements JobSourceProvider {
  name = 'manual';
  label = 'Manual Entries';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: true };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const q = input.query.toLowerCase();
    const rows = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.source, 'manual'),
          or(
            like(jobs.title, `%${q}%`),
            like(jobs.company, `%${q}%`),
          ),
        ),
      )
      .limit(input.limit);

    return rows.map((j) => ({
      externalId: j.externalId ?? j.id,
      source: 'manual',
      title: j.title,
      company: j.company,
      location: j.location ?? '',
      description: j.description ?? '',
      applyUrl: j.applyUrl ?? '',
      salaryMin: j.salaryMin !== null ? Number(j.salaryMin) : null,
      salaryMax: j.salaryMax !== null ? Number(j.salaryMax) : null,
      workMode: j.workMode ?? null,
      requirements: j.requirements ?? [],
      postedAt: j.createdAt.toISOString(),
      fitScore: j.fitScore ?? undefined,
    }));
  }
}
