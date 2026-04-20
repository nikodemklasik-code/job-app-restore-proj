import { randomUUID } from 'crypto';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { documentUploads, documents, documentTypeValues } from '../../db/schema.js';

// ─── Versioning tree helper ───────────────────────────────────────────────────

type DocumentNode = {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  parentDocumentId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  children: DocumentNode[];
};

export function buildLineageTree(rows: Array<Omit<DocumentNode, 'children'>>): DocumentNode[] {
  const map = new Map<string, DocumentNode>();
  const roots: DocumentNode[] = [];

  for (const row of rows) map.set(row.id, { ...row, children: [] });

  for (const node of map.values()) {
    if (node.parentDocumentId && map.has(node.parentDocumentId)) {
      map.get(node.parentDocumentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (items: DocumentNode[]) => {
    items.sort((a, b) => a.version - b.version || a.createdAt.getTime() - b.createdAt.getTime());
    for (const item of items) sortChildren(item.children);
  };
  sortChildren(roots);
  return roots;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const documentsRouter = router({
  // ── File uploads (existing) ────────────────────────────────────────────────

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(documentUploads)
      .where(eq(documentUploads.userId, ctx.user.id))
      .orderBy(documentUploads.createdAt);
  }),

  upload: protectedProcedure
    .input(z.object({
      documentType: z.enum(['cv', 'cover_letter', 'references', 'certificate', 'education', 'portfolio', 'session_memory', 'other']),
      originalFilename: z.string().max(255),
      extractedText: z.string().max(50000),
      sessionContext: z.enum(['coach', 'interview', 'negotiation']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      const encoded = Buffer.from(input.extractedText).toString('base64');
      await db.insert(documentUploads).values({
        id, userId: ctx.user.id, documentType: input.documentType,
        originalFilename: input.originalFilename, extractedTextEncrypted: encoded,
        parsedStructure: {}, autoFilledFields: [],
        sessionContext: input.sessionContext ?? null, isProcessed: false,
      });
      return { id, success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(documentUploads)
        .where(and(eq(documentUploads.id, input.id), eq(documentUploads.userId, ctx.user.id)));
      return { success: true };
    }),

  getText: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [doc] = await db.select().from(documentUploads)
        .where(and(eq(documentUploads.id, input.id), eq(documentUploads.userId, ctx.user.id)));
      if (!doc) throw new Error('Not found');
      const text = doc.extractedTextEncrypted
        ? Buffer.from(doc.extractedTextEncrypted, 'base64').toString('utf-8') : '';
      return { text, documentType: doc.documentType, filename: doc.originalFilename };
    }),

  // ── Versioned content documents ────────────────────────────────────────────

  listVersioned: protectedProcedure
    .input(z.object({ type: z.enum(documentTypeValues).optional() }))
    .query(async ({ ctx, input }) => {
      const where = input.type
        ? and(eq(documents.userId, ctx.user.id), eq(documents.type, input.type), isNull(documents.parentDocumentId))
        : and(eq(documents.userId, ctx.user.id), isNull(documents.parentDocumentId));
      return db.select().from(documents).where(where)
        .orderBy(desc(documents.updatedAt), desc(documents.createdAt));
    }),

  createRoot: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1).max(50000),
      type: z.enum(documentTypeValues),
    }))
    .output(z.object({ id: z.string(), version: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await db.insert(documents).values({ id, userId: ctx.user.id, title: input.title, content: input.content, type: input.type, version: 1 });
      return { id, version: 1 };
    }),

  createVersion: protectedProcedure
    .input(z.object({
      parentDocumentId: z.string().min(1),
      title: z.string().min(1).max(255),
      content: z.string().min(1).max(50000),
    }))
    .output(z.object({ id: z.string(), version: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [parent] = await db.select().from(documents)
        .where(and(eq(documents.id, input.parentDocumentId), eq(documents.userId, ctx.user.id))).limit(1);
      if (!parent) throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent document not found or access denied' });

      const allDocs = await db.select().from(documents).where(eq(documents.userId, ctx.user.id));
      const parentById = new Map(allDocs.map((r) => [r.id, r]));

      // Find max version across the entire lineage rooted at parent
      const lineageIds = new Set<string>();
      const queue = [parent.id];
      while (queue.length) {
        const cur = queue.pop()!;
        lineageIds.add(cur);
        for (const r of allDocs) if (r.parentDocumentId === cur) queue.push(r.id);
      }
      // Walk up to root
      let cursor: string | null = parent.parentDocumentId;
      while (cursor) {
        lineageIds.add(cursor);
        cursor = parentById.get(cursor)?.parentDocumentId ?? null;
      }

      const maxVersion = allDocs
        .filter((r) => lineageIds.has(r.id))
        .reduce((max, r) => Math.max(max, r.version), parent.version);

      const id = randomUUID();
      const version = maxVersion + 1;
      await db.insert(documents).values({ id, userId: ctx.user.id, title: input.title, content: input.content, type: parent.type, parentDocumentId: parent.id, version });
      return { id, version };
    }),

  getLineage: protectedProcedure
    .input(z.object({ rootDocumentId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [root] = await db.select().from(documents)
        .where(and(eq(documents.id, input.rootDocumentId), eq(documents.userId, ctx.user.id))).limit(1);
      if (!root) throw new TRPCError({ code: 'FORBIDDEN', message: 'Document not found or access denied' });

      const allDocs = await db.select().from(documents).where(eq(documents.userId, ctx.user.id))
        .orderBy(asc(documents.version), asc(documents.createdAt));
      const parentById = new Map(allDocs.map((r) => [r.id, r]));

      const included = allDocs.filter((row) => {
        if (row.id === input.rootDocumentId) return true;
        let c = row.parentDocumentId;
        while (c) {
          if (c === input.rootDocumentId) return true;
          c = parentById.get(c)?.parentDocumentId ?? null;
        }
        return false;
      });

      return buildLineageTree(included);
    }),

  updateVersioned: protectedProcedure
    .input(z.object({
      documentId: z.string().min(1),
      content: z.string().min(1).max(50000),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const [owned] = await db.select({ id: documents.id }).from(documents)
        .where(and(eq(documents.id, input.documentId), eq(documents.userId, ctx.user.id))).limit(1);
      if (!owned) throw new TRPCError({ code: 'FORBIDDEN', message: 'Document not found or access denied' });
      await db.update(documents).set({ content: input.content, updatedAt: new Date() })
        .where(and(eq(documents.id, input.documentId), eq(documents.userId, ctx.user.id)));
      return { success: true };
    }),
});
