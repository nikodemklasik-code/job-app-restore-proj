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
type Uuid = ReturnType<typeof randomUUID>;

type SkillRow = typeof skills.$inferSelect;
type ExperienceRow = typeof experiences.$inferSelect;
type EducationRow = typeof educations.$inferSelect;
type TrainingRow = typeof trainings.$inferSelect;

type ParsedExperience = { employerName: string; jobTitle: string; startDate: string; endDate: string | null; description: string };
type ParsedEducation = { schoolName: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string | null };
type ParsedTraining = { title: string; providerName: string; issuedAt: string; expiresAt: string | null; credentialUrl: string };

type ExperienceInsert = ParsedExperience & { id: Uuid; profileId: string };
type EducationInsert = ParsedEducation & { id: Uuid; profileId: string };
type TrainingInsert = ParsedTraining & { id: Uuid; profileId: string };

function cleanText(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function normalizeValue(value: string | null | undefined): string { return (value ?? '').trim(); }
function normalizeList(values: unknown): string[] { return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : []; }

function parseExperienceItems(values: unknown, profileId: string): ExperienceInsert[] {
  if (!Array.isArray(values)) return [];
  type ExpItem = { company?: string; title?: string; role?: string; employer?: string; startDate?: string; endDate?: string | null; description?: string };
  return (values as ExpItem[]).slice(0, 10).map((exp) => {
    const employerName = cleanText(exp.company) || cleanText(exp.employer);
    const jobTitle = cleanText(exp.title) || cleanText(exp.role);
    const description = cleanText(exp.description);
    if (!employerName && !jobTitle && !description) return null;
    return { id: randomUUID(), profileId, employerName, jobTitle, startDate: cleanText(exp.startDate), endDate: exp.endDate === null ? null : cleanText(exp.endDate) || null, description };
  }).filter((item): item is ExperienceInsert => item !== null);
}

function parseEducationItems(values: unknown, profileId: string): EducationInsert[] {
  if (!Array.isArray(values)) return [];
  type EduItem = { school?: string; institution?: string; university?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string | null };
  return (values as EduItem[]).slice(0, 10).map((edu) => {
    const schoolName = cleanText(edu.school) || cleanText(edu.institution) || cleanText(edu.university);
    const degree = cleanText(edu.degree);
    const fieldOfStudy = cleanText(edu.fieldOfStudy) || cleanText(edu.field);
    if (!schoolName && !degree && !fieldOfStudy) return null;
    return { id: randomUUID(), profileId, schoolName, degree, fieldOfStudy, startDate: cleanText(edu.startDate), endDate: edu.endDate === null ? null : cleanText(edu.endDate) || null };
  }).filter((item): item is EducationInsert => item !== null);
}

function parseTrainingItems(values: unknown, profileId: string): TrainingInsert[] {
  if (!Array.isArray(values)) return [];
  type TrainingItem = { title?: string; providerName?: string; issuedAt?: string; expiresAt?: string | null; credentialUrl?: string };
  return (values as TrainingItem[]).slice(0, 10).map((training) => {
    const title = cleanText(training.title);
    const providerName = cleanText(training.providerName);
    if (!title && !providerName) return null;
    return { id: randomUUID(), profileId, title, providerName, issuedAt: cleanText(training.issuedAt), expiresAt: training.expiresAt === null ? null : cleanText(training.expiresAt) || null, credentialUrl: cleanText(training.credentialUrl) };
  }).filter((item): item is TrainingInsert => item !== null);
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
  acceptedSections: z.object({ skills: z.boolean().default(false), experiences: z.boolean().default(false), educations: z.boolean().default(false), trainings: z.boolean().default(false) }).default({}),
  reviewed: z.literal(true),
});

function acceptedSection(decisions: z.infer<typeof importDecisionsSchema>, section: SectionKey): boolean { return decisions.acceptedSections[section] === true; }

async function markCvImportProvenance(userId: string, cvUploadId: string, acceptedFields: string[], acceptedSections: string[]): Promise<void> {
  if (acceptedFields.length === 0 && acceptedSections.length === 0) return;
  const row = await db.select().from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  const current = row[0];
  const previous = current?.strategyJson && typeof current.strategyJson === 'object' && !Array.isArray(current.strategyJson) ? current.strategyJson as Record<string, unknown> : {};
  const existingProvenance = previous.profileProvenance && typeof previous.profileProvenance === 'object' && !Array.isArray(previous.profileProvenance) ? previous.profileProvenance as Record<string, unknown> : {};
  const stamp = { source: 'imported_from_cv', updatedAt: new Date().toISOString(), note: `Approved CV import ${cvUploadId}` };
  const nextProvenance: Record<string, unknown> = { ...existingProvenance };
  for (const field of acceptedFields) nextProvenance[`personalInfo.${field}`] = stamp;
  for (const section of acceptedSections) nextProvenance[section] = stamp;
  const nextStrategy = { ...previous, profileProvenance: nextProvenance };
  if (current) await db.update(careerGoals).set({ strategyJson: nextStrategy }).where(eq(careerGoals.userId, userId));
  else await db.insert(careerGoals).values({ id: randomUUID(), userId, autoApplyMinScore: 75, strategyJson: nextStrategy });
}

