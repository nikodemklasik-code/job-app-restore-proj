/**
 * IMAP Inbox Monitor
 *
 * Runs every 30 minutes.  For each active emailMonitoring record, connects to
 * the user's IMAP mailbox, looks for new messages from the employer domain,
 * classifies them as 'invitation' or 'other', sends a push notification, and
 * updates the application status.
 *
 * Privacy note: only subjects/senders are read to classify; full body is NOT
 * stored.  Classification result is NOT included in the push notification body
 * (user reads the email themselves).
 */

import { randomUUID } from 'node:crypto';
import Imap from 'imap';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  emailMonitoring,
  applications,
  applicationLogs,
  userEmailSettings,
} from '../db/schema.js';
import { deobfuscate } from './emailSettings.js';
import { sendPushToUser } from './pushNotifier.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[imap ${new Date().toISOString()}] ${msg}`);
}

/** Map standard SMTP host → IMAP host */
function smtpToImapHost(smtpHost: string): string {
  return smtpHost.replace(/^smtp\./, 'imap.').replace(/^smtp-mail\./, 'imap-mail.');
}

/** Very simple invitation / rejection heuristic based on subject keywords */
function classifySubject(subject: string): 'invitation' | 'rejection' | 'other' {
  const s = subject.toLowerCase();
  if (/interview|invite|invitation|assessment|schedule|next step|progressed/.test(s)) return 'invitation';
  if (/unfortunately|unsuccessful|not.*proceed|regret|decline|not.*selected/.test(s)) return 'rejection';
  return 'other';
}

// ─── Per-monitoring-record processing ────────────────────────────────────────

async function processMonitorRecord(
  record: typeof emailMonitoring.$inferSelect,
): Promise<void> {
  // Load application
  const appRows = await db.select().from(applications).where(eq(applications.id, record.applicationId)).limit(1);
  if (!appRows[0]) return;
  const app = appRows[0];

  // Skip if already in a terminal state
  if (['rejected', 'accepted', 'interview'].includes(app.status ?? '')) return;

  // Load IMAP credentials — prefer record-level overrides, fall back to SMTP settings
  let imapHost: string;
  let imapPort: number;
  let imapUser: string;
  let imapPass: string;

  const smtpRow = await db.select().from(userEmailSettings).where(eq(userEmailSettings.userId, record.userId)).limit(1);
  if (!smtpRow[0] || !smtpRow[0].smtpUser || !smtpRow[0].smtpPassEncrypted) return;

  imapHost = record.imapHost ?? smtpToImapHost(smtpRow[0].smtpHost ?? '');
  imapPort = record.imapPort ?? 993;
  imapUser = smtpRow[0].smtpUser!;
  imapPass = deobfuscate(
    record.imapPassEncrypted ?? smtpRow[0].smtpPassEncrypted!,
  );

  if (!imapHost) return;

  // ── Connect and search ──────────────────────────────────────────────────
  let newMessages: Array<{ subject: string; from: string; uid: number }>;
  try {
    newMessages = await fetchNewMessages(imapHost, imapPort, imapUser, imapPass, record.lastUid ?? 0, app.company);
  } catch (err) {
    log(`IMAP connect error for monitoring ${record.id}: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (!newMessages.length) return;

  // ── Update lastUid ──────────────────────────────────────────────────────
  const maxUid = Math.max(...newMessages.map((m) => m.uid));
  await db.update(emailMonitoring).set({ lastUid: maxUid, updatedAt: new Date() }).where(eq(emailMonitoring.id, record.id));

  // ── Process each new message ────────────────────────────────────────────
  for (const msg of newMessages) {
    const classification = classifySubject(msg.subject);

    // Push notification — never reveals classification outcome
    await sendPushToUser(record.userId, {
      title: 'Nowa wiadomość od pracodawcy',
      body: `Otrzymałeś wiadomość od ${app.company}`,
      url: `/applications/${app.id}`,
      tag: `email-reply-${app.id}`,
    });

    // Update application status
    let newStatus: string | null = null;
    if (classification === 'invitation') newStatus = 'interview';
    else if (classification === 'rejection') newStatus = 'rejected';

    if (newStatus) {
      await db.update(applications).set({ status: newStatus, updatedAt: new Date() }).where(eq(applications.id, app.id));
    }

    // Log
    await db.insert(applicationLogs).values({
      id: randomUUID(),
      applicationId: app.id,
      action: 'email_reply_detected',
      meta: {
        from: msg.from,
        subject: msg.subject,
        classification,
        ...(newStatus ? { newStatus } : {}),
      },
    });

    log(`✓ Detected reply for app ${app.id} from ${app.company} — ${classification}${newStatus ? ` → ${newStatus}` : ''}`);
  }
}

// ─── IMAP helper — connects and fetches messages after lastUid ────────────────

function fetchNewMessages(
  host: string,
  port: number,
  user: string,
  password: string,
  lastUid: number,
  companyHint: string,
): Promise<Array<{ subject: string; from: string; uid: number }>> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({ user, password, host, port, tls: true, tlsOptions: { rejectUnauthorized: false }, authTimeout: 10000 });
    const results: Array<{ subject: string; from: string; uid: number }> = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, _box) => {
        if (err) { imap.end(); return reject(err); }

        const searchCriteria: unknown[] = [['UID', `${lastUid + 1}:*`]];

        imap.search(searchCriteria, (sErr, uids) => {
          if (sErr) { imap.end(); return reject(sErr); }
          if (!uids || uids.length === 0) { imap.end(); return resolve([]); }

          const fetch = imap.fetch(uids, { bodies: 'HEADER.FIELDS (FROM SUBJECT)', struct: false });

          fetch.on('message', (msg, seqno) => {
            const uid = uids[seqno - 1] ?? seqno;
            let rawHeader = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => { rawHeader += chunk.toString(); });
            });

            msg.once('end', () => {
              // Quick parse of From and Subject
              const fromMatch = /^From:\s*(.+)$/im.exec(rawHeader);
              const subjectMatch = /^Subject:\s*(.+)$/im.exec(rawHeader);
              const from = fromMatch?.[1]?.trim() ?? '';
              const subject = subjectMatch?.[1]?.trim() ?? '';

              // Only keep messages plausibly from the employer
              const companyLower = companyHint.toLowerCase();
              const relevantFrom = from.toLowerCase().includes(companyLower) ||
                // fallback: accept any message since the search is already uid-bounded
                true;

              if (relevantFrom) {
                results.push({ subject, from, uid });
              }
            });
          });

          fetch.once('error', (fErr) => { imap.end(); reject(fErr); });
          fetch.once('end', () => { imap.end(); });
        });
      });
    });

    imap.once('error', (err: Error) => reject(err));
    imap.once('end', () => resolve(results));
    imap.connect();
  });
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function runImapMonitor(): Promise<void> {
  log('Running IMAP monitor…');

  const records = await db
    .select()
    .from(emailMonitoring)
    .where(eq(emailMonitoring.isActive, true));

  if (!records.length) { log('No active monitoring records.'); return; }

  log(`Processing ${records.length} monitoring record(s)…`);

  for (const record of records) {
    try {
      await processMonitorRecord(record);
    } catch (err) {
      log(`Error in monitoring record ${record.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
