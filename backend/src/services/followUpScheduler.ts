/**
 * Follow-up Scheduler
 *
 * Runs once per day.  Finds applications with status='sent' where
 * emailSentAt < now - 7 days and no follow-up log entry yet, then
 * generates an AI follow-up email and sends it via the user's SMTP.
 */

import { randomUUID } from 'node:crypto';
import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  applications,
  applicationLogs,
  users,
  profiles,
  userEmailSettings,
} from '../db/schema.js';
import { generateFollowUp } from './aiPersonalizer.js';
import { sendViaSmtp } from './emailSettings.js';

const FOLLOW_UP_DAYS = 7;

function log(msg: string) {
  console.log(`[followup ${new Date().toISOString()}] ${msg}`);
}

export async function runFollowUpScheduler(): Promise<void> {
  log('Running follow-up scheduler…');

  const cutoff = new Date(Date.now() - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);

  // Find sent applications older than cutoff
  const candidates = await db
    .select({
      id: applications.id,
      userId: applications.userId,
      jobTitle: applications.jobTitle,
      company: applications.company,
      emailSentAt: applications.emailSentAt,
      status: applications.status,
    })
    .from(applications)
    .where(
      and(
        eq(applications.status, 'sent'),
        lt(applications.emailSentAt, cutoff),
      ),
    );

  if (!candidates.length) {
    log('No candidates for follow-up.');
    return;
  }

  log(`Found ${candidates.length} candidate(s) for follow-up.`);

  for (const app of candidates) {
    try {
      await processFollowUp(app, cutoff);
    } catch (err) {
      log(`Error processing follow-up for app ${app.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function processFollowUp(
  app: { id: string; userId: string; jobTitle: string; company: string; emailSentAt: Date | null; status: string | null },
  _cutoff: Date,
): Promise<void> {
  // Skip if a follow-up was already sent
  const existing = await db
    .select({ id: applicationLogs.id })
    .from(applicationLogs)
    .where(
      and(
        eq(applicationLogs.applicationId, app.id),
        eq(applicationLogs.action, 'follow_up_sent'),
      ),
    )
    .limit(1);

  if (existing.length) return;

  // Load SMTP settings
  const smtpRow = await db.select().from(userEmailSettings).where(eq(userEmailSettings.userId, app.userId)).limit(1);
  if (!smtpRow[0] || !smtpRow[0].isVerified || !smtpRow[0].smtpHost || !smtpRow[0].smtpUser || !smtpRow[0].smtpPassEncrypted) {
    log(`Skipping app ${app.id} — no verified SMTP for user ${app.userId}`);
    return;
  }
  const smtp = smtpRow[0];

  // Load profile name
  const profileRow = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, app.userId)).limit(1);
  const applicantName = profileRow[0]?.fullName ?? 'Candidate';

  // Load user email (to send follow-up TO — or for From header)
  const userRow = await db.select({ email: users.email }).from(users).where(eq(users.id, app.userId)).limit(1);
  if (!userRow[0]) return;

  const daysSince = app.emailSentAt
    ? Math.floor((Date.now() - new Date(app.emailSentAt).getTime()) / (1000 * 60 * 60 * 24))
    : FOLLOW_UP_DAYS;

  const followUpText = await generateFollowUp({
    applicantName,
    jobTitle: app.jobTitle,
    company: app.company,
    daysSinceApply: daysSince,
    previousStatus: 'sent',
  });

  // The follow-up is sent to the user themselves (they forward/reply) if no
  // original recipient email is stored.  For a proper implementation the
  // original recipient email should be stored in applicationLogs or a
  // dedicated column.  Here we send to the logged-in user's own email so they
  // have the text ready.
  const recipientEmail = userRow[0].email;

  const subject = extractSubject(followUpText) ?? `Follow-up: ${app.jobTitle} at ${app.company}`;
  const body = stripSubjectLine(followUpText);

  await sendViaSmtp(
    { host: smtp.smtpHost!, port: smtp.smtpPort ?? 587, user: smtp.smtpUser!, passEncrypted: smtp.smtpPassEncrypted!, fromName: smtp.fromName },
    recipientEmail,
    subject,
    `<pre style="font-family:sans-serif">${body}</pre>`,
  );

  // Update status + log
  await db.update(applications).set({
    status: 'follow_up_sent',
    updatedAt: new Date(),
  }).where(eq(applications.id, app.id));

  await db.insert(applicationLogs).values({
    id: randomUUID(),
    applicationId: app.id,
    action: 'follow_up_sent',
    meta: { daysSince, generatedText: body },
  });

  log(`✓ Follow-up sent for app ${app.id} (${app.jobTitle} @ ${app.company})`);
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function extractSubject(text: string): string | null {
  const match = /^Subject:\s*(.+)$/im.exec(text);
  return match ? match[1].trim() : null;
}

function stripSubjectLine(text: string): string {
  return text.replace(/^Subject:.*\n?/im, '').trim();
}
