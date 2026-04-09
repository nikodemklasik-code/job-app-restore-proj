import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { cvUploads, profiles, skills, experiences, educations, users } from '../../db/schema.js';
import { parseCvFromFile } from '../../services/cvParser.js';

export const cvRouter = router({
  // Upload base64-encoded PDF, parse it, save result
  upload: publicProcedure
    .input(z.object({
      userId: z.string(),
      filename: z.string(),
      base64: z.string(), // base64-encoded file (PDF, DOCX, or TXT)
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const mimeType = input.mimeType ?? 'application/pdf';
      const parsed = await parseCvFromFile(input.base64, mimeType);

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
      if (!cvRow[0] || cvRow[0].userId !== userRecord[0].id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your CV' });
      }

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

      // Replace experiences
      if (profileRecord[0]) {
        const profileId = profileRecord[0].id;
        await db.delete(experiences).where(eq(experiences.profileId, profileId)).catch(() => {});
        if (Array.isArray(data.experience) && (data.experience as unknown[]).length > 0) {
          type ExpItem = { company?: string; title?: string; role?: string; startDate?: string; endDate?: string; description?: string };
          await db.insert(experiences).values(
            (data.experience as ExpItem[]).slice(0, 10).map((exp) => ({
              id: randomUUID(),
              profileId,
              employerName: exp.company ?? 'Unknown',
              jobTitle: exp.title ?? exp.role ?? 'Unknown',
              startDate: exp.startDate ?? '',
              endDate: exp.endDate ?? null,
              description: exp.description ?? '',
            }))
          ).catch(() => {});
        }

        // Replace educations
        await db.delete(educations).where(eq(educations.profileId, profileId)).catch(() => {});
        if (Array.isArray(data.education) && (data.education as unknown[]).length > 0) {
          type EduItem = { school?: string; institution?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string };
          await db.insert(educations).values(
            (data.education as EduItem[]).slice(0, 10).map((edu) => ({
              id: randomUUID(),
              profileId,
              schoolName: edu.school ?? edu.institution ?? 'Unknown',
              degree: edu.degree ?? 'Unknown',
              fieldOfStudy: edu.fieldOfStudy ?? edu.field ?? null,
              startDate: edu.startDate ?? '',
              endDate: edu.endDate ?? null,
            }))
          ).catch(() => {});
        }
      }

      return { success: true, profileId: profileRecord[0]?.id };
    }),
});
