import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { assistantToneValues, themeModeValues, userSettings, users } from '../../db/schema.js';
import { protectedProcedure, router } from '../trpc.js';

const themeModeSchema = z.enum(themeModeValues);
const assistantToneSchema = z.enum(assistantToneValues);

const settingsOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  marketingEmails: z.boolean(),
  autoSaveDocuments: z.boolean(),
  darkMode: z.boolean(),
  themeMode: themeModeSchema,
  assistantTone: assistantToneSchema,
  timezone: z.string(),
  language: z.string(),
  privacyMode: z.boolean(),
  shareProfileAnalytics: z.boolean(),
  blockedCompanyDomains: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const settingsUpdateSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  marketingEmails: z.boolean(),
  autoSaveDocuments: z.boolean(),
  darkMode: z.boolean(),
  themeMode: themeModeSchema,
  assistantTone: assistantToneSchema,
  timezone: z.string().min(1).max(64),
  language: z.string().min(2).max(10),
  privacyMode: z.boolean(),
  shareProfileAnalytics: z.boolean(),
  blockedCompanyDomains: z.array(z.string().min(1).max(255)).max(100),
});

function isMissingUserSettingsTable(err: unknown): boolean {
  const e = err as { errno?: number; code?: string; message?: string };
  if (e.errno === 1146) return true;
  if (e.code === 'ER_NO_SUCH_TABLE') return true;
  if (typeof e.message === 'string' && e.message.includes("doesn't exist")) return true;
  return false;
}

function sanitizeDomains(domains: string[]): string[] {
  return Array.from(
    new Set(
      domains
        .map((domain) => domain.trim().toLowerCase())
        .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)),
    ),
  ).sort();
}

function normalizeLanguage(language: string): string {
  return language.trim().toLowerCase();
}

function toSettingsDto(row: {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  autoSaveDocuments: boolean;
  darkMode: boolean;
  themeMode: string;
  assistantTone: string;
  timezone: string;
  language: string;
  privacyMode: boolean;
  shareProfileAnalytics: boolean;
  blockedCompanyDomains: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const themeMode = themeModeSchema.safeParse(row.themeMode).success
    ? (row.themeMode as z.infer<typeof themeModeSchema>)
    : 'system';
  const assistantTone = assistantToneSchema.safeParse(row.assistantTone).success
    ? (row.assistantTone as z.infer<typeof assistantToneSchema>)
    : 'balanced';

  return {
    id: row.id,
    userId: row.userId,
    emailNotifications: row.emailNotifications,
    pushNotifications: row.pushNotifications,
    weeklyDigest: row.weeklyDigest,
    marketingEmails: row.marketingEmails,
    autoSaveDocuments: row.autoSaveDocuments,
    darkMode: row.darkMode,
    themeMode,
    assistantTone,
    timezone: row.timezone,
    language: row.language,
    privacyMode: row.privacyMode,
    shareProfileAnalytics: row.shareProfileAnalytics,
    blockedCompanyDomains: row.blockedCompanyDomains ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function phantomSettings(userId: string): z.infer<typeof settingsOutputSchema> {
  const now = new Date().toISOString();
  return {
    id: 'not-installed',
    userId,
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
    autoSaveDocuments: true,
    darkMode: false,
    themeMode: 'system',
    assistantTone: 'balanced',
    timezone: 'UTC',
    language: 'en-GB',
    privacyMode: false,
    shareProfileAnalytics: false,
    blockedCompanyDomains: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureSettingsRow(userId: string) {
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);

  if (!existingUser) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Authenticated user not found.' });
  }

  const [existingSettings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

  if (existingSettings) {
    return existingSettings;
  }

  const id = randomUUID();
  await db.insert(userSettings).values({
    id,
    userId,
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
    autoSaveDocuments: true,
    darkMode: false,
    themeMode: 'system',
    assistantTone: 'balanced',
    timezone: 'UTC',
    language: 'en-GB',
    privacyMode: false,
    shareProfileAnalytics: false,
    blockedCompanyDomains: [],
  });

  const [inserted] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

  if (!inserted) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Settings row could not be created.' });
  }

  return inserted;
}

export const settingsRouter = router({
  getSettings: protectedProcedure.output(settingsOutputSchema).query(async ({ ctx }) => {
    const userId = ctx.user.id;
    try {
      const row = await ensureSettingsRow(userId);
      return settingsOutputSchema.parse(toSettingsDto(row));
    } catch (err) {
      if (isMissingUserSettingsTable(err)) {
        return settingsOutputSchema.parse(phantomSettings(userId));
      }
      throw err;
    }
  }),

  updateSettings: protectedProcedure
    .input(settingsUpdateSchema)
    .output(settingsOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      try {
        const current = await ensureSettingsRow(userId);

        const blockedCompanyDomains = sanitizeDomains(input.blockedCompanyDomains);
        const language = normalizeLanguage(input.language);

        await db
          .update(userSettings)
          .set({
            emailNotifications: input.emailNotifications,
            pushNotifications: input.pushNotifications,
            weeklyDigest: input.weeklyDigest,
            marketingEmails: input.marketingEmails,
            autoSaveDocuments: input.autoSaveDocuments,
            darkMode: input.darkMode,
            themeMode: input.themeMode,
            assistantTone: input.assistantTone,
            timezone: input.timezone,
            language,
            privacyMode: input.privacyMode,
            shareProfileAnalytics: input.shareProfileAnalytics,
            blockedCompanyDomains,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.id, current.id));

        const [updated] = await db.select().from(userSettings).where(eq(userSettings.id, current.id)).limit(1);

        if (!updated) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Updated settings could not be loaded.' });
        }

        return settingsOutputSchema.parse(toSettingsDto(updated));
      } catch (err) {
        if (isMissingUserSettingsTable(err)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'user_settings table is not installed. Apply backend/sql/user_settings.sql on MySQL.',
          });
        }
        throw err;
      }
    }),
});
