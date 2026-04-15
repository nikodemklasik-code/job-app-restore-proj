import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { documentUploads } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const documentsRouter = router({
  // List user's documents
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(documentUploads)
      .where(eq(documentUploads.userId, ctx.user.id))
      .orderBy(documentUploads.createdAt);
  }),

  // Upload document (frontend sends extracted text — extraction happens client-side or via separate endpoint)
  upload: protectedProcedure
    .input(z.object({
      documentType: z.enum([
        'cv',
        'cover_letter',
        'references',
        'certificate',
        'education',
        'portfolio',
        'session_memory',
        'other',
      ]),
      originalFilename: z.string().max(255),
      extractedText: z.string().max(50000), // plain text extracted from document
      sessionContext: z.enum(['coach', 'interview', 'negotiation']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      // Simple XOR-style encoding as placeholder — replace with real AES-256 when ENCRYPTION_KEY is set
      const encoded = Buffer.from(input.extractedText).toString('base64');
      await db.insert(documentUploads).values({
        id,
        userId: ctx.user.id,
        documentType: input.documentType,
        originalFilename: input.originalFilename,
        extractedTextEncrypted: encoded,
        parsedStructure: {},
        autoFilledFields: [],
        sessionContext: input.sessionContext ?? null,
        isProcessed: false,
      });
      return { id, success: true };
    }),

  // Delete document
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(documentUploads)
        .where(and(eq(documentUploads.id, input.id), eq(documentUploads.userId, ctx.user.id)));
      return { success: true };
    }),

  // Get document text (for AI context)
  getText: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [doc] = await db.select().from(documentUploads)
        .where(and(eq(documentUploads.id, input.id), eq(documentUploads.userId, ctx.user.id)));
      if (!doc) throw new Error('Not found');
      const text = doc.extractedTextEncrypted
        ? Buffer.from(doc.extractedTextEncrypted, 'base64').toString('utf-8')
        : '';
      return { text, documentType: doc.documentType, filename: doc.originalFilename };
    }),
});
