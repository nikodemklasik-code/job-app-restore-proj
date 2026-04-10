/**
 * Auto-Apply Queue Worker
 *
 * Runs as a standalone PM2 process (ecosystem.config.cjs → worker app).
 * Polls `auto_apply_queue` for pending jobs every 30 seconds and processes
 * them via Playwright browser automation (Indeed / Gumtree session reuse).
 *
 * Start:  node dist/backend/src/worker.js
 * Dev:    tsx src/worker.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { eq, sql, and } from 'drizzle-orm';
import { db } from './db/index.js';
import { autoApplyQueue, userJobSessions, users } from './db/schema.js';

const POLL_INTERVAL_MS = 30_000;
const MAX_CONCURRENT = 2;
const JOB_TIMEOUT_MS = 120_000; // 2 min per job max

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[worker ${new Date().toISOString()}] ${msg}`);
}

async function markStatus(
  id: string,
  status: 'processing' | 'applied' | 'failed' | 'skipped',
  errorMessage?: string,
) {
  await db
    .update(autoApplyQueue)
    .set({
      status,
      errorMessage: errorMessage ?? null,
      ...(status === 'applied' ? { appliedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(autoApplyQueue.id, id));
}

// ─── Core apply logic ─────────────────────────────────────────────────────────

async function applyToJob(job: {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  applyUrl: string;
  source: string | null;
}): Promise<void> {
  log(`Processing job ${job.id} — "${job.jobTitle}" at ${job.company}`);

  // Fetch saved browser session for this user + source
  const provider = job.source === 'gumtree' ? 'gumtree' : 'indeed';
  const sessionRow = await db
    .select()
    .from(userJobSessions)
    .where(
      and(
        eq(userJobSessions.userId, job.userId),
        eq(userJobSessions.provider, provider),
        eq(userJobSessions.isActive, true),
      ),
    )
    .limit(1);

  if (!sessionRow.length || !sessionRow[0].storageState) {
    log(`No active ${provider} session for user ${job.userId} — skipping`);
    await markStatus(job.id, 'skipped', `No active ${provider} session`);
    return;
  }

  const storageStateJson = sessionRow[0].storageState;

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const storageState = JSON.parse(storageStateJson) as Parameters<
      typeof browser.newContext
    >[0]['storageState'];

    const context = await browser.newContext({
      storageState,
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Navigate to the apply URL with a timeout guard
    await page.goto(job.applyUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Detect "Easy Apply" or standard apply button (Indeed pattern)
    const applyBtn = page
      .locator(
        'button[data-testid="indeedApplyButton"], button:has-text("Apply now"), a:has-text("Apply now"), button:has-text("Easy Apply")',
      )
      .first();

    const btnVisible = await applyBtn.isVisible().catch(() => false);
    if (!btnVisible) {
      log(`No apply button found for job ${job.id} — skipping`);
      await markStatus(job.id, 'skipped', 'No apply button found on page');
      await context.close();
      return;
    }

    await applyBtn.click();
    // Allow the application dialog / next page to load
    await page.waitForTimeout(3000);

    // Check for a "Submit" or "Continue" button in the application flow
    const submitBtn = page
      .locator(
        'button[data-testid="submit-application-button"], button:has-text("Submit"), button:has-text("Continue"), button:has-text("Send application")',
      )
      .first();

    const submitVisible = await submitBtn.isVisible().catch(() => false);
    if (submitVisible) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Look for confirmation signal
    const confirmed = await page
      .locator(
        ':has-text("Application submitted"), :has-text("You applied"), :has-text("successfully applied")',
      )
      .count()
      .catch(() => 0);

    if (confirmed > 0) {
      log(`✓ Applied to job ${job.id}`);
      await markStatus(job.id, 'applied');
    } else {
      log(`? Uncertain result for job ${job.id} — marking applied (manual review recommended)`);
      await markStatus(job.id, 'applied');
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

// ─── Poll loop ────────────────────────────────────────────────────────────────

async function processBatch(): Promise<void> {
  // Fetch up to MAX_CONCURRENT pending jobs
  const pending = await db
    .select()
    .from(autoApplyQueue)
    .where(eq(autoApplyQueue.status, 'pending'))
    .orderBy(autoApplyQueue.scheduledAt)
    .limit(MAX_CONCURRENT);

  if (!pending.length) return;

  log(`Found ${pending.length} pending job(s)`);

  // Resolve internal user IDs (autoApplyQueue stores internal userId, not clerkId)
  await Promise.all(
    pending.map(async (job) => {
      await markStatus(job.id, 'processing');
      try {
        await Promise.race([
          applyToJob({ ...job, source: job.source ?? 'indeed' }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Job timed out')), JOB_TIMEOUT_MS),
          ),
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`✗ Job ${job.id} failed: ${msg}`);
        await markStatus(job.id, 'failed', msg);
      }
    }),
  );
}

// ─── Reset any jobs stuck in "processing" at startup (crash recovery) ─────────

async function recoverStuckJobs(): Promise<void> {
  const result = await db
    .update(autoApplyQueue)
    .set({ status: 'pending', updatedAt: new Date() })
    .where(eq(autoApplyQueue.status, 'processing'));
  const affected = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
  if (affected > 0) log(`Recovered ${affected} stuck job(s) → pending`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('Auto-apply worker starting…');
  await recoverStuckJobs();

  const poll = async () => {
    try {
      await processBatch();
    } catch (err) {
      log(`Poll error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setTimeout(poll, POLL_INTERVAL_MS);
  };

  await poll();
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err);
  process.exit(1);
});
