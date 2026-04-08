import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { userJobSessions, users } from '../../db/schema.js';

const SUPPORTED_PROVIDERS = ['indeed', 'gumtree'] as const;
type Provider = typeof SUPPORTED_PROVIDERS[number];

export const jobSessionsRouter = router({
  // Get status of all provider sessions for a user (cookies masked)
  getStatus: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return [];

      const sessions = await db.select({
        id: userJobSessions.id,
        provider: userJobSessions.provider,
        isActive: userJobSessions.isActive,
        lastTestedAt: userJobSessions.lastTestedAt,
        updatedAt: userJobSessions.updatedAt,
      }).from(userJobSessions).where(eq(userJobSessions.userId, userRecord[0].id));

      return sessions;
    }),

  // Save/replace cookie session for a provider
  saveCookies: publicProcedure
    .input(z.object({
      userId: z.string(),
      provider: z.enum(SUPPORTED_PROVIDERS),
      cookies: z.string().min(10, 'Paste the full cookie string from your browser'),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const existing = await db.select({ id: userJobSessions.id })
        .from(userJobSessions)
        .where(and(eq(userJobSessions.userId, userRecord[0].id), eq(userJobSessions.provider, input.provider)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(userJobSessions)
          .set({ cookies: input.cookies, isActive: true, updatedAt: new Date() })
          .where(eq(userJobSessions.id, existing[0].id));
      } else {
        await db.insert(userJobSessions).values({
          id: randomUUID(),
          userId: userRecord[0].id,
          provider: input.provider,
          cookies: input.cookies,
        });
      }

      return { success: true };
    }),

  // Test if the saved cookies still work
  testSession: publicProcedure
    .input(z.object({
      userId: z.string(),
      provider: z.enum(SUPPORTED_PROVIDERS),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const session = await db.select()
        .from(userJobSessions)
        .where(and(eq(userJobSessions.userId, userRecord[0].id), eq(userJobSessions.provider, input.provider)))
        .limit(1);

      if (!session[0]) return { ok: false, reason: 'No session saved' };

      const testUrls: Record<Provider, string> = {
        indeed: 'https://www.indeed.co.uk/jobs?q=developer&l=London&limit=1',
        gumtree: 'https://www.gumtree.com/jobs/england/london/developer',
      };

      try {
        const res = await fetch(testUrls[input.provider], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html',
            'Cookie': session[0].cookies,
          },
        });

        const html = await res.text();
        // Check that we're not on a login/captcha page
        const isLoggedIn = input.provider === 'indeed'
          ? (html.includes('jobsearch-ResultsList') || html.includes('mosaic-provider-jobcards'))
          : (html.includes('listings') || html.includes('data-q="listing-'));

        const ok = res.ok && isLoggedIn;

        await db.update(userJobSessions)
          .set({ isActive: ok, lastTestedAt: new Date(), updatedAt: new Date() })
          .where(eq(userJobSessions.id, session[0].id));

        return { ok, reason: ok ? 'Session is active' : 'Session expired or blocked — paste fresh cookies' };
      } catch (err) {
        return { ok: false, reason: String(err) };
      }
    }),

  // Remove a session
  remove: publicProcedure
    .input(z.object({ userId: z.string(), provider: z.enum(SUPPORTED_PROVIDERS) }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return { success: false };

      await db.delete(userJobSessions)
        .where(and(eq(userJobSessions.userId, userRecord[0].id), eq(userJobSessions.provider, input.provider)));

      return { success: true };
    }),
});
