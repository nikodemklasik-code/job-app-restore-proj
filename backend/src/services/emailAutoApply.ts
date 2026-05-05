/**
 * Email-based Auto-Apply Service
 *
 * Generates CV + Cover Letter for a queued auto-apply item and sends them
 * via the user's configured SMTP server.  Called by the worker poll loop.
 */

import { randomUUID } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  autoApplyQueue,
  users,
  profiles,
  skills,
  userEmailSettings,
  applicationLogs,
  applications,
  jobs,
} from '../db/schema.js';
import { generateCoverLetter, generateCvSummary, scoreJobFit } from './aiPersonalizer.js';
import { assessJobScamRisk } from './jobProtection.js';
import { generateCvPdf, generateCoverLetterPdf } from './pdfGenerator.js';
import { getLearnedSignals } from './learningService.js';
import { sendViaSmtp as _sendViaSmtp, deobfuscate } from './emailSettings.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueRow = typeof autoApplyQueue.$inferSelect;

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Process one pending email-apply queue item.
 * Returns 'sent' | 'skipped' | 'failed'.
 */
export async function processEmailApply(job: QueueRow): Promise<'sent' | 'skipped' | 'failed'> {
  const { userId, applyEmail, jobTitle, company } = job;

  if (!applyEmail) {
    return 'skipped'; // no employer email — handled by browser-automation branch
  }


  const linkedJob = job.jobId
    ? await db.select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      description: jobs.description,
      applyUrl: jobs.applyUrl,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
    }).from(jobs).where(eq(jobs.id, job.jobId)).limit(1)
    : [];

  const scamAssessment = assessJobScamRisk({
    title: linkedJob[0]?.title ?? jobTitle,
    company: linkedJob[0]?.company ?? company,
    description: linkedJob[0]?.description ?? '',
    applyUrl: linkedJob[0]?.applyUrl ?? job.applyUrl,
    salaryMin: linkedJob[0]?.salaryMin ? Number(linkedJob[0].salaryMin) : null,
    salaryMax: linkedJob[0]?.salaryMax ? Number(linkedJob[0].salaryMax) : null,
  });

  if (scamAssessment.level === 'high') {
    await db.update(autoApplyQueue).set({
      status: 'skipped',
      errorMessage: `Blocked by scam protection: ${scamAssessment.reasons.join('; ')}`,
      updatedAt: new Date(),
    }).where(eq(autoApplyQueue.id, job.id));
    return 'skipped';
  }

  // ── 1. Load user ──────────────────────────────────────────────────────────
  const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRow[0]) return 'failed';
  const user = userRow[0];

  // ── 2. Load SMTP settings ─────────────────────────────────────────────────
  const smtpRow = await db.select().from(userEmailSettings).where(eq(userEmailSettings.userId, userId)).limit(1);
  if (!smtpRow[0] || !smtpRow[0].isVerified || !smtpRow[0].smtpHost || !smtpRow[0].smtpUser || !smtpRow[0].smtpPassEncrypted) {
    return 'skipped'; // no verified SMTP — skip silently
  }
  const smtp = smtpRow[0];

  // ── 3. Load profile ───────────────────────────────────────────────────────
  const profileRow = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profileRow[0]) return 'skipped'; // no profile
  const profile = profileRow[0];

  const skillRows = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));
  const learnedSignals = await getLearnedSignals(userId);

  const jobData = { title: jobTitle, company };
  const profileData = {
    fullName: profile.fullName,
    summary: profile.summary ?? '',
    skills: skillRows.map((s) => s.name),
  };

  // ── 4. Generate text ──────────────────────────────────────────────────────
  const [coverLetter, cvSummary] = await Promise.all([
    generateCoverLetter(profileData, jobData, learnedSignals),
    generateCvSummary(profileData, jobData),
  ]);

  const fitResult = await scoreJobFit(profileData, jobData);

  // ── 5. Generate PDFs ──────────────────────────────────────────────────────
  const [cvPdf, clPdf] = await Promise.all([
    generateCvPdf({
      fullName: profile.fullName,
      email: user.email,
      phone: profile.phone ?? '',
      summary: cvSummary,
      skills: skillRows.map((s) => s.name),
    }),
    generateCoverLetterPdf(coverLetter, {
      senderName: profile.fullName,
      company,
      role: jobTitle,
    }),
  ]);

  // ── 6. Send via SMTP ──────────────────────────────────────────────────────
  const subject = `Application for ${jobTitle} at ${company}`;
  const html = `<p>Dear Hiring Manager,</p>
<p>Please find attached my CV and cover letter for the <strong>${jobTitle}</strong> role at <strong>${company}</strong>.</p>
<p>I look forward to hearing from you.</p>
<p>Best regards,<br/>${profile.fullName}${user.email ? `<br/><a href="mailto:${user.email}">${user.email}</a>` : ''}</p>`;

  await sendViaSmtpWithAttachments(
    { host: smtp.smtpHost!, port: smtp.smtpPort ?? 587, user: smtp.smtpUser!, passEncrypted: smtp.smtpPassEncrypted!, fromName: smtp.fromName },
    applyEmail,
    subject,
    html,
    [
      { filename: 'CV.pdf', content: cvPdf },
      { filename: 'CoverLetter.pdf', content: clPdf },
    ],
  );

  // ── 7. Persist snapshots + update queue item ──────────────────────────────
  await db.update(autoApplyQueue).set({
    cvSnapshot: cvSummary,
    clSnapshot: coverLetter,
    fitScore: fitResult.score,
    status: 'applied',
    appliedAt: new Date(),
    sentAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(autoApplyQueue.id, job.id));

  // ── 8. Create a matching application record (if not already linked) ───────
  // So the pipeline shows this auto-apply
  const existingApp = job.jobId
    ? await db.select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, job.jobId)))
      .limit(1)
    : [];

  if (!existingApp.length) {
    const appId = randomUUID();
    await db.insert(applications).values({
      id: appId,
      userId,
      jobId: job.jobId ?? null,
      jobTitle,
      company,
      status: 'sent',
      fitScore: fitResult.score,
      cvSnapshot: cvSummary,
      coverLetterSnapshot: coverLetter,
      emailSentAt: new Date(),
      channel: 'email',
    });
    await db.insert(applicationLogs).values({
      id: randomUUID(),
      applicationId: appId,
      action: 'auto_applied',
      meta: { queueId: job.id, applyEmail },
    });
  }

  return 'sent';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Attachment { filename: string; content: Buffer }

async function sendViaSmtpWithAttachments(
  settings: { host: string; port: number; user: string; passEncrypted: string; fromName?: string | null },
  to: string,
  subject: string,
  html: string,
  attachments: Attachment[],
): Promise<void> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.default.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: deobfuscate(settings.passEncrypted) },
  });
  await transport.sendMail({
    from: settings.fromName ? `"${settings.fromName}" <${settings.user}>` : settings.user,
    to,
    replyTo: settings.user,
    subject,
    html,
    attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
  });
}
