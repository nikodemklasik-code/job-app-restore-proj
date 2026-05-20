import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { cvUploads, profiles, skills, experiences, educations, trainings, users } from '../../db/schema.js';
import { parseCvFromFile } from '../../services/cvParser.js';

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeValue(value: string | null | undefined): string {
  return (value ?? '').trim();
}

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
        parsedText: parsed.rawText.slice(0, 20000),
        parsedData: {
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          headline: parsed.headline,
          location: parsed.location,
          linkedinUrl: parsed.linkedinUrl,
          summary: parsed.summary,
          skills: parsed.skills,
          experience: parsed.experience,
          education: parsed.education,
          trainings: parsed.trainings,
          languages: parsed.languages,
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

  previewImportToProfile: publicProcedure
    .input(z.object({ userId: z.string(), cvUploadId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const cvRow = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
      if (!cvRow[0] || cvRow[0].userId !== userRecord[0].id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your CV' });
      }

      const data = (cvRow[0].parsedData as Record<string, unknown>) ?? {};
      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = existingProfile[0] ?? null;

      const existingSkillRows = profile ? await db.select({ id: skills.id }).from(skills).where(eq(skills.profileId, profile.id)) : [];
      const existingExperienceRows = profile ? await db.select({ id: experiences.id }).from(experiences).where(eq(experiences.profileId, profile.id)) : [];
      const existingEducationRows = profile ? await db.select({ id: educations.id }).from(educations).where(eq(educations.profileId, profile.id)) : [];
      const existingTrainingRows = profile ? await db.select({ id: trainings.id }).from(trainings).where(eq(trainings.profileId, profile.id)) : [];

      const criticalFields = [
        {
          key: 'fullName',
          label: 'Full name',
          currentValue: normalizeValue(profile?.fullName),
          parsedValue: cleanText(data.fullName),
        },
        {
          key: 'email',
          label: 'Email',
          currentValue: normalizeValue(userRecord[0].email),
          parsedValue: cleanText(data.email),
        },
        {
          key: 'phone',
          label: 'Phone',
          currentValue: normalizeValue(profile?.phone),
          parsedValue: cleanText(data.phone),
        },
        {
          key: 'headline',
          label: 'Headline',
          currentValue: normalizeValue(profile?.headline),
          parsedValue: cleanText(data.headline),
        },
        {
          key: 'location',
          label: 'Location',
          currentValue: normalizeValue(profile?.location),
          parsedValue: cleanText(data.location),
        },
        {
          key: 'linkedinUrl',
          label: 'LinkedIn URL',
          currentValue: normalizeValue(profile?.linkedinUrl),
          parsedValue: cleanText(data.linkedinUrl),
        },
        {
          key: 'summary',
          label: 'Professional summary',
          currentValue: normalizeValue(profile?.summary),
          parsedValue: cleanText(data.summary),
        },
      ].map((field) => {
        const parsedHasValue = field.parsedValue.length > 0;
        const currentHasValue = field.currentValue.length > 0;
        const isDifferent = parsedHasValue && field.parsedValue !== field.currentValue;
        return {
          ...field,
          parsedHasValue,
          currentHasValue,
          isDifferent,
          willOverwrite: currentHasValue && isDifferent,
          willFillEmpty: !currentHasValue && parsedHasValue,
        };
      });

      const parsedSkills = Array.isArray(data.skills)
        ? (data.skills as unknown[]).map((value) => cleanText(value)).filter(Boolean)
        : [];
      const parsedExperiences = Array.isArray(data.experience) ? data.experience.length : 0;
      const parsedEducations = Array.isArray(data.education) ? data.education.length : 0;
      const parsedTrainings = Array.isArray(data.trainings) ? data.trainings.length : 0;

      const warnings: string[] = [];
      if (criticalFields.some((field) => field.willOverwrite)) {
        warnings.push('Critical profile fields will be overwritten if you import this CV. Review the differences first.');
      }
      if (!parsedSkills.length) {
        warnings.push('No skills were extracted from this CV. Import may still update text fields but will not enrich the skills section.');
      }
      if (!parsedExperiences && !parsedEducations && !parsedTrainings) {
        warnings.push('No structured career sections were extracted. This looks more like a text-only parse than a strong CV extraction.');
      }

      return {
        cvUploadId: cvRow[0].id,
        originalFilename: cvRow[0].originalFilename,
        createdAt: cvRow[0].createdAt,
        criticalFields,
        sections: {
          skills: {
            currentCount: existingSkillRows.length,
            parsedCount: parsedSkills.length,
            willReplace: parsedSkills.length > 0,
          },
          experiences: {
            currentCount: existingExperienceRows.length,
            parsedCount: parsedExperiences,
            willReplace: parsedExperiences > 0,
          },
          educations: {
            currentCount: existingEducationRows.length,
            parsedCount: parsedEducations,
            willReplace: parsedEducations > 0,
          },
          trainings: {
            currentCount: existingTrainingRows.length,
            parsedCount: parsedTrainings,
            willReplace: parsedTrainings > 0,
          },
        },
        warnings,
      };
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

      const parsedEmail = cleanText(data.email);
      const parsedFullName = cleanText(data.fullName);
      const parsedSummary = cleanText(data.summary);
      const parsedPhone = cleanText(data.phone);
      const parsedHeadline = cleanText(data.headline);
      const parsedLocation = cleanText(data.location);
      const parsedLinkedinUrl = cleanText(data.linkedinUrl);

      const existingProfile = await db.select({ id: profiles.id, fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);

      if (parsedEmail) {
        await db.update(users)
          .set({ email: parsedEmail, updatedAt: new Date() })
          .where(eq(users.id, userRecord[0].id));
      }

      if (existingProfile.length > 0) {
        await db.update(profiles).set({
          fullName: parsedFullName || existingProfile[0].fullName,
          summary: parsedSummary,
          phone: parsedPhone || null,
          headline: parsedHeadline || null,
          location: parsedLocation || null,
          linkedinUrl: parsedLinkedinUrl || null,
          updatedAt: new Date(),
        }).where(eq(profiles.userId, userRecord[0].id));
      } else {
        await db.insert(profiles).values({
          id: randomUUID(),
          userId: userRecord[0].id,
          fullName: parsedFullName,
          summary: parsedSummary,
          phone: parsedPhone || null,
          headline: parsedHeadline || null,
          location: parsedLocation || null,
          linkedinUrl: parsedLinkedinUrl || null,
        });
      }

      // Replace skills
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      if (profileRecord[0] && Array.isArray(data.skills) && (data.skills as unknown[]).length > 0) {
        await db.delete(skills).where(eq(skills.profileId, profileRecord[0].id));
        await db.insert(skills).values(
          (data.skills as string[])
            .map((name) => cleanText(name))
            .filter(Boolean)
            .slice(0, 30)
            .map((name) => ({ id: randomUUID(), profileId: profileRecord[0].id, name }))
        );
      }

      // Replace experiences — handle both string and object formats from parser
      if (profileRecord[0]) {
        const profileId = profileRecord[0].id;
        await db.delete(experiences).where(eq(experiences.profileId, profileId)).catch(() => { });
        if (Array.isArray(data.experience) && (data.experience as unknown[]).length > 0) {
          type ExpItem = { company?: string; title?: string; role?: string; employer?: string; startDate?: string; endDate?: string | null; description?: string };
          const expItems = (data.experience as (string | ExpItem)[]).slice(0, 10).map((exp) => {
            if (typeof exp === 'string') {
              const text = exp.trim();
              const atMatch = text.match(/^(.+?)\s+at\s+(.+?)(?:\s*\(([^)]+)\))?$/i);
              const dashMatch = text.match(/^(.+?)\s*[-–—]\s*(.+)$/);
              if (atMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  jobTitle: atMatch[1].trim(),
                  employerName: atMatch[2].trim(),
                  startDate: '',
                  endDate: null,
                  description: atMatch[3] ?? '',
                };
              }
              if (dashMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  employerName: dashMatch[1].trim(),
                  jobTitle: dashMatch[2].trim(),
                  startDate: '',
                  endDate: null,
                  description: '',
                };
              }
              return null;
            }
            const company = cleanText(exp.company) || cleanText(exp.employer);
            const title = cleanText(exp.title) || cleanText(exp.role);
            const description = cleanText(exp.description);
            if (!company && !title && !description) return null;
            return {
              id: randomUUID(),
              profileId,
              employerName: company,
              jobTitle: title,
              startDate: cleanText(exp.startDate),
              endDate: exp.endDate === null ? null : cleanText(exp.endDate) || null,
              description,
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          if (expItems.length > 0) {
            await db.insert(experiences).values(expItems).catch(() => { });
          }
        }

        // Replace educations — handle both string and object formats
        await db.delete(educations).where(eq(educations.profileId, profileId)).catch(() => { });
        if (Array.isArray(data.education) && (data.education as unknown[]).length > 0) {
          type EduItem = { school?: string; institution?: string; university?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string | null };
          const eduItems = (data.education as (string | EduItem)[]).slice(0, 10).map((edu) => {
            if (typeof edu === 'string') {
              const text = edu.trim();
              const commaMatch = text.match(/^(.+?)[,\-–—]\s*(.+)$/);
              if (commaMatch) {
                return {
                  id: randomUUID(),
                  profileId,
                  schoolName: commaMatch[1].trim(),
                  degree: commaMatch[2].trim().slice(0, 100),
                  fieldOfStudy: null,
                  startDate: '',
                  endDate: null,
                };
              }
              return null;
            }
            const school = cleanText(edu.school) || cleanText(edu.institution) || cleanText(edu.university);
            const degree = cleanText(edu.degree);
            const fieldOfStudy = cleanText(edu.fieldOfStudy) || cleanText(edu.field);
            if (!school && !degree && !fieldOfStudy) return null;
            return {
              id: randomUUID(),
              profileId,
              schoolName: school,
              degree,
              fieldOfStudy: fieldOfStudy || null,
              startDate: cleanText(edu.startDate),
              endDate: edu.endDate === null ? null : cleanText(edu.endDate) || null,
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          if (eduItems.length > 0) {
            await db.insert(educations).values(eduItems).catch(() => { });
          }
        }

        // Replace trainings when parser extracted them
        await db.delete(trainings).where(eq(trainings.profileId, profileId)).catch(() => { });
        if (Array.isArray(data.trainings) && (data.trainings as unknown[]).length > 0) {
          type TrainingItem = { title?: string; providerName?: string; issuedAt?: string; expiresAt?: string | null; credentialUrl?: string };
          const trainingItems = (data.trainings as TrainingItem[]).slice(0, 10).map((training) => {
            const title = cleanText(training.title);
            const providerName = cleanText(training.providerName);
            if (!title && !providerName) return null;
            return {
              id: randomUUID(),
              profileId,
              title,
              providerName,
              issuedAt: cleanText(training.issuedAt),
              expiresAt: training.expiresAt === null ? null : cleanText(training.expiresAt) || null,
              credentialUrl: cleanText(training.credentialUrl),
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          if (trainingItems.length > 0) {
            await db.insert(trainings).values(trainingItems).catch(() => { });
          }
        }
      }

      return { success: true, profileId: profileRecord[0]?.id };
    }),
});
