import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { cvUploads, profiles, skills, experiences, educations, trainings, users, careerGoals } from '../../db/schema.js';
import { parseCvFromFile } from '../../services/cvParser.js';

const PERSONAL_FIELDS = ['fullName', 'email', 'phone', 'headline', 'location', 'linkedinUrl', 'summary'] as const;
type PersonalFieldKey = typeof PERSONAL_FIELDS[number];
type SectionKey = 'skills' | 'experiences' | 'educations' | 'trainings';

type ParsedExperience = {
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  description: string;
};

type ParsedEducation = {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
};

type ParsedTraining = {
  title: string;
  providerName: string;
  issuedAt: string;
  expiresAt: string | null;
  credentialUrl: string;
};

type ParsedExperienceInsert = ParsedExperience & { id: string; profileId: string };
type ParsedEducationInsert = ParsedEducation & { id: string; profileId: string };
type ParsedTrainingInsert = ParsedTraining & { id: string; profileId: string };

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeValue(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => cleanText(value)).filter(Boolean);
}

function parseExperienceItems(values: unknown, profileId: string): ParsedExperienceInsert[] {
  if (!Array.isArray(values)) return [];
  type ExpItem = { company?: string; title?: string; role?: string; employer?: string; startDate?: string; endDate?: string | null; description?: string };
  const mapped: Array<ParsedExperienceInsert | null> = (values as (string | ExpItem)[]).slice(0, 10).map((exp) => {
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
  });
  return mapped.filter((item): item is ParsedExperienceInsert => item !== null);
}

function parseEducationItems(values: unknown, profileId: string): ParsedEducationInsert[] {
  if (!Array.isArray(values)) return [];
  type EduItem = { school?: string; institution?: string; university?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string | null };
  const mapped: Array<ParsedEducationInsert | null> = (values as (string | EduItem)[]).slice(0, 10).map((edu) => {
    if (typeof edu === 'string') {
      const text = edu.trim();
      const commaMatch = text.match(/^(.+?)[,\-–—]\s*(.+)$/);
      if (!commaMatch) return null;
      return {
        id: randomUUID(),
        profileId,
        schoolName: commaMatch[1].trim(),
        degree: commaMatch[2].trim().slice(0, 100),
        fieldOfStudy: '',
        startDate: '',
        endDate: null,
      };
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
      fieldOfStudy,
      startDate: cleanText(edu.startDate),
      endDate: edu.endDate === null ? null : cleanText(edu.endDate) || null,
    };
  });
  return mapped.filter((item): item is ParsedEducationInsert => item !== null);
}

function parseTrainingItems(values: unknown, profileId: string): ParsedTrainingInsert[] {
  if (!Array.isArray(values)) return [];
  type TrainingItem = { title?: string; providerName?: string; issuedAt?: string; expiresAt?: string | null; credentialUrl?: string };
  const mapped: Array<ParsedTrainingInsert | null> = (values as TrainingItem[]).slice(0, 10).map((training) => {
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
  });
  return mapped.filter((item): item is ParsedTrainingInsert => item !== null);
}

function summarizeExperience(item: { employerName?: string; jobTitle?: string; description?: string | null }): string {
  return [item.jobTitle, item.employerName].map(cleanText).filter(Boolean).join(' at ') || cleanText(item.description) || 'Untitled Experience';
}

function summarizeEducation(item: { schoolName?: string; degree?: string; fieldOfStudy?: string | null }): string {
  return [item.degree, item.fieldOfStudy, item.schoolName].map(cleanText).filter(Boolean).join(' · ') || 'Untitled Education';
}

function summarizeTraining(item: { title?: string; providerName?: string }): string {
  return [item.title, item.providerName].map(cleanText).filter(Boolean).join(' · ') || 'Untitled Training';
}

const importDecisionsSchema = z.object({
  acceptedPersonalFields: z.array(z.enum(PERSONAL_FIELDS)).default([]),
  acceptedSections: z.object({
    skills: z.boolean().default(false),
    experiences: z.boolean().default(false),
    educations: z.boolean().default(false),
    trainings: z.boolean().default(false),
  }).default({}),
  reviewed: z.literal(true),
});

function acceptedSection(decisions: z.infer<typeof importDecisionsSchema>, section: SectionKey): boolean {
  return decisions.acceptedSections[section] === true;
}

