import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { assistantConversations, users } from '../../db/schema.js';
import { generateCareerResponse } from '../../services/openai.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return rows[0]?.id ?? null;
}

export const assistantRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(4000),
      mode: z.string().default('general'),
      userId: z.string().optional(),
      jobId: z.string().nullable().optional(),
      history: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().max(12000),
          }),
        )
        .max(30)
        .optional(),
    }))
    .mutation(async ({ input }) => {
      const text = await generateCareerResponse(input.text, input.mode, input.history);

      // Persist conversation activity for the user — non-fatal
      if (input.userId) {
        const localId = await getLocalUserId(input.userId).catch(() => null);
        if (localId) {
          const existing = await db
            .select({ id: assistantConversations.id })
            .from(assistantConversations)
            .where(eq(assistantConversations.userId, localId))
            .limit(1)
            .catch(() => [] as { id: string }[]);

          if (existing.length > 0) {
            await db.update(assistantConversations)
              .set({
                messageCount: sql`${assistantConversations.messageCount} + 2`,
                lastMessageAt: new Date(),
              })
              .where(eq(assistantConversations.userId, localId))
              .catch(() => {});
          } else {
            await db.insert(assistantConversations).values({
              id: crypto.randomUUID(),
              userId: localId,
              messageCount: 2,
              lastMessageAt: new Date(),
            }).catch(() => {});
          }
        }
      }

      return {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        type: 'text' as const,
        text,
        createdAt: new Date().toISOString(),
      };
    }),

  getHistory: publicProcedure
    .input(z.object({ userId: z.string(), limit: z.number().max(50).default(20) }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return [];
      return db.select()
        .from(assistantConversations)
        .where(eq(assistantConversations.userId, localId))
        .orderBy(desc(assistantConversations.lastMessageAt))
        .limit(input.limit);
    }),
});
