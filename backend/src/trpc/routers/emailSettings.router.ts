import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { userEmailSettings, users } from '../../db/schema.js';
import { obfuscate, testSmtpConnection, PROVIDER_PRESETS } from '../../services/emailSettings.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

export const emailSettingsRouter = router({
  getSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return null;

      const rows = await db.select({
        id: userEmailSettings.id,
        userId: userEmailSettings.userId,
        provider: userEmailSettings.provider,
        smtpHost: userEmailSettings.smtpHost,
        smtpPort: userEmailSettings.smtpPort,
        smtpUser: userEmailSettings.smtpUser,
        fromName: userEmailSettings.fromName,
        isVerified: userEmailSettings.isVerified,
        lastVerifiedAt: userEmailSettings.lastVerifiedAt,
        createdAt: userEmailSettings.createdAt,
        updatedAt: userEmailSettings.updatedAt,
      }).from(userEmailSettings).where(eq(userEmailSettings.userId, localId)).limit(1);

      return rows[0] ?? null;
    }),

  saveSettings: publicProcedure
    .input(z.object({
      userId: z.string(),
      provider: z.enum(['gmail', 'outlook', 'yahoo', 'icloud', 'custom']),
      smtpHost: z.string().optional(),
      smtpPort: z.number().int().optional(),
      smtpUser: z.string().optional(),
      smtpPass: z.string().optional(),
      fromName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const preset = PROVIDER_PRESETS[input.provider];
      const resolvedHost = input.provider !== 'custom' ? preset.host : (input.smtpHost ?? '');
      const resolvedPort = input.provider !== 'custom' ? preset.port : (input.smtpPort ?? 587);

      const existing = await db.select({ id: userEmailSettings.id })
        .from(userEmailSettings)
        .where(eq(userEmailSettings.userId, localId))
        .limit(1);

      const passEncrypted = input.smtpPass ? obfuscate(input.smtpPass) : undefined;

      if (existing.length > 0) {
        await db.update(userEmailSettings).set({
          provider: input.provider,
          smtpHost: resolvedHost,
          smtpPort: resolvedPort,
          smtpUser: input.smtpUser ?? null,
          ...(passEncrypted !== undefined ? { smtpPassEncrypted: passEncrypted } : {}),
          fromName: input.fromName ?? null,
          isVerified: false,
          updatedAt: new Date(),
        }).where(eq(userEmailSettings.id, existing[0].id));
      } else {
        await db.insert(userEmailSettings).values({
          id: randomUUID(),
          userId: localId,
          provider: input.provider,
          smtpHost: resolvedHost,
          smtpPort: resolvedPort,
          smtpUser: input.smtpUser ?? null,
          smtpPassEncrypted: passEncrypted ?? null,
          fromName: input.fromName ?? null,
          isVerified: false,
        });
      }

      return { success: true };
    }),

  testConnection: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const rows = await db.select().from(userEmailSettings).where(eq(userEmailSettings.userId, localId)).limit(1);
      const settings = rows[0];
      if (!settings) return { ok: false, error: 'No SMTP settings configured' };
      if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassEncrypted) {
        return { ok: false, error: 'Incomplete SMTP settings' };
      }

      const result = await testSmtpConnection({
        host: settings.smtpHost,
        port: settings.smtpPort ?? 587,
        user: settings.smtpUser,
        passEncrypted: settings.smtpPassEncrypted,
      });

      if (result.ok) {
        await db.update(userEmailSettings).set({
          isVerified: true,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(userEmailSettings.id, settings.id));
      }

      return result;
    }),

  removeSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { success: false };
      await db.delete(userEmailSettings).where(eq(userEmailSettings.userId, localId));
      return { success: true };
    }),
});
