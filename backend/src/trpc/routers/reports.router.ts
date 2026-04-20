import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { reports, reportSourceValues, reportStatusValues } from '../../db/schema.js';

const reportSourceSchema = z.enum(reportSourceValues);
const reportStatusSchema = z.enum(reportStatusValues);

const reportRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  source: reportSourceSchema,
  status: reportStatusSchema,
  sourceReferenceId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

function mapRow(row: typeof reports.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: row.content,
    source: row.source as z.infer<typeof reportSourceSchema>,
    status: row.status as z.infer<typeof reportStatusSchema>,
    sourceReferenceId: row.sourceReferenceId ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildCreateReport(params: {
  userId: string;
  title: string;
  content: string;
  source: z.infer<typeof reportSourceSchema>;
  sourceReferenceId?: string;
}) {
  return {
    id: randomUUID(),
    userId: params.userId,
    title: params.title,
    content: params.content,
    source: params.source,
    status: 'open' as const,
    sourceReferenceId: params.sourceReferenceId ?? null,
  };
}

export const reportsRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: reportStatusSchema.optional(),
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
    }))
    .output(z.object({
      items: z.array(reportRowSchema),
      total: z.number().int(),
      page: z.number().int(),
      pageSize: z.number().int(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const where = input.status
        ? and(eq(reports.userId, ctx.user.id), eq(reports.status, input.status))
        : eq(reports.userId, ctx.user.id);

      const [items, countRows] = await Promise.all([
        db.select().from(reports).where(where)
          .orderBy(desc(reports.updatedAt), desc(reports.createdAt))
          .limit(input.pageSize).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(reports).where(where),
      ]);

      return {
        items: items.map(mapRow),
        total: Number(countRows[0]?.count ?? 0),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1).max(20000),
      source: reportSourceSchema,
      sourceReferenceId: z.string().max(36).optional(),
    }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = buildCreateReport({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        source: input.source,
        sourceReferenceId: input.sourceReferenceId,
      });
      await db.insert(reports).values(row);
      return { id: row.id };
    }),

  close: protectedProcedure
    .input(z.object({ reportId: z.string().min(1) }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const [owned] = await db.select({ id: reports.id }).from(reports)
        .where(and(eq(reports.id, input.reportId), eq(reports.userId, ctx.user.id))).limit(1);
      if (!owned) throw new TRPCError({ code: 'FORBIDDEN', message: 'Report not found or access denied' });
      await db.update(reports).set({ status: 'closed', updatedAt: new Date() })
        .where(and(eq(reports.id, input.reportId), eq(reports.userId, ctx.user.id)));
      return { success: true };
    }),

  reopen: protectedProcedure
    .input(z.object({ reportId: z.string().min(1) }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const [owned] = await db.select({ id: reports.id }).from(reports)
        .where(and(eq(reports.id, input.reportId), eq(reports.userId, ctx.user.id))).limit(1);
      if (!owned) throw new TRPCError({ code: 'FORBIDDEN', message: 'Report not found or access denied' });
      await db.update(reports).set({ status: 'open', updatedAt: new Date() })
        .where(and(eq(reports.id, input.reportId), eq(reports.userId, ctx.user.id)));
      return { success: true };
    }),
});
