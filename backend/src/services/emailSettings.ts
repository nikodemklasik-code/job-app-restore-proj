import nodemailer from 'nodemailer';

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'custom';

export const PROVIDER_PRESETS: Record<EmailProvider, { host: string; port: number; label: string }> = {
  gmail:   { host: 'smtp.gmail.com',        port: 587, label: 'Gmail' },
  outlook: { host: 'smtp-mail.outlook.com', port: 587, label: 'Outlook / Hotmail' },
  yahoo:   { host: 'smtp.mail.yahoo.com',   port: 587, label: 'Yahoo Mail' },
  icloud:  { host: 'smtp.mail.me.com',      port: 587, label: 'iCloud Mail' },
  custom:  { host: '',                       port: 587, label: 'Custom SMTP' },
};

export function obfuscate(plain: string): string {
  return Buffer.from(plain, 'utf8').toString('base64');
}

export function deobfuscate(enc: string): string {
  try { return Buffer.from(enc, 'base64').toString('utf8'); } catch { return ''; }
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
