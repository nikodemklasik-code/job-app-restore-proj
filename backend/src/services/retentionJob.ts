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
  userJobSessions,
  passkeys,
  userEmailSettings,
  userTelegramSettings,
} from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';

const DAY = 24 * 60 * 60 * 1000;


async function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendRetentionEmail(to: string, type: 1 | 2) {
  const transport = await getTransport();
  if (!transport) {
    console.log(`[Retention] Would send warning ${type} to ${to} (no SMTP configured)`);
    return;
  }
  const subject =
    type === 1
      ? 'Your Multivohub account will be deleted in 25 days'
      : 'Final warning: Your Multivohub account will be deleted in 5 days';
  const body =
    type === 1
      ? `We noticed you haven't logged in for 20 days. Your account will be scheduled for deletion on day 45. Log in at https://jobapp.multivohub.com to keep your account active.`
      : `This is your final warning. Your account has been inactive for 40 days and will be deleted in 5 days. Log in at https://jobapp.multivohub.com immediately to prevent deletion.`;
  try {
    await transport.sendMail({
      from: `"MultivoHub" <noreply@multivohub.com>`,
      to,
      subject,
      text: body,
    });
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
    if (user.retentionExempt) continue;

    // Check if user has an active paid subscription
    const sub = await db
      .select({ plan: subscriptions.plan, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);
    const hasActiveSub = sub[0]?.status === 'active' && sub[0]?.plan !== 'free';
    if (hasActiveSub) continue;

    const lastActivity = user.lastSeenAt ?? user.createdAt ?? new Date(0);
    const daysSince = (Date.now() - new Date(lastActivity).getTime()) / DAY;

    // Warning 1: 20+ days inactive, still 'active'
    if (daysSince >= 20 && daysSince < 40 && user.retentionStatus === 'active') {
      await db
        .update(users)
        .set({ retentionStatus: 'inactive_warning_1', warning1SentAt: new Date() })
        .where(eq(users.id, user.id));
      if (user.email) await sendRetentionEmail(user.email, 1);
      console.log(`[Retention] Warning 1 sent to user ${user.id}`);
    }

    // Warning 2: 40+ days inactive, on warning 1
    if (
      daysSince >= 40 &&
      daysSince < 45 &&
      user.retentionStatus === 'inactive_warning_1'
    ) {
      await db
        .update(users)
        .set({ retentionStatus: 'inactive_warning_2', warning2SentAt: new Date() })
        .where(eq(users.id, user.id));
      if (user.email) await sendRetentionEmail(user.email, 2);
      console.log(`[Retention] Warning 2 sent to user ${user.id}`);
    }

    // Soft delete: 45+ days inactive, not yet scheduled/deleted/purged
    if (
      daysSince >= 45 &&
      !['scheduled_for_deletion', 'deleted', 'purged'].includes(
        user.retentionStatus ?? ''
      )
    ) {
      await db
        .update(users)
        .set({
          retentionStatus: 'scheduled_for_deletion',
          deletionScheduledAt: new Date(Date.now() + 15 * DAY),
          deletedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      console.log(`[Retention] Soft deleted user ${user.id}`);
    }

    // Hard delete / purge: 60+ days inactive, soft-deleted
    if (daysSince >= 60 && user.retentionStatus === 'scheduled_for_deletion') {
      // Delete interview answers via their session IDs before deleting sessions
      const sessions = await db
        .select({ id: interviewSessions.id })
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, user.id));

      if (sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await db
          .delete(interviewAnswers)
          .where(inArray(interviewAnswers.sessionId, sessionIds))
          .catch(() => {});
      }

      // Purge product data — keep subscriptions row for billing/accounting
      await Promise.allSettled([
        db.delete(applications).where(eq(applications.userId, user.id)),
        db.delete(cvUploads).where(eq(cvUploads.userId, user.id)),
        db.delete(interviewSessions).where(eq(interviewSessions.userId, user.id)),
        db.delete(assistantConversations).where(eq(assistantConversations.userId, user.id)),
        db.delete(userJobSessions).where(eq(userJobSessions.userId, user.id)),
        db.delete(passkeys).where(eq(passkeys.userId, user.id)),
        db.delete(userEmailSettings).where(eq(userEmailSettings.userId, user.id)),
        db.delete(userTelegramSettings).where(eq(userTelegramSettings.userId, user.id)),
        db.delete(profiles).where(eq(profiles.userId, user.id)),
      ]);

      // Anonymise the users row — keep it for billing record integrity
      await db
        .update(users)
        .set({
          retentionStatus: 'purged',
          email: `purged_${user.id}@deleted.multivohub.com`,
        })
        .where(eq(users.id, user.id));

      console.log(`[Retention] Hard deleted / purged user ${user.id}`);
    }
  }

  console.log('[Retention] Job complete');
}
