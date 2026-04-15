import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { userTelegramSettings, users } from '../../db/schema.js';
import { verifyChatId, sendTelegramMessage } from '../../services/telegramBot.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

export const telegramRouter = router({
  getSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return null;

      const rows = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, localId)).limit(1);
      return rows[0] ?? null;
    }),

  saveSettings: publicProcedure
    .input(z.object({
      userId: z.string(),
      chatId: z.string().min(1),
      notifyOnApply: z.boolean().default(true),
      notifyOnReply: z.boolean().default(true),
      notifyOnInterview: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const existing = await db.select({ id: userTelegramSettings.id })
        .from(userTelegramSettings)
        .where(eq(userTelegramSettings.userId, localId))
        .limit(1);

      if (existing.length > 0) {
        await db.update(userTelegramSettings).set({
          chatId: input.chatId,
          notifyOnApply: input.notifyOnApply,
          notifyOnReply: input.notifyOnReply,
          notifyOnInterview: input.notifyOnInterview,
          updatedAt: new Date(),
        }).where(eq(userTelegramSettings.id, existing[0].id));
      } else {
        await db.insert(userTelegramSettings).values({
          id: randomUUID(),
          userId: localId,
          chatId: input.chatId,
          notifyOnApply: input.notifyOnApply,
          notifyOnReply: input.notifyOnReply,
          notifyOnInterview: input.notifyOnInterview,
        });
      }

      return { success: true };
    }),

  verify: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const rows = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, localId)).limit(1);
      const settings = rows[0];
      if (!settings) return { ok: false, error: 'No Telegram settings configured' };

      const result = await verifyChatId(settings.chatId);

      await db.update(userTelegramSettings).set({
        isActive: result.ok,
        updatedAt: new Date(),
      }).where(eq(userTelegramSettings.id, settings.id));

      return result;
    }),

  sendTest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const rows = await db.select().from(userTelegramSettings).where(eq(userTelegramSettings.userId, localId)).limit(1);
      const settings = rows[0];
      if (!settings) return { ok: false, error: 'No Telegram settings configured' };

      const ok = await sendTelegramMessage(
        settings.chatId,
        '✅ <b>Test message</b>\nYour Telegram notifications are working correctly!',
      );

      return { ok };
    }),

  removeSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { success: false };
      await db.delete(userTelegramSettings).where(eq(userTelegramSettings.userId, localId));
      return { success: true };
    }),
});