async function markCvImportProvenance(userId: string, cvUploadId: string, acceptedFields: string[], acceptedSections: string[]): Promise<void> {
  if (acceptedFields.length === 0 && acceptedSections.length === 0) return;
  const row = await db.select().from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  const current = row[0];
  const previous = current?.strategyJson && typeof current.strategyJson === 'object' && !Array.isArray(current.strategyJson)
    ? current.strategyJson as Record<string, unknown>
    : {};
  const existingProvenance = previous.profileProvenance && typeof previous.profileProvenance === 'object' && !Array.isArray(previous.profileProvenance)
    ? previous.profileProvenance as Record<string, unknown>
    : {};
  const stamp = {
    source: 'imported_from_cv',
    updatedAt: new Date().toISOString(),
    note: `Approved CV import ${cvUploadId}`,
  };
  const nextProvenance: Record<string, unknown> = { ...existingProvenance };
  for (const field of acceptedFields) nextProvenance[`personalInfo.${field}`] = stamp;
  for (const section of acceptedSections) nextProvenance[section] = stamp;
  const nextStrategy = { ...previous, profileProvenance: nextProvenance };
  if (current) {
    await db.update(careerGoals).set({ strategyJson: nextStrategy }).where(eq(careerGoals.userId, userId));
  } else {
    await db.insert(careerGoals).values({ id: randomUUID(), userId, autoApplyMinScore: 75, strategyJson: nextStrategy });
  }
}

