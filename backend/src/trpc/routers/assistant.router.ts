import { randomUUID } from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  allowedAssistantSourceTypes,
  assistantModes,
  type AssistantContextRef,
} from '../../../../shared/assistant.js';
import { assistantConversations, assistantMessages } from '../../db/schema.js';
import { db } from '../../db/index.js';
import {
  assertAllowedAssistantSourceType,
  buildAssistantResponseMeta,
  generateCareerResponse,
  redactSensitiveText,
} from '../../services/openai.js';
import { getUserPlan, planToPromptBehaviorTier } from '../../services/billingGuard.js';
import { protectedProcedure, router } from '../trpc.js';

function inferModeFromText(text: string): (typeof assistantModes)[number] {
  const t = text.toLowerCase();
  if (/\b(cv|resume|cover letter|ats)\b/.test(t)) return 'cv';
  if (/\b(interview|star|mock)\b/.test(t)) return 'interview';
  if (/\b(salary|offer|negotiat|compensation)\b/.test(t)) return 'salary';
  return 'general';
}

function buildContextRefs(
  mode: (typeof assistantModes)[number],
  sourceType: (typeof allowedAssistantSourceTypes)[number],
): AssistantContextRef[] {
  const refs: AssistantContextRef[] = [
    { type: 'assistant', label: 'Mode', value: mode.toUpperCase() },
    { type: 'assistant', label: 'Source Type', value: sourceType.replace(/_/g, ' ') },
  ];
  if (sourceType === 'job_listing_table') {
    refs.push({ type: 'applications', label: 'Active Job Context', value: 'Job Listing Context Available' });
  }
  if (mode === 'cv') refs.push({ type: 'documents', label: 'Document Context', value: 'CV Improvement Focus' });
  if (mode === 'interview') refs.push({ type: 'skills', label: 'Practice Context', value: 'Interview Readiness Focus' });
  return refs;
}

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
    let lastMode: (typeof assistantModes)[number] = 'general';
    return rows.map((r) => {
      if (r.role === 'user') {
        lastUserText = r.text;
        lastMode = inferModeFromText(r.text);
        return { ...r, createdAt: r.createdAt.toISOString(), meta: null };
      }
      const baseMeta = buildAssistantResponseMeta(lastUserText || r.text);
      const inferredContext = buildContextRefs(lastMode, r.sourceType as (typeof allowedAssistantSourceTypes)[number]);
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        meta: {
          detectedIntent: baseMeta.detectedIntent,
          suggestedActions: baseMeta.suggestedActions,
          routeSuggestions: baseMeta.routeSuggestions,
          contextRefs: [...baseMeta.contextRefs, ...inferredContext].slice(0, 6),
          safetyNotes: baseMeta.safetyNotes,
          nextBestStep: baseMeta.nextBestStep ?? 'Open Coach',
          complianceFlags: baseMeta.complianceFlags ?? [],
        },
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
      const sourceType = assertAllowedAssistantSourceType(input.sourceType);
      const conversationId = await getOrCreateConversation(userId);
      const baseMeta = buildAssistantResponseMeta(input.text);
      const contextRefs = buildContextRefs(input.mode, sourceType);

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

      // Insert AI message
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

      const nextBestStep = baseMeta.nextBestStep ?? 'Open Coach';

      return {
        conversationId,
        userRecord: { ...userRecord, createdAt: userRecord.createdAt.toISOString() },
        aiRecord: {
          ...aiRecord,
          createdAt: aiRecord.createdAt.toISOString(),
          meta: {
            detectedIntent: baseMeta.detectedIntent,
            suggestedActions: baseMeta.suggestedActions,
            routeSuggestions: baseMeta.routeSuggestions,
            contextRefs: [...baseMeta.contextRefs, ...contextRefs].slice(0, 6),
            safetyNotes: baseMeta.safetyNotes,
            nextBestStep,
            complianceFlags: baseMeta.complianceFlags ?? [],
          },
        },
        structured: {
          conversation: aiTextWithSafety,
          relevantContext: [...baseMeta.contextRefs, ...contextRefs].slice(0, 6),
          suggestedActions: baseMeta.suggestedActions,
          nextBestStep,
          routeSuggestions: baseMeta.routeSuggestions,
          safetyNotes: baseMeta.safetyNotes,
        },
      };
    }),
});