async function ensureProfileId(userId: string): Promise<string> {
  const profileRows = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (profileRows[0]) return profileRows[0].id;
  const profileId = randomUUID();
  await db.insert(profiles).values({ id: profileId, userId, fullName: '', createdAt: new Date(), updatedAt: new Date() });
  return profileId;
}

export const cvRouter = router({
  upload: publicProcedure.input(z.object({ userId: z.string(), filename: z.string(), base64: z.string(), mimeType: z.string().optional() })).mutation(async ({ input }) => {
    const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
    if (!userRecord[0]) throw new Error('User not found');
    const parsed = await parseCvFromFile(input.base64, input.mimeType ?? 'application/pdf');
    const id = randomUUID();
    await db.insert(cvUploads).values({
      id,
      userId: userRecord[0].id,
      originalFilename: input.filename,
      parsedText: parsed.rawText.slice(0, 20000),
      parsedData: { fullName: parsed.fullName, email: parsed.email, phone: parsed.phone, headline: parsed.headline, location: parsed.location, linkedinUrl: parsed.linkedinUrl, summary: parsed.summary, skills: parsed.skills, experience: parsed.experience, education: parsed.education, trainings: parsed.trainings, languages: parsed.languages },
    });
    return { id, parsed };
  }),

  getLatest: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
    if (!userRecord[0]) return null;
    const rows = await db.select().from(cvUploads).where(eq(cvUploads.userId, userRecord[0].id)).orderBy(desc(cvUploads.createdAt)).limit(1);
    return rows[0] ?? null;
  }),

  previewImportToProfile: publicProcedure.input(z.object({ userId: z.string(), cvUploadId: z.string() })).query(async ({ input }) => {
    const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
    if (!userRecord[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    const uploadRows = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
    const upload = uploadRows[0];
    if (!upload || upload.userId !== userRecord[0].id) throw new TRPCError({ code: 'NOT_FOUND', message: 'CV upload not found' });

    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
    const profile = profileRows[0] ?? null;
    let skillRows: SkillRow[] = [];
    let expRows: ExperienceRow[] = [];
    let eduRows: EducationRow[] = [];
    let trainingRows: TrainingRow[] = [];
    if (profile) {
      [skillRows, expRows, eduRows, trainingRows] = await Promise.all([
        db.select().from(skills).where(eq(skills.profileId, profile.id)).orderBy(desc(skills.createdAt)),
        db.select().from(experiences).where(eq(experiences.profileId, profile.id)).orderBy(desc(experiences.createdAt)),
        db.select().from(educations).where(eq(educations.profileId, profile.id)).orderBy(desc(educations.createdAt)),
        db.select().from(trainings).where(eq(trainings.profileId, profile.id)).orderBy(desc(trainings.createdAt)),
      ]);
    }

    const parsedData = upload.parsedData && typeof upload.parsedData === 'object' && !Array.isArray(upload.parsedData) ? upload.parsedData as Record<string, unknown> : {};
    const criticalFields = PERSONAL_FIELDS.map((key) => {
      const currentValue = key === 'email' ? normalizeValue(userRecord[0].email ?? '') : normalizeValue((profile?.[key] as string | null | undefined) ?? '');
      const parsedValue = normalizeValue((parsedData[key] as string | null | undefined) ?? '');
      const currentHasValue = currentValue.length > 0;
      const parsedHasValue = parsedValue.length > 0;
      const isDifferent = parsedValue !== currentValue;
      return { key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()), currentValue, parsedValue, parsedHasValue, currentHasValue, isDifferent, willOverwrite: currentHasValue && parsedHasValue && isDifferent, willFillEmpty: !currentHasValue && parsedHasValue, action: !parsedHasValue ? 'no_change' : currentHasValue && parsedHasValue && isDifferent ? 'overwrite' : !currentHasValue && parsedHasValue ? 'fill_empty' : isDifferent ? 'parsed_diff' : 'no_change' };
    });

    const parsedSkills = normalizeList(parsedData.skills);
    const currentSkills = skillRows.map((row) => row.name).filter(Boolean);
    const parsedExperiences = parseExperienceItems(parsedData.experience, profile?.id ?? 'preview-only');
    const parsedEducations = parseEducationItems(parsedData.education, profile?.id ?? 'preview-only');
    const parsedTrainings = parseTrainingItems(parsedData.trainings, profile?.id ?? 'preview-only');

    return {
      cvUploadId: upload.id,
      originalFilename: upload.originalFilename,
      createdAt: upload.createdAt,
      criticalFields,
      sections: {
        skills: { currentCount: currentSkills.length, parsedCount: parsedSkills.length, willReplace: parsedSkills.length > 0, currentItems: currentSkills, parsedItems: parsedSkills },
        experiences: { currentCount: expRows.length, parsedCount: parsedExperiences.length, willReplace: parsedExperiences.length > 0, currentItems: expRows.map(summarizeExperience), parsedItems: parsedExperiences.map(summarizeExperience) },
        educations: { currentCount: eduRows.length, parsedCount: parsedEducations.length, willReplace: parsedEducations.length > 0, currentItems: eduRows.map(summarizeEducation), parsedItems: parsedEducations.map(summarizeEducation) },
        trainings: { currentCount: trainingRows.length, parsedCount: parsedTrainings.length, willReplace: parsedTrainings.length > 0, currentItems: trainingRows.map(summarizeTraining), parsedItems: parsedTrainings.map(summarizeTraining) },
      },
      warnings: [
        ...criticalFields.filter((field) => field.willOverwrite).map((field) => `${field.label} differs from approved profile and needs explicit approval.`),
        ...(parsedSkills.length > 0 && currentSkills.length > 0 ? ['Approving skills will replace the current approved skills list.'] : []),
        ...(parsedExperiences.length > 0 && expRows.length > 0 ? ['Approving experience will replace the current approved experience section.'] : []),
        ...(parsedEducations.length > 0 && eduRows.length > 0 ? ['Approving education will replace the current approved education section.'] : []),
        ...(parsedTrainings.length > 0 && trainingRows.length > 0 ? ['Approving training will replace the current approved training section.'] : []),
      ],
    };
  }),

  importToProfile: publicProcedure.input(z.object({ userId: z.string(), cvUploadId: z.string(), decisions: importDecisionsSchema })).mutation(async ({ input }) => {
    const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
    if (!userRecord[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    const uploadRows = await db.select().from(cvUploads).where(eq(cvUploads.id, input.cvUploadId)).limit(1);
    const upload = uploadRows[0];
    if (!upload || upload.userId !== userRecord[0].id) throw new TRPCError({ code: 'NOT_FOUND', message: 'CV upload not found' });

    const parsedData = upload.parsedData && typeof upload.parsedData === 'object' && !Array.isArray(upload.parsedData) ? upload.parsedData as Record<string, unknown> : {};
    const decisions = input.decisions;
    const acceptedPersonalFields = new Set<PersonalFieldKey>(decisions.acceptedPersonalFields);
    const profileRows = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
    const currentProfile = profileRows[0] ?? null;
    const profileId = currentProfile?.id ?? await ensureProfileId(userRecord[0].id);

    await db.update(profiles).set({
      userId: userRecord[0].id,
      fullName: acceptedPersonalFields.has('fullName') ? normalizeValue((parsedData.fullName as string | null | undefined) ?? '') : currentProfile?.fullName ?? '',
      phone: acceptedPersonalFields.has('phone') ? normalizeValue((parsedData.phone as string | null | undefined) ?? '') : currentProfile?.phone ?? '',
      headline: acceptedPersonalFields.has('headline') ? normalizeValue((parsedData.headline as string | null | undefined) ?? '') : currentProfile?.headline ?? '',
      location: acceptedPersonalFields.has('location') ? normalizeValue((parsedData.location as string | null | undefined) ?? '') : currentProfile?.location ?? '',
      linkedinUrl: acceptedPersonalFields.has('linkedinUrl') ? normalizeValue((parsedData.linkedinUrl as string | null | undefined) ?? '') : currentProfile?.linkedinUrl ?? '',
      summary: acceptedPersonalFields.has('summary') ? normalizeValue((parsedData.summary as string | null | undefined) ?? '') : currentProfile?.summary ?? '',
      updatedAt: new Date(),
    }).where(eq(profiles.id, profileId));

    const acceptedSections: string[] = [];
    if (acceptedSection(decisions, 'skills')) {
      const nextSkills = normalizeList(parsedData.skills);
      await db.delete(skills).where(eq(skills.profileId, profileId));
      if (nextSkills.length > 0) await db.insert(skills).values(nextSkills.map((name) => ({ id: randomUUID(), profileId, name, createdAt: new Date() })));
      acceptedSections.push('skills');
    }
    if (acceptedSection(decisions, 'experiences')) {
      const items = parseExperienceItems(parsedData.experience, profileId);
      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (items.length > 0) await db.insert(experiences).values(items.map((item) => ({ ...item, createdAt: new Date() })));
      acceptedSections.push('experiences');
    }
    if (acceptedSection(decisions, 'educations')) {
      const items = parseEducationItems(parsedData.education, profileId);
      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (items.length > 0) await db.insert(educations).values(items.map((item) => ({ ...item, createdAt: new Date() })));
      acceptedSections.push('educations');
    }
    if (acceptedSection(decisions, 'trainings')) {
      const items = parseTrainingItems(parsedData.trainings, profileId);
      await db.delete(trainings).where(eq(trainings.profileId, profileId));
      if (items.length > 0) await db.insert(trainings).values(items.map((item) => ({ ...item, createdAt: new Date() })));
      acceptedSections.push('trainings');
    }

    await markCvImportProvenance(userRecord[0].id, upload.id, Array.from(acceptedPersonalFields), acceptedSections);
    return { success: true, acceptedPersonalFields: Array.from(acceptedPersonalFields), acceptedSections };
  }),
});
