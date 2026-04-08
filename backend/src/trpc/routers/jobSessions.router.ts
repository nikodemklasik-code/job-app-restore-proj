import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { userJobSessions, users } from '../../db/schema.js';
import {
  startIndeedLogin,
  submitIndeedCode,
  loginGumtree,
  submitGumtreeCode,
  storageStateToCookieString,
  storageStateToJson,
} from '../../services/browserAuth.js';

const SUPPORTED_PROVIDERS = ['indeed', 'gumtree'] as const;
type Provider = typeof SUPPORTED_PROVIDERS[number];

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

async function upsertSession(userId: string, provider: string, cookieString: string, storageStateJson?: string) {
  const existing = await db.select({ id: userJobSessions.id })
    .from(userJobSessions)
    .where(and(eq(userJobSessions.userId, userId), eq(userJobSessions.provider, provider)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userJobSessions).set({
      cookies: cookieString,
      storageState: storageStateJson ?? null,
      isActive: true,
      updatedAt: new Date(),
    }).where(eq(userJobSessions.id, existing[0].id));
  } else {
    await db.insert(userJobSessions).values({
      id: randomUUID(),
      userId,
      provider,
      cookies: cookieString,
      storageState: storageStateJson ?? null,
    });
  }
}

export const jobSessionsRouter = router({
  // ── Status ──────────────────────────────────────────────────────────────────
  getStatus: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return [];

      return db.select({
        id: userJobSessions.id,
        provider: userJobSessions.provider,
        isActive: userJobSessions.isActive,
        lastTestedAt: userJobSessions.lastTestedAt,
        updatedAt: userJobSessions.updatedAt,
      }).from(userJobSessions).where(eq(userJobSessions.userId, localId));
    }),

  // ── Indeed: start login (email + optional password) ─────────────────────────
  startIndeedLogin: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await startIndeedLogin(input.userId, input.email, input.password);
      return result;
    }),

  // ── Indeed: submit verification code ────────────────────────────────────────
  submitIndeedCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().min(4).max(10),
    }))
    .mutation(async ({ input }) => {
      const result = await submitIndeedCode(input.userId, input.code);
      if (result.success && result.storageState) {
        const localId = await getLocalUserId(input.userId);
        if (localId) {
          const cookieStr = storageStateToCookieString(result.storageState);
          const stateJson = storageStateToJson(result.storageState);
          await upsertSession(localId, 'indeed', cookieStr, stateJson);
        }
      }
      return { success: result.success, error: result.error };
    }),

  // ── Gumtree: start login ──────────────────────────────────────────────────
  startGumtreeLogin: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await loginGumtree(input.userId, input.email, input.password);
      if (result.success && result.storageState) {
        const localId = await getLocalUserId(input.userId);
        if (localId) {
          const cookieStr = storageStateToCookieString(result.storageState);
          const stateJson = storageStateToJson(result.storageState);
          await upsertSession(localId, 'gumtree', cookieStr, stateJson);
        }
      }
      return {
        success: result.success,
        requiresCode: result.requiresCode ?? false,
        codeSentTo: result.codeSentTo ?? null,
        error: result.error,
      };
    }),

  // ── Gumtree: submit verification code ────────────────────────────────────
  submitGumtreeCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().min(4).max(10),
    }))
    .mutation(async ({ input }) => {
      const result = await submitGumtreeCode(input.userId, input.code);
      if (result.success && result.storageState) {
        const localId = await getLocalUserId(input.userId);
        if (localId) {
          const cookieStr = storageStateToCookieString(result.storageState);
          const stateJson = storageStateToJson(result.storageState);
          await upsertSession(localId, 'gumtree', cookieStr, stateJson);
        }
      }
      return { success: result.success, error: result.error };
    }),

  // ── Manual cookie paste (fallback) ───────────────────────────────────────
  saveCookies: publicProcedure
    .input(z.object({
      userId: z.string(),
      provider: z.enum(SUPPORTED_PROVIDERS),
      cookies: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');
      await upsertSession(localId, input.provider, input.cookies);
      return { success: true };
    }),

  // ── Test saved session ────────────────────────────────────────────────────
  testSession: publicProcedure
    .input(z.object({ userId: z.string(), provider: z.enum(SUPPORTED_PROVIDERS) }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const session = await db.select()
        .from(userJobSessions)
        .where(and(eq(userJobSessions.userId, localId), eq(userJobSessions.provider, input.provider)))
        .limit(1);

      if (!session[0]) return { ok: false, reason: 'No session saved' };

      const testUrls: Record<Provider, string> = {
        indeed: 'https://www.indeed.co.uk/jobs?q=developer&l=London&limit=1',
        gumtree: 'https://www.gumtree.com/jobs/england/london?q=developer',
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
        const isLoggedIn = input.provider === 'indeed'
          ? (html.includes('jobsearch-ResultsList') || html.includes('mosaic-provider-jobcards'))
          : (html.includes('data-q="search-result"') || html.includes('listing-title'));

        const ok = res.ok && isLoggedIn;
        await db.update(userJobSessions)
          .set({ isActive: ok, lastTestedAt: new Date(), updatedAt: new Date() })
          .where(eq(userJobSessions.id, session[0].id));

        return { ok, reason: ok ? 'Session is active' : 'Session expired — please log in again' };
      } catch (err) {
        return { ok: false, reason: String(err) };
      }
    }),

  // ── Remove session ────────────────────────────────────────────────────────
  remove: publicProcedure
    .input(z.object({ userId: z.string(), provider: z.enum(SUPPORTED_PROVIDERS) }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { success: false };
      await db.delete(userJobSessions)
        .where(and(eq(userJobSessions.userId, localId), eq(userJobSessions.provider, input.provider)));
      return { success: true };
    }),
});
