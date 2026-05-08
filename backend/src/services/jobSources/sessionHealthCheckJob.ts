import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { userJobSessions } from '../../db/schema.js';
import { decryptSessionCookies } from './sessionCookieCrypto.js';
import { EXTERNAL_SESSION_PROVIDERS, type ExternalSessionProvider } from './sessionCookies.js';
import { testExternalProviderSession } from './externalSessionVerifier.js';

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;
let running = false;

function isExternalProvider(provider: string): provider is ExternalSessionProvider {
  return (EXTERNAL_SESSION_PROVIDERS as readonly string[]).includes(provider);
}

export async function runJobSessionHealthCheck(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const sessions = await db.select().from(userJobSessions);

    for (const session of sessions) {
      if (!isExternalProvider(session.provider)) continue;

      try {
        const cookies = decryptSessionCookies(session.cookies);
        const result = await testExternalProviderSession(session.provider, cookies);
        const keepActive = result.status === 'active' || result.status === 'blocked';

        await db.update(userJobSessions)
          .set({
            isActive: keepActive,
            sessionStatus: result.status,
            lastHealthReason: result.reason.slice(0, 500),
            lastTestedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(userJobSessions.id, session.id), eq(userJobSessions.provider, session.provider)));
      } catch (err) {
        await db.update(userJobSessions)
          .set({
            sessionStatus: 'needs_refresh',
            lastHealthReason: `Health-check failed before remote verification: ${String(err)}`.slice(0, 500),
            lastTestedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userJobSessions.id, session.id));
      }
    }
  } finally {
    running = false;
  }
}

export function startJobSessionHealthCheckJob(intervalMs = Number(process.env.JOB_SESSION_HEALTH_INTERVAL_MS ?? DEFAULT_INTERVAL_MS)): void {
  if (timer || process.env.NODE_ENV === 'test') return;
  timer = setInterval(() => {
    void runJobSessionHealthCheck().catch((err) => console.error('[job-session-health-check]', err));
  }, intervalMs);
  timer.unref?.();
}
