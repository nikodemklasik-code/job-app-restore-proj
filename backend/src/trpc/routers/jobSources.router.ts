import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { users, userJobSessions, jobSourceSettings } from '../../db/schema.js';
import { JOB_SOURCE_CATALOG } from '../../../../shared/jobSources.js';
import { getProviders } from '../../services/jobSources/providerRegistry.js';
import { JobDiscoveryService } from '../../services/jobSources/jobDiscoveryService.js';

export const jobSourcesRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      // Resolve internal user id
      const userRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);
      const internalUserId = userRows[0]?.id;

      // Load user's saved settings
      const settingsRows = internalUserId
        ? await db
            .select()
            .from(jobSourceSettings)
            .where(eq(jobSourceSettings.userId, internalUserId))
        : [];

      const settingsMap = new Map(settingsRows.map((s) => [s.providerName, s.isEnabled]));
      const providers = getProviders();
      const providerMap = new Map(providers.map((p) => [p.name, p]));

      // Build response in parallel
      const results = await Promise.all(
        JOB_SOURCE_CATALOG.map(async (entry) => {
          const provider = providerMap.get(entry.name);
          const isEnabled = settingsMap.has(entry.name)
            ? settingsMap.get(entry.name)!
            : entry.defaultEnabled;
          const readiness = provider
            ? await provider.readiness().catch(() => ({ ready: false, reason: 'Unknown error' }))
            : { ready: false, reason: 'Provider not registered' };

          return {
            ...entry,
            isEnabled,
            readiness,
          };
        }),
      );

      return results;
    }),

  update: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        providerName: z.string(),
        isEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const userRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);

      if (!userRows[0]) {
        throw new Error('User not found');
      }

      const internalUserId = userRows[0].id;

      // Check if setting already exists
      const existing = await db
        .select({ id: jobSourceSettings.id })
        .from(jobSourceSettings)
        .where(
          and(
            eq(jobSourceSettings.userId, internalUserId),
            eq(jobSourceSettings.providerName, input.providerName),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(jobSourceSettings)
          .set({ isEnabled: input.isEnabled })
          .where(eq(jobSourceSettings.id, existing[0].id));
      } else {
        await db.insert(jobSourceSettings).values({
          id: randomUUID(),
          userId: internalUserId,
          providerName: input.providerName,
          isEnabled: input.isEnabled,
        });
      }

      return { success: true };
    }),

  discover: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        query: z.string().default(''),
        location: z.string().default('United Kingdom'),
        limit: z.number().min(1).max(100).default(20),
        providers: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const userRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);
      const internalUserId = userRows[0]?.id;

      // Load user's enabled providers
      let enabledProviders: string[] | undefined;
      if (internalUserId) {
        const settingsRows = await db
          .select()
          .from(jobSourceSettings)
          .where(eq(jobSourceSettings.userId, internalUserId));

        if (settingsRows.length > 0) {
          enabledProviders = settingsRows
            .filter((s) => s.isEnabled)
            .map((s) => s.providerName);
        }
      }

      // Fetch session cookies
      const context: {
        sessionCookies?: Record<string, string>;
        userId?: string;
      } = { userId: input.userId };

      if (internalUserId) {
        const sessions = await db
          .select({ provider: userJobSessions.provider, cookies: userJobSessions.cookies })
          .from(userJobSessions)
          .where(
            and(
              eq(userJobSessions.userId, internalUserId),
              eq(userJobSessions.isActive, true),
            ),
          );

        if (sessions.length > 0) {
          context.sessionCookies = {};
          for (const s of sessions) {
            context.sessionCookies[s.provider] = s.cookies;
          }
        }
      }

      const result = await JobDiscoveryService.discover(
        {
          query: input.query,
          location: input.location,
          limit: input.limit,
          userId: input.userId,
          providers: input.providers,
        },
        context,
        enabledProviders,
      );

      return result;
    }),
});
