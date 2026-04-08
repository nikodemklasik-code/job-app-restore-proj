import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { cvUploads, profiles, skills, users } from '../../db/schema.js';
import { parseCvPdf } from '../../services/cvParser.js';

export const cvRouter = router({
  // Upload base64-encoded PDF, parse it, save result
  upload: publicProcedure
    .input(z.object({
      userId: z.string(),
      filename: z.string(),
      base64: z.string(), // base64-encoded PDF
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const buffer = Buffer.from(input.base64, 'base64');
      const parsed = await parseCvPdf(buffer);

      const id = randomUUID();
      await db.insert(cvUploads).values({
        id,
        userId: userRecord[0].id,
        originalFilename: input.filename,
        parsedText: parsed.rawText.slice(0, 10000),
        parsedData: {
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          summary: parsed.summary,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
        },
      });

      return { id, parsed };
    }),

  getLatest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return null;

      const rows = await db.select().from(cvUploads)
        .where(eq(cvUploads.userId, userRecord[0].id))
        .orderBy(desc(cvUploads.createdAt))
        .limit(1);

      return rows[0] ?? null;
    }),

  // Import parsed CV data into user profile
  importToProfile: publicProcedure
    .input(z.object({ userId: z.string(), cvUploadId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return { success: false };

      const cvRow = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
      if (!cvRow[0]) return { success: false };

      const data = cvRow[0].parsedData as Record<string, unknown>;
      if (!data) return { success: false };

      const existingProfile = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);

      if (existingProfile.length > 0) {
        await db.update(profiles).set({
          fullName: String(data.fullName ?? ''),
          summary: String(data.summary ?? ''),
          updatedAt: new Date(),
        }).where(eq(profiles.userId, userRecord[0].id));
      } else {
        await db.insert(profiles).values({
          id: randomUUID(),
          userId: userRecord[0].id,
          fullName: String(data.fullName ?? ''),
          summary: String(data.summary ?? ''),
        });
      }

      // Replace skills
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      if (profileRecord[0] && Array.isArray(data.skills) && (data.skills as unknown[]).length > 0) {
        await db.delete(skills).where(eq(skills.profileId, profileRecord[0].id));
        await db.insert(skills).values(
          (data.skills as string[]).slice(0, 30).map((name) => ({ id: randomUUID(), profileId: profileRecord[0].id, name }))
        );
      }

      return { success: true, profileId: profileRecord[0]?.id };
    }),
});
