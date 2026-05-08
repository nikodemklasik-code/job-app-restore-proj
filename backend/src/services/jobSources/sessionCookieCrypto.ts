import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';

function resolveSecret(): string {
  return (
    process.env.JOB_SESSION_COOKIE_ENCRYPTION_KEY ??
    process.env.COOKIE_ENCRYPTION_KEY ??
    process.env.SESSION_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    process.env.JWT_SECRET ??
    ''
  );
}

function keyFromSecret(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function isEncryptedCookieValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);
}

export function encryptSessionCookies(plainText: string): string {
  if (isEncryptedCookieValue(plainText)) return plainText;

  const secret = resolveSecret();
  if (!secret) {
    throw new Error(
      'JOB_SESSION_COOKIE_ENCRYPTION_KEY (or COOKIE_ENCRYPTION_KEY / SESSION_SECRET) is required before storing job board cookies.',
    );
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFromSecret(secret), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString('base64url')}`;
}

export function decryptSessionCookies(value: string): string {
  if (!isEncryptedCookieValue(value)) return value;

  const secret = resolveSecret();
  if (!secret) {
    throw new Error('Cannot decrypt job board cookies because JOB_SESSION_COOKIE_ENCRYPTION_KEY / COOKIE_ENCRYPTION_KEY / SESSION_SECRET is not configured.');
  }

  const payload = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), 'base64url');
  if (payload.length < 29) throw new Error('Encrypted job board cookie payload is malformed.');

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', keyFromSecret(secret), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
