import { db } from '../db/index.js';
import {
  users,
  subscriptions,
  profiles,
  applications,
  cvUploads,
  interviewSessions,
  interviewAnswers,
  assistantConversations,
  assistantMessages,
  userJobSessions,
  passkeys,
  userEmailSettings,
  userTelegramSettings,
  activeSessions,
  learningSignals,
} from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';

const DAY = 24 * 60 * 60 * 1000;
/** Canonical app URL for retention emails (must match FRONTEND_URL in production). */
const APP_URL =
  process.env.FRONTEND_URL?.replace(/\/$/, '') ||
  process.env.APP_URL?.replace(/\/$/, '') ||
  'https://jobs.multivohub.com';

async function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function retentionEmailHtml(type: 1 | 2): string {
  const daysLeft = type === 1 ? 25 : 5;
  const urgency = type === 1
    ? 'We noticed you haven\'t logged in for 20 days.'
    : 'This is your final warning. Your account has been inactive for 40 days.';
  const title = type === 1
    ? `Your account will be deleted in ${daysLeft} days`
    : `⚠️ Final warning: ${daysLeft} days until account deletion`;
  const color = type === 1 ? '#6366f1' : '#ef4444';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">✦</div>
          <span style="color:#fff;font-size:18px;font-weight:700;">MultivoHub</span>
        </div>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Career Workspace</p>
      </td></tr>
      <!-- Alert banner -->
      <tr><td style="background:${color}18;border-bottom:2px solid ${color}40;padding:16px 40px;text-align:center;">
        <p style="color:${color};margin:0;font-weight:700;font-size:15px;">${title}</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:40px;">
        <p style="color:#94a3b8;margin:0 0 20px;font-size:15px;line-height:1.6;">${urgency}</p>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6;">
          Your account and all associated data — profile, CV, applications, interview history — will be <strong style="color:#f1f5f9;">permanently deleted</strong> if you don't log in within <strong style="color:${color};">${daysLeft} days</strong>.
        </p>
        <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:28px;">
          <p style="color:#64748b;margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">What will be deleted</p>
          <ul style="color:#94a3b8;margin:0;padding-left:20px;font-size:14px;line-height:2;">
            <li>Profile, CV, skills &amp; experience</li>
            <li>Application history &amp; documents</li>
            <li>Interview practice sessions</li>
            <li>AI assistant conversations</li>
          </ul>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <a href="${APP_URL}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 40px;border-radius:12px;">
            Log In to Keep My Account →
          </a>
        </td></tr></table>
        <p style="color:#475569;margin:28px 0 0;font-size:13px;text-align:center;line-height:1.6;">
          If you have an active paid subscription, your account is safe and this message doesn't apply.<br>
          To request full account deletion under UK GDPR, email privacy@multivohub.com from your registered address.
        </p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="border-top:1px solid #1e293b;padding:24px 40px;text-align:center;">
        <p style="color:#475569;margin:0;font-size:12px;">MultivoHub<br>
        You're receiving this because your account has been inactive. <a href="${APP_URL}/settings" style="color:#6366f1;">Manage notifications</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendRetentionEmail(to: string, type: 1 | 2) {
  const transport = await getTransport();
  if (!transport) {
    console.log(`[Retention] Would send warning ${type} to ${to} (no SMTP configured)`);
    return;
  }
  const subject =
    type === 1
      ? 'Your MultivoHub account will be deleted in 25 days'
      : '⚠️ Final warning: Your MultivoHub account will be deleted in 5 days';

  try {
    await transport.sendMail({
      from: `"MultivoHub" <noreply@multivohub.com>`,
      to,
      subject,
      html: retentionEmailHtml(type),
      text:
        type === 1
          ? `Your MultivoHub account will be deleted in 25 days due to inactivity. Log in at ${APP_URL} to keep your account.`
          : `Final warning: Your MultivoHub account will be deleted in 5 days. Log in at ${APP_URL} immediately.`,
    });
    console.log(`[Retention] Warning ${type} email sent to ${to}`);
  } catch (e) {
    console.error('[Retention] Email send failed:', e);
  }
}