export const cvRouter = router({
  upload: publicProcedure
    .input(z.object({
      userId: z.string(),
      filename: z.string(),
      base64: z.string(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const parsed = await parseCvFromFile(input.base64, input.mimeType ?? 'application/pdf');
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
      if (!userRecord[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const cvRow = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
      if (!cvRow[0] || cvRow[0].userId !== userRecord[0].id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your CV' });

      const data = (cvRow[0].parsedData as Record<string, unknown>) ?? {};
      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = existingProfile[0] ?? null;
      const profileIdForPreview = profile?.id ?? '__new_profile__';

      const existingSkillRows = profile ? await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id)) : [];
      const existingExperienceRows = profile ? await db.select().from(experiences).where(eq(experiences.profileId, profile.id)) : [];
      const existingEducationRows = profile ? await db.select().from(educations).where(eq(educations.profileId, profile.id)) : [];
      const existingTrainingRows = profile ? await db.select().from(trainings).where(eq(trainings.profileId, profile.id)) : [];

      const criticalFields = [
        { key: 'fullName', label: 'Full name', currentValue: normalizeValue(profile?.fullName), parsedValue: cleanText(data.fullName) },
        { key: 'email', label: 'Email', currentValue: normalizeValue(userRecord[0].email), parsedValue: cleanText(data.email) },
        { key: 'phone', label: 'Phone', currentValue: normalizeValue(profile?.phone), parsedValue: cleanText(data.phone) },
        { key: 'headline', label: 'Headline', currentValue: normalizeValue(profile?.headline), parsedValue: cleanText(data.headline) },
        { key: 'location', label: 'Location', currentValue: normalizeValue(profile?.location), parsedValue: cleanText(data.location) },
        { key: 'linkedinUrl', label: 'LinkedIn URL', currentValue: normalizeValue(profile?.linkedinUrl), parsedValue: cleanText(data.linkedinUrl) },
        { key: 'summary', label: 'Professional summary', currentValue: normalizeValue(profile?.summary), parsedValue: cleanText(data.summary) },
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
          action: currentHasValue && isDifferent ? 'overwrite' : !currentHasValue && parsedHasValue ? 'fill_empty' : isDifferent ? 'parsed_diff' : 'no_change',
        };
      });

      const parsedSkills = normalizeList(data.skills).slice(0, 30);
      const parsedExperiences = parseExperienceItems(data.experience, profileIdForPreview);
      const parsedEducations = parseEducationItems(data.education, profileIdForPreview);
      const parsedTrainings = parseTrainingItems(data.trainings, profileIdForPreview);

      const warnings: string[] = [];
      if (criticalFields.some((field) => field.willOverwrite)) warnings.push('Critical profile fields will be overwritten only if explicitly approved in this review.');
      if (!parsedSkills.length) warnings.push('No skills were extracted from this CV.');
      if (!parsedExperiences.length && !parsedEducations.length && !parsedTrainings.length) warnings.push('No structured career sections were extracted.');

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
            currentItems: existingSkillRows.map((row) => row.name),
            parsedItems: parsedSkills,
          },
          experiences: {
            currentCount: existingExperienceRows.length,
            parsedCount: parsedExperiences.length,
            willReplace: parsedExperiences.length > 0,
            currentItems: existingExperienceRows.map((row) => ({ id: row.id, label: summarizeExperience(row), employerName: row.employerName, jobTitle: row.jobTitle, startDate: row.startDate, endDate: row.endDate ?? null, description: row.description ?? '' })),
            parsedItems: parsedExperiences.map((row) => ({ label: summarizeExperience(row), employerName: row.employerName, jobTitle: row.jobTitle, startDate: row.startDate, endDate: row.endDate, description: row.description })),
          },
          educations: {
            currentCount: existingEducationRows.length,
            parsedCount: parsedEducations.length,
            willReplace: parsedEducations.length > 0,
            currentItems: existingEducationRows.map((row) => ({ id: row.id, label: summarizeEducation(row), schoolName: row.schoolName, degree: row.degree, fieldOfStudy: row.fieldOfStudy ?? '', startDate: row.startDate, endDate: row.endDate ?? null })),
            parsedItems: parsedEducations.map((row) => ({ label: summarizeEducation(row), schoolName: row.schoolName, degree: row.degree, fieldOfStudy: row.fieldOfStudy, startDate: row.startDate, endDate: row.endDate })),
          },
          trainings: {
            currentCount: existingTrainingRows.length,
            parsedCount: parsedTrainings.length,
            willReplace: parsedTrainings.length > 0,
            currentItems: existingTrainingRows.map((row) => ({ id: row.id, label: summarizeTraining(row), title: row.title, providerName: row.providerName, issuedAt: row.issuedAt, expiresAt: row.expiresAt ?? null, credentialUrl: row.credentialUrl ?? '' })),
            parsedItems: parsedTrainings.map((row) => ({ label: summarizeTraining(row), title: row.title, providerName: row.providerName, issuedAt: row.issuedAt, expiresAt: row.expiresAt, credentialUrl: row.credentialUrl })),
          },
        },
        warnings,
      };
    }),

  importToProfile: publicProcedure
    .input(z.object({ userId: z.string(), cvUploadId: z.string(), decisions: importDecisionsSchema }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return { success: false };

      const cvRow = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
      if (!cvRow[0] || cvRow[0].userId !== userRecord[0].id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your CV' });

      const data = cvRow[0].parsedData as Record<string, unknown>;
      if (!data) return { success: false };

      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      let profileId = existingProfile[0]?.id;
      if (!profileId) {
        profileId = randomUUID();
        await db.insert(profiles).values({ id: profileId, userId: userRecord[0].id, fullName: '' });
      }

      const acceptedFields = new Set<PersonalFieldKey>(input.decisions.acceptedPersonalFields);
      const appliedPersonalFields: string[] = [];
      const profilePatch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
      const fieldMap = {
        fullName: cleanText(data.fullName),
        phone: cleanText(data.phone),
        headline: cleanText(data.headline),
        location: cleanText(data.location),
        linkedinUrl: cleanText(data.linkedinUrl),
        summary: cleanText(data.summary),
      } satisfies Record<string, string>;

      for (const [key, value] of Object.entries(fieldMap)) {
        if (!acceptedFields.has(key as PersonalFieldKey) || !value) continue;
        (profilePatch as Record<string, unknown>)[key] = value;
        appliedPersonalFields.push(key);
      }

      if (acceptedFields.has('email')) {
        const parsedEmail = cleanText(data.email);
        if (parsedEmail) {
          await db.update(users).set({ email: parsedEmail, updatedAt: new Date() }).where(eq(users.id, userRecord[0].id));
          appliedPersonalFields.push('email');
        }
      }

      await db.update(profiles).set(profilePatch).where(eq(profiles.id, profileId));

      const acceptedSectionsForProvenance: string[] = [];
      if (acceptedSection(input.decisions, 'skills')) {
        const parsedSkills = normalizeList(data.skills).slice(0, 30);
        if (parsedSkills.length > 0) {
          await db.delete(skills).where(eq(skills.profileId, profileId));
          await db.insert(skills).values(parsedSkills.map((name) => ({ id: randomUUID(), profileId, name })));
          acceptedSectionsForProvenance.push('skills');
        }
      }

      if (acceptedSection(input.decisions, 'experiences')) {
        const expItems = parseExperienceItems(data.experience, profileId);
        if (expItems.length > 0) {
          await db.delete(experiences).where(eq(experiences.profileId, profileId));
          await db.insert(experiences).values(expItems);
          acceptedSectionsForProvenance.push('experiences');
        }
      }

      if (acceptedSection(input.decisions, 'educations')) {
        const eduItems = parseEducationItems(data.education, profileId);
        if (eduItems.length > 0) {
          await db.delete(educations).where(eq(educations.profileId, profileId));
          await db.insert(educations).values(eduItems);
          acceptedSectionsForProvenance.push('educations');
        }
      }

      if (acceptedSection(input.decisions, 'trainings')) {
        const trainingItems = parseTrainingItems(data.trainings, profileId);
        if (trainingItems.length > 0) {
          await db.delete(trainings).where(eq(trainings.profileId, profileId));
          await db.insert(trainings).values(trainingItems);
          acceptedSectionsForProvenance.push('trainings');
        }
      }

      await markCvImportProvenance(userRecord[0].id, cvRow[0].id, appliedPersonalFields, acceptedSectionsForProvenance);

      return {
        success: true,
        profileId,
        applied: {
          personalFields: appliedPersonalFields,
          sections: acceptedSectionsForProvenance,
        },
      };
    }),
});
