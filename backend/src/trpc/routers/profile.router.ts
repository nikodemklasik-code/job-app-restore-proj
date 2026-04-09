import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { profiles, skills, users } from '../../db/schema.js';

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
        });
        await db.insert(profiles).values({
          id: randomUUID(),
          userId,
          fullName: displayName,
        });
        return { created: true as const };
      }

      await db.update(users)
        .set({ email: input.email, updatedAt: new Date() })
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

  getProfile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return null;

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profile = profileRecord[0];
      if (!profile) return null;

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));

      return {
        personalInfo: {
          fullName: profile.fullName,
          email: userRecord[0]?.email ?? '',
          phone: profile.phone ?? '',
          summary: profile.summary ?? '',
        },
        skills: skillRecords.map((s) => s.name),
      };
    }),

  savePersonalInfo: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      fullName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      summary: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };

      if (input.email) {
        await db.update(users)
          .set({ email: input.email, updatedAt: new Date() })
          .where(eq(users.id, localUserId));
      }

      const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      if (existing.length > 0) {
        await db.update(profiles).set({ fullName: input.fullName, phone: input.phone, summary: input.summary, updatedAt: new Date() }).where(eq(profiles.userId, localUserId));
      } else {
        await db.insert(profiles).values({ id: randomUUID(), userId: localUserId, fullName: input.fullName, phone: input.phone, summary: input.summary });
      }
      return { success: true };
    }),

  saveSkills: publicProcedure
    .input(z.object({ userId: z.string().min(1), skills: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };

      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return { success: false };

      await db.delete(skills).where(eq(skills.profileId, profileId));
      if (input.skills.length > 0) {
        await db.insert(skills).values(input.skills.map((name) => ({ id: randomUUID(), profileId, name })));
      }
      return { success: true };
    }),
});
