import { randomUUID } from 'crypto';
import type { Request as ExpressRequest } from 'express';
import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export interface BackendAuth {
  clerkUserId: string;
  sessionId: string | null;
}

export interface AuthenticatedAppUser {
  id: string;
  clerkId: string;
  email: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

const clerkClient = createClerkClient({
  secretKey: getRequiredEnv('CLERK_SECRET_KEY'),
  publishableKey: getRequiredEnv('CLERK_PUBLISHABLE_KEY'),
});

function getAuthorizedParties(): string[] {
  return [process.env.FRONTEND_URL, process.env.APP_URL]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map((value) => value.trim());
}

function toRequestUrl(req: ExpressRequest): string {
  const host = req.get('host');
  if (!host) throw new Error('Missing host header on incoming request');
  return `${req.protocol}://${host}${req.originalUrl}`;
}

function toRequestHeaders(req: ExpressRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    }
  }
  return headers;
}

export async function authenticateRequest(req: ExpressRequest): Promise<BackendAuth | null> {
  try {
    const request = new Request(toRequestUrl(req), {
      method: req.method,
      headers: toRequestHeaders(req),
    });

    const verification = await clerkClient.authenticateRequest(request, {
      authorizedParties: getAuthorizedParties(),
      ...(process.env.CLERK_JWT_KEY ? { jwtKey: process.env.CLERK_JWT_KEY } : {}),
    });

    const auth = verification.toAuth();
    if (!auth) return null;
    const userId = auth.userId;
    if (!userId) return null;

    return {
      clerkUserId: userId,
      sessionId: auth.sessionId ?? null,
    };
  } catch {
    // In dev with DEV_BYPASS_AUTH, return null gracefully
    return null;
  }
}

function getPrimaryEmailAddress(
  clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>,
): string {
  const primaryEmail = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
  ) ?? clerkUser.emailAddresses[0];
  return primaryEmail?.emailAddress ?? `${clerkUser.id}@multivohub.local`;
}

export async function getOrCreateAppUser(clerkUserId: string): Promise<AuthenticatedAppUser> {
  const existing = await db
    .select({ id: users.id, clerkId: users.clerkId, email: users.email })
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  const found = existing[0];
  if (found) return found;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email = getPrimaryEmailAddress(clerkUser);

  // Use INSERT ... ON DUPLICATE KEY approach for MySQL
  await db.insert(users).values({
    id: randomUUID(),
    clerkId: clerkUserId,
    email,
    updatedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: { email, updatedAt: new Date() } });

  const result = await db
    .select({ id: users.id, clerkId: users.clerkId, email: users.email })
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  return result[0];
}
