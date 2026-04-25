import { randomUUID } from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { allowedAssistantSourceTypes, assistantModes } from '../../../../shared/assistant.js';
import { buildIncompleteProfileResponse } from '../../../../shared/profileCompletion.js';
import { assistantConversations, assistantMessages, applications, documents, profiles } from '../../db/schema.js';
import { db } from '../../db/index.js';
import {
  assertAllowedAssistantSourceType,
  buildAssistantResponseMeta,
  generateCareerResponse,
  redactSensitiveText,
} from '../../services/openai.js';
import { getUserPlan, planToPromptBehaviorTier } from '../../services/billingGuard.js';
import { fetchProfileSnapshotWithCompletion } from '../../services/profileSnapshot.service.js';
import { protectedProcedure, router } from '../trpc.js';
import { buildAssistantAiProductMeta } from '../../lib/openai/assistant-product-meta.js';
import {
  assistantAiMetaSchema,
  assistantStructuredResponseSchema,
} from '../../prompts/schemas/assistant-output.schema.js';

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

    let lastUserText = '';
    return rows.map((r) => {
      if (r.role === 'user') {
        lastUserText = r.text;
        return { ...r, createdAt: r.createdAt.toISOString(), meta: null };
      }
      const sourceType = assertAllowedAssistantSourceType(String(r.sourceType));
      const baseMeta = buildAssistantResponseMeta({
        userText: lastUserText || r.text,
        sourceType,
      });
      const aiProductMeta = buildAssistantAiProductMeta('general');
      const meta = assistantAiMetaSchema.parse({
        detectedIntent: baseMeta.detectedIntent,
        suggestedActions: baseMeta.suggestedActions,
        routeSuggestions: baseMeta.routeSuggestions,
        contextRefs: baseMeta.contextRefs,
        safetyNotes: baseMeta.safetyNotes,
        nextBestStep: baseMeta.nextBestStep ?? 'Open Coach',
        complianceFlags: baseMeta.complianceFlags ?? [],
        aiProductMeta,
      });
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        meta,
      };
    });
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
      const profileSnapshot = await fetchProfileSnapshotWithCompletion({ userId, email: ctx.user.email });
      if (!profileSnapshot.profileCompletion.isComplete) {
        return buildIncompleteProfileResponse(profileSnapshot.profileCompletion, false);
      }

      const sourceType = assertAllowedAssistantSourceType(input.sourceType);
      const conversationId = await getOrCreateConversation(userId);
      const baseMeta = buildAssistantResponseMeta({
        userText: input.text,
        mode: input.mode,
        sourceType,
      });

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

      const plan = await getUserPlan(ctx.user.clerkId);
      const behaviorTier = planToPromptBehaviorTier(plan);

      const aiText = await generateCareerResponse({
        mode: input.mode,
        sourceType,
        behaviorTier,
        messages: recent.reverse().map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.role === 'user' ? redactSensitiveText(m.text) : m.text,
        })),
      });
      const safetyPrefix = baseMeta.safetyNotes
        .filter((note) => note.level !== 'info')
        .map((note) => `Safety Note: ${note.text}`)
        .join('\n');
      const aiTextWithSafety = safetyPrefix ? `${safetyPrefix}\n\n${aiText}` : aiText;

      const aiMsgId = randomUUID();
      await db.insert(assistantMessages).values({
        id: aiMsgId,
        conversationId,
        userId,
        role: 'assistant',
        text: aiTextWithSafety,
        sourceType,
        createdAt: new Date(),
      });
      const [aiRecord] = await db
        .select()
        .from(assistantMessages)
        .where(eq(assistantMessages.id, aiMsgId))
        .limit(1);

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

      const nextBestStep = baseMeta.nextBestStep ?? 'Open Coach';
      const aiProductMeta = buildAssistantAiProductMeta(input.mode);
      const validatedMeta = assistantAiMetaSchema.parse({
        detectedIntent: baseMeta.detectedIntent,
        suggestedActions: baseMeta.suggestedActions,
        routeSuggestions: baseMeta.routeSuggestions,
        contextRefs: baseMeta.contextRefs,
        safetyNotes: baseMeta.safetyNotes,
        nextBestStep,
        complianceFlags: baseMeta.complianceFlags ?? [],
        aiProductMeta,
      });
      const validatedStructured = assistantStructuredResponseSchema.parse({
        conversation: aiTextWithSafety,
        relevantContext: baseMeta.contextRefs,
        suggestedActions: baseMeta.suggestedActions,
        nextBestStep,
        routeSuggestions: baseMeta.routeSuggestions,
        safetyNotes: baseMeta.safetyNotes,
      });

      return {
        status: 'ok' as const,
        profileSnapshot,
        conversationId,
        userRecord: { ...userRecord, createdAt: userRecord.createdAt.toISOString() },
        aiRecord: {
          ...aiRecord,
          createdAt: aiRecord.createdAt.toISOString(),
          meta: validatedMeta,
        },
        structured: validatedStructured,
      };
    }),

  resolveContext: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db.select().from(profiles)
      .where(eq(profiles.userId, ctx.user.id)).limit(1);
    const profileSnapshot = await fetchProfileSnapshotWithCompletion({ userId: ctx.user.id, email: ctx.user.email });
    const recentApplications = await db.select().from(applications)
      .where(eq(applications.userId, ctx.user.id))
      .orderBy(desc(applications.updatedAt)).limit(5);
    const recentDocuments = await db.select().from(documents)
      .where(eq(documents.userId, ctx.user.id))
      .orderBy(desc(documents.updatedAt)).limit(3);
    return {
      profile: profile ?? null,
      profileSnapshot,
      profileCompletion: profileSnapshot.profileCompletion,
      missingCriticalFields: profileSnapshot.missingCriticalFields,
      recentApplications,
      recentDocuments,
    };
  }),
});