export async function runRetentionJob() {
  console.log('[Retention] Starting job at', new Date().toISOString());

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      lastSeenAt: users.lastSeenAt,
      retentionStatus: users.retentionStatus,
      retentionExempt: users.retentionExempt,
      createdAt: users.createdAt,
    })
    .from(users);

  for (const user of allUsers) {
    // Skip exempt users (admin flag)
    if (user.retentionExempt) continue;

    // Skip users already fully purged
    if (user.retentionStatus === 'purged') continue;

    // Skip users with active paid subscription
    const sub = await db
      .select({ plan: subscriptions.plan, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);
    const hasActiveSub = sub[0]?.status === 'active' && sub[0]?.plan !== 'free';
    if (hasActiveSub) continue;

    const lastActivity = user.lastSeenAt ?? user.createdAt ?? new Date(0);
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / DAY;

    // ── Hard delete / purge: 60+ days, soft-deleted ──────────────────────────
    if (daysSince >= 60 && user.retentionStatus === 'scheduled_for_deletion') {
      // Delete interview answers first (FK)
      const sessions = await db
        .select({ id: interviewSessions.id })
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, user.id));

      if (sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await db.delete(interviewAnswers)
          .where(inArray(interviewAnswers.sessionId, sessionIds))
          .catch(() => {});
      }

      // Delete assistant messages first (FK on conversations)
      const convs = await db
        .select({ id: assistantConversations.id })
        .from(assistantConversations)
        .where(eq(assistantConversations.userId, user.id));

      if (convs.length > 0) {
        const convIds = convs.map((c) => c.id);
        await db.delete(assistantMessages)
          .where(inArray(assistantMessages.conversationId, convIds))
          .catch(() => {});
      }

      // Purge all product data — keep subscriptions row for billing/accounting
      await Promise.allSettled([
        db.delete(applications).where(eq(applications.userId, user.id)),
        db.delete(cvUploads).where(eq(cvUploads.userId, user.id)),
        db.delete(interviewSessions).where(eq(interviewSessions.userId, user.id)),
        db.delete(assistantConversations).where(eq(assistantConversations.userId, user.id)),
        db.delete(userJobSessions).where(eq(userJobSessions.userId, user.id)),
        db.delete(passkeys).where(eq(passkeys.userId, user.id)),
        db.delete(userEmailSettings).where(eq(userEmailSettings.userId, user.id)),
        db.delete(userTelegramSettings).where(eq(userTelegramSettings.userId, user.id)),
        db.delete(activeSessions).where(eq(activeSessions.userId, user.id)),
        db.delete(learningSignals).where(eq(learningSignals.userId, user.id)),
        db.delete(profiles).where(eq(profiles.userId, user.id)),
      ]);

      // Anonymise users row — keep for billing record integrity
      await db
        .update(users)
        .set({
          retentionStatus: 'purged',
          email: `purged_${user.id}@deleted.multivohub.com`,
          deletedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`[Retention] Hard delete/purge complete for user ${user.id}`);
      continue;
    }

    // ── Soft delete: 45+ days, not yet in deletion flow ──────────────────────
    if (
      daysSince >= 45 &&
      !['scheduled_for_deletion', 'deleted', 'purged'].includes(user.retentionStatus ?? '')
    ) {
      await db
        .update(users)
        .set({
          retentionStatus: 'scheduled_for_deletion',
          deletionScheduledAt: new Date(Date.now() + 15 * DAY),
          deletedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      console.log(`[Retention] Soft deleted user ${user.id} (${daysSince.toFixed(1)} days inactive)`);
      continue;
    }

    // ── Warning 2: 40+ days inactive, on warning 1 ───────────────────────────
    if (daysSince >= 40 && user.retentionStatus === 'inactive_warning_1') {
      await db
        .update(users)
        .set({ retentionStatus: 'inactive_warning_2', warning2SentAt: new Date() })
        .where(eq(users.id, user.id));
      if (user.email) await sendRetentionEmail(user.email, 2);
      console.log(`[Retention] Warning 2 sent to user ${user.id} (${daysSince.toFixed(1)} days inactive)`);
      continue;
    }

    // ── Warning 1: 20+ days inactive, still active ───────────────────────────
    // NOTE: no upper bound — if job missed a day and user is already at 41+ days
    // but still 'active', we catch them here before soft-delete kicks in
    if (daysSince >= 20 && (user.retentionStatus === 'active' || user.retentionStatus === null)) {
      await db
        .update(users)
        .set({ retentionStatus: 'inactive_warning_1', warning1SentAt: new Date() })
        .where(eq(users.id, user.id));
      if (user.email) await sendRetentionEmail(user.email, 1);
      console.log(`[Retention] Warning 1 sent to user ${user.id} (${daysSince.toFixed(1)} days inactive)`);
      continue;
    }
  }

  console.log('[Retention] Job complete');
}
