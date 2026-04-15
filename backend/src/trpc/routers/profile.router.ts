import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { profiles, skills, users, experiences, educations, trainings } from '../../db/schema.js';
import type { ProfileSnapshot } from '../../../../shared/profile.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function ensureProfileForUser(userId: string): Promise<string> {
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0].id;
  const id = randomUUID();
  await db.insert(profiles).values({ id, userId, fullName: '' });
  return id;
}

async function fetchProfileSnapshot(userId: string, email: string): Promise<ProfileSnapshot> {
  const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const profile = profileRecord[0];
  if (!profile) {
    return {
      personalInfo: { fullName: '', email, phone: '', summary: '' },
      skills: [],
      experiences: [],
      educations: [],
      trainings: [],
    };
  }

  const [skillRecords, experienceRecords, educationRecords, trainingRecords] = await Promise.all([
    db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id)),
    db.select().from(experiences).where(eq(experiences.profileId, profile.id)),
    db.select().from(educations).where(eq(educations.profileId, profile.id)),
    db.select().from(trainings).where(eq(trainings.profileId, profile.id)),
  ]);

  return {
    personalInfo: {
      fullName: profile.fullName,
      email,
      phone: profile.phone ?? '',
      summary: profile.summary ?? '',
    },
    skills: skillRecords.map((s) => s.name),
    experiences: experienceRecords.map((e) => ({
      id: e.id,
      employerName: e.employerName,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      description: e.description ?? '',
    })),
    educations: educationRecords.map((e) => ({
      id: e.id,
      schoolName: e.schoolName,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy ?? '',
      startDate: e.startDate,
      endDate: e.endDate ?? null,
    })),
    trainings: trainingRecords.map((t) => ({
      id: t.id,
      title: t.title,
      providerName: t.providerName,
      issuedAt: t.issuedAt,
      expiresAt: t.expiresAt ?? null,
      credentialUrl: t.credentialUrl ?? '',
    })),
  };
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const profileRouter = router({
  /** Creates local `users` + `profiles` on first sign-in; keeps email in sync; fills empty profile name from Clerk. */
  ensureFromClerk: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      email: z.string().email(),
      fullName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const displayName = (input.fullName ?? '').trim();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const row = existing[0];

      if (!row) {
        const userId = randomUUID();
        await db.insert(users).values({
          id: userId,
          clerkId: input.userId,
          email: input.email,
          lastSeenAt: new Date(),
        });
        await db.insert(profiles).values({
          id: randomUUID(),
          userId,
          fullName: displayName,
        });
        return { created: true as const };
      }

      await db.update(users)
        .set({ email: input.email, updatedAt: new Date(), lastSeenAt: new Date() })
        .where(eq(users.id, row.id));

      if (!displayName) return { created: false as const };

      const profileRow = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, row.id)).limit(1);
      const currentName = (profileRow[0]?.fullName ?? '').trim();
      if (!currentName) {
        await db.update(profiles)
          .set({ fullName: displayName, updatedAt: new Date() })
          .where(eq(profiles.userId, row.id));
      }

      return { created: false as const };
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return fetchProfileSnapshot(ctx.user.id, ctx.user.email);
    }),

  savePersonalInfo: protectedProcedure
    .input(z.object({
      fullName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      summary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;

      if (input.email) {
        await db.update(users)
          .set({ email: input.email, updatedAt: new Date() })
          .where(eq(users.id, localUserId));
      }

      await ensureProfileForUser(localUserId);
      await db.update(profiles)
        .set({ fullName: input.fullName, phone: input.phone, summary: input.summary, updatedAt: new Date() })
        .where(eq(profiles.userId, localUserId));

      const email = input.email ?? ctx.user.email;
      return fetchProfileSnapshot(localUserId, email);
    }),

  saveSkills: protectedProcedure
    .input(z.object({ skills: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(skills).where(eq(skills.profileId, profileId));
      if (input.skills.length > 0) {
        await db.insert(skills).values(input.skills.map((name) => ({ id: randomUUID(), profileId, name })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceExperiences: protectedProcedure
    .input(z.object({
      experiences: z.array(z.object({
        employerName: z.string().min(1),
        jobTitle: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().nullable(),
        description: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (input.experiences.length > 0) {
        await db.insert(experiences).values(input.experiences.map((item) => ({
          id: randomUUID(),
          profileId,
          employerName: item.employerName,
          jobTitle: item.jobTitle,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          description: item.description,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceEducations: protectedProcedure
    .input(z.object({
      educations: z.array(z.object({
        schoolName: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (input.educations.length > 0) {
        await db.insert(educations).values(input.educations.map((item) => ({
          id: randomUUID(),
          profileId,
          schoolName: item.schoolName,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy || null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceTrainings: protectedProcedure
    .input(z.object({
      trainings: z.array(z.object({
        title: z.string().min(1),
        providerName: z.string().min(1),
        issuedAt: z.string(),
        expiresAt: z.string().nullable(),
        credentialUrl: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(trainings).where(eq(trainings.profileId, profileId));
      if (input.trainings.length > 0) {
        await db.insert(trainings).values(input.trainings.map((item) => ({
          id: randomUUID(),
          profileId,
          title: item.title,
          providerName: item.providerName,
          issuedAt: item.issuedAt,
          expiresAt: item.expiresAt ?? null,
          credentialUrl: item.credentialUrl || null,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  // ── Legacy procedures (kept for backwards compatibility) ──────────────────

  getExperience: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return [];
      return db.select().from(experiences).where(eq(experiences.profileId, profileId));
    }),

  saveExperience: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      items: z.array(z.object({
        id: z.string().optional(),
        employerName: z.string().min(1),
        jobTitle: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return { success: false };
      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (input.items.length > 0) {
        await db.insert(experiences).values(input.items.map((item) => ({
          id: item.id ?? randomUUID(),
          profileId,
          employerName: item.employerName,
          jobTitle: item.jobTitle,
          startDate: item.startDate ?? '',
          endDate: item.endDate ?? null,
          description: item.description ?? '',
        })));
      }
      return { success: true };
    }),

  getEducation: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return [];
      return db.select().from(educations).where(eq(educations.profileId, profileId));
    }),

  saveEducation: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      items: z.array(z.object({
        id: z.string().optional(),
        schoolName: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return { success: false };
      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (input.items.length > 0) {
        await db.insert(educations).values(input.items.map((item) => ({
          id: item.id ?? randomUUID(),
          profileId,
          schoolName: item.schoolName,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy ?? null,
          startDate: item.startDate ?? '',
          endDate: item.endDate ?? null,
        })));
      }
      return { success: true };
    }),
});
