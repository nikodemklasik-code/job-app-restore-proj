import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { careerGoals, educations, experiences, profiles, skills, trainings, users } from '../../db/schema.js';
import { profileRouter as legacyProfileRouter } from './profile.router.js';

function workValuesToDb(values: string[]): string | null {
  const trimmed = values.map((value) => value.trim()).filter(Boolean);
  return trimmed.length ? trimmed.join(', ') : null;
}

async function ensureProfileForUser(userId: string): Promise<string> {
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const id = randomUUID();
  await db.insert(profiles).values({ id, userId, fullName: '' });
  return id;
}

async function ensureCareerGoalsRow(userId: string): Promise<void> {
  const existing = await db
    .select({ id: careerGoals.id })
    .from(careerGoals)
    .where(eq(careerGoals.userId, userId))
    .limit(1);

  if (existing[0]) return;

  await db.insert(careerGoals).values({
    id: randomUUID(),
    userId,
    autoApplyMinScore: 75,
  });
}

const updateFullInputSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().max(255).optional(),
  headline: z.string().max(255).optional(),
  summary: z.string().optional(),
  linkedinUrl: z.string().url().max(500).optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  workValues: z.string().optional(),
  careerPath: z.string().optional(),
  experiences: z
    .array(
      z.object({
        employerName: z.string().min(1),
        jobTitle: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  educations: z
    .array(
      z.object({
        schoolName: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .optional(),
  trainings: z
    .array(
      z.object({
        title: z.string().min(1),
        providerName: z.string().min(1),
        issuedAt: z.string(),
        expiresAt: z.string().nullable().optional(),
        credentialUrl: z.string().optional(),
      }),
    )
    .optional(),
});

const safeUpdateFull = protectedProcedure.input(updateFullInputSchema).mutation(async ({ ctx, input }) => {
  const localUserId = ctx.user.id;
  const profileId = await ensureProfileForUser(localUserId);

  if (input.email !== undefined) {
    await db
      .update(users)
      .set({ email: input.email, updatedAt: new Date() })
      .where(eq(users.id, localUserId));
  }

  const profilePatch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };

  if (input.fullName !== undefined) profilePatch.fullName = input.fullName;
  if (input.phone !== undefined) profilePatch.phone = input.phone;
  if (input.location !== undefined) profilePatch.location = input.location;
  if (input.headline !== undefined) profilePatch.headline = input.headline;
  if (input.summary !== undefined) profilePatch.summary = input.summary;
  if (input.linkedinUrl !== undefined) profilePatch.linkedinUrl = input.linkedinUrl || null;

  await db.update(profiles).set(profilePatch).where(eq(profiles.id, profileId));

  if (input.skills !== undefined) {
    await db.delete(skills).where(eq(skills.profileId, profileId));
    if (input.skills.length > 0) {
      await db.insert(skills).values(
        input.skills.map((name) => ({
          id: randomUUID(),
          profileId,
          name,
        })),
      );
    }
  }

  if (input.experiences !== undefined) {
    await db.delete(experiences).where(eq(experiences.profileId, profileId));
    if (input.experiences.length > 0) {
      await db.insert(experiences).values(
        input.experiences.map((item) => ({
          id: randomUUID(),
          profileId,
          employerName: item.employerName,
          jobTitle: item.jobTitle,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          description: item.description ?? '',
        })),
      );
    }
  }

  if (input.educations !== undefined) {
    await db.delete(educations).where(eq(educations.profileId, profileId));
    if (input.educations.length > 0) {
      await db.insert(educations).values(
        input.educations.map((item) => ({
          id: randomUUID(),
          profileId,
          schoolName: item.schoolName,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy ?? '',
          startDate: item.startDate,
          endDate: item.endDate ?? null,
        })),
      );
    }
  }

  if (input.trainings !== undefined) {
    await db.delete(trainings).where(eq(trainings.profileId, profileId));
    if (input.trainings.length > 0) {
      await db.insert(trainings).values(
        input.trainings.map((item) => ({
          id: randomUUID(),
          profileId,
          title: item.title,
          providerName: item.providerName,
          issuedAt: item.issuedAt,
          expiresAt: item.expiresAt ?? null,
          credentialUrl: item.credentialUrl ?? '',
        })),
      );
    }
  }

  if (input.workValues !== undefined || input.careerPath !== undefined) {
    await ensureCareerGoalsRow(localUserId);
    await db
      .update(careerGoals)
      .set({
        ...(input.workValues !== undefined
          ? {
              workValues: workValuesToDb(
                input.workValues
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean),
              ),
            }
          : {}),
        ...(input.careerPath !== undefined ? { targetJobTitle: input.careerPath || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(careerGoals.userId, localUserId));
  }

  return legacyProfileRouter.createCaller(ctx).getProfile();
});

export const profileSafeRouter = router({
  ...legacyProfileRouter._def.procedures,
  updateFull: safeUpdateFull,
});
