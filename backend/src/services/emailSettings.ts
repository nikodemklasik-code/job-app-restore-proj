import nodemailer from 'nodemailer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'custom';

export const PROVIDER_PRESETS: Record<EmailProvider, { host: string; port: number; label: string }> = {
  gmail:   { host: 'smtp.gmail.com',        port: 587, label: 'Gmail' },
  outlook: { host: 'smtp-mail.outlook.com', port: 587, label: 'Outlook / Hotmail' },
  yahoo:   { host: 'smtp.mail.yahoo.com',   port: 587, label: 'Yahoo Mail' },
  icloud:  { host: 'smtp.mail.me.com',      port: 587, label: 'iCloud Mail' },
  custom:  { host: '',                       port: 587, label: 'Custom SMTP' },
};

// ENCRYPTION_KEY must be set in .env (32-byte hex or ASCII string)
// See .env.example: ENCRYPTION_KEY=<32-char secret>
const ENCRYPTION_KEY = Buffer.from(
  process.env.ENCRYPTION_KEY ?? 'multivohub-default-key-32-chars!!',
  'utf8'
).slice(0, 32);

export function obfuscate(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function deobfuscate(enc: string): string {
  try {
    const buf = Buffer.from(enc, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    // Fallback: try old base64 decoding for migration
    try { return Buffer.from(enc, 'base64').toString('utf8'); } catch { return ''; }
  }
}

export async function testSmtpConnection(settings: {
  host: string; port: number; user: string; passEncrypted: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      auth: { user: settings.user, pass: deobfuscate(settings.passEncrypted) },
      connectionTimeout: 8000,
    });
    await transport.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendViaSmtp(settings: {
  host: string; port: number; user: string; passEncrypted: string; fromName?: string | null;
}, to: string, subject: string, html: string): Promise<void> {
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: deobfuscate(settings.passEncrypted) },
  });
  await transport.sendMail({
    from: settings.fromName ? `"${settings.fromName}" <${settings.user}>` : settings.user,
    to,
    subject,
    html,
  });
}
