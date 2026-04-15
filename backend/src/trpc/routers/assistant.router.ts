import { randomUUID } from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { allowedAssistantSourceTypes, assistantModes } from '../../../../shared/assistant.js';
import { assistantConversations, assistantMessages } from '../../db/schema.js';
import { db } from '../../db/index.js';
import {
  assertAllowedAssistantSourceType,
  generateCareerResponse,
  redactSensitiveText,
} from '../../services/openai.js';
import { protectedProcedure, router } from '../trpc.js';

async function getOrCreateConversation(userId: string): Promise<string> {
  const existing = await db
    .select({ id: assistantConversations.id })
    .from(assistantConversations)
    .where(eq(assistantConversations.userId, userId))
    .orderBy(desc(assistantConversations.lastMessageAt))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const id = randomUUID();
  await db.insert(assistantConversations).values({
    id,
    userId,
    messageCount: 0,
    lastMessageAt: new Date(),
  });
  return id;
}

export const assistantRouter = router({
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const conversationId = await getOrCreateConversation(userId);
    const rows = await db
      .select()
      .from(assistantMessages)
      .where(
        and(
          eq(assistantMessages.userId, userId),
          eq(assistantMessages.conversationId, conversationId),
        ),
      )
      .orderBy(asc(assistantMessages.createdAt))
      .limit(100);

    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        text: z.string().trim().min(1).max(4000),
        mode: z.enum(assistantModes).default('general'),
        sourceType: z.enum(allowedAssistantSourceTypes).default('manual_user_input'),
        jobId: z.string().uuid().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const sourceType = assertAllowedAssistantSourceType(input.sourceType);
      const conversationId = await getOrCreateConversation(userId);

      // Insert user message
      const userMsgId = randomUUID();
      await db.insert(assistantMessages).values({
        id: userMsgId,
        conversationId,
        userId,
        role: 'user',
        text: input.text,
        sourceType,
        createdAt: new Date(),
      });
      const [userRecord] = await db
        .select()
        .from(assistantMessages)
        .where(eq(assistantMessages.id, userMsgId))
        .limit(1);

      // Get recent context for AI (most recent 12, then reverse for chronological order)
      const recent = await db
        .select({ role: assistantMessages.role, text: assistantMessages.text })
        .from(assistantMessages)
        .where(
          and(
            eq(assistantMessages.userId, userId),
            eq(assistantMessages.conversationId, conversationId),
          ),
        )
        .orderBy(desc(assistantMessages.createdAt))
        .limit(12);

      const aiText = await generateCareerResponse({
        mode: input.mode,
        sourceType,
        messages: recent.reverse().map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.role === 'user' ? redactSensitiveText(m.text) : m.text,
        })),
      });

      // Insert AI message
      const aiMsgId = randomUUID();
      await db.insert(assistantMessages).values({
        id: aiMsgId,
        conversationId,
        userId,
        role: 'assistant',
        text: aiText,
        sourceType,
        createdAt: new Date(),
      });
      const [aiRecord] = await db
        .select()
        .from(assistantMessages)
        .where(eq(assistantMessages.id, aiMsgId))
        .limit(1);

      // Update conversation counter
      await db
        .update(assistantConversations)
        .set({
          lastMessageAt: new Date(),
          messageCount: sql`${assistantConversations.messageCount} + 2`,
        })
        .where(eq(assistantConversations.id, conversationId));

      if (!userRecord || !aiRecord) {
        throw new Error('Failed to retrieve inserted messages');
      }

      return {
        conversationId,
        userRecord: { ...userRecord, createdAt: userRecord.createdAt.toISOString() },
        aiRecord: { ...aiRecord, createdAt: aiRecord.createdAt.toISOString() },
      };
    }),
});
