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

      // Replace experiences — handle both string and object formats from parser
      if (profileRecord[0]) {
        const profileId = profileRecord[0].id;
        await db.delete(experiences).where(eq(experiences.profileId, profileId)).catch(() => { });
        if (Array.isArray(data.experience) && (data.experience as unknown[]).length > 0) {
          type ExpItem = { company?: string; title?: string; role?: string; employer?: string; startDate?: string; endDate?: string; description?: string };
          const expItems = (data.experience as (string | ExpItem)[]).slice(0, 10).map((exp) => {
            if (typeof exp === 'string') {
              // Regex fallback: parse "Job Title at Company" or "Company - Job Title"
              const text = exp.trim();
              const atMatch = text.match(/^(.+?)\s+at\s+(.+?)(?:\s*\(([^)]+)\))?$/i);
              const dashMatch = text.match(/^(.+?)\s*[-–—]\s*(.+)$/);
              if (atMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  jobTitle: atMatch[1].trim() || 'Role',
                  employerName: atMatch[2].trim() || 'Company',
                  startDate: '',
                  endDate: null,
                  description: atMatch[3] ?? '',
                };
              }
              if (dashMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  employerName: dashMatch[1].trim() || 'Company',
                  jobTitle: dashMatch[2].trim() || 'Role',
                  startDate: '',
                  endDate: null,
                  description: '',
                };
              }
              // Skip unparseable strings — don't create junk "Unknown" entries
              return null;
            }
            const company = exp.company ?? exp.employer ?? '';
            const title = exp.title ?? exp.role ?? '';
            // Skip entries that are completely empty
            if (!company && !title) return null;
            return {
              id: randomUUID(),
              profileId,
              employerName: company || 'Unknown',
              jobTitle: title || 'Unknown',
              startDate: exp.startDate ?? '',
              endDate: exp.endDate ?? null,
              description: exp.description ?? '',
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          if (expItems.length > 0) {
            await db.insert(experiences).values(expItems).catch(() => { });
          }
        }

        // Replace educations — handle both string and object formats
        await db.delete(educations).where(eq(educations.profileId, profileId)).catch(() => { });
        if (Array.isArray(data.education) && (data.education as unknown[]).length > 0) {
          type EduItem = { school?: string; institution?: string; university?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string };
          const eduItems = (data.education as (string | EduItem)[]).slice(0, 10).map((edu) => {
            if (typeof edu === 'string') {
              const text = edu.trim();
              const commaMatch = text.match(/^(.+?)[,\-–—]\s*(.+)$/);
              if (commaMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  schoolName: commaMatch[1].trim() || 'School',
                  degree: commaMatch[2].trim().slice(0, 100) || 'Degree',
                  fieldOfStudy: null,
                  startDate: '',
                  endDate: null,
                };
              }
              // Skip unparseable strings
              return null;
            }
            const school = edu.school ?? edu.institution ?? edu.university ?? '';
            const degree = edu.degree ?? '';
            if (!school && !degree) return null;
            return {
              id: randomUUID(),
              profileId,
              schoolName: school || 'Unknown',
              degree: degree || 'Unknown',
              fieldOfStudy: edu.fieldOfStudy ?? edu.field ?? null,
              startDate: edu.startDate ?? '',
              endDate: edu.endDate ?? null,
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          if (eduItems.length > 0) {
            await db.insert(educations).values(eduItems).catch(() => { });
          }
        }
      }

      return { success: true, profileId: profileRecord[0]?.id };
    }),
});
