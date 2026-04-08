import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { profiles, skills, users } from '../../db/schema.js';

export const profileRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return null;

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profile = profileRecord[0];
      if (!profile) return null;

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));

      return {
        personalInfo: {
          fullName: profile.fullName,
          email: '',
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

      const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      if (existing.length > 0) {
        await db.update(profiles).set({ fullName: input.fullName, phone: input.phone, summary: input.summary, updatedAt: new Date() }).where(eq(profiles.userId, localUserId));
      } else {
        await db.insert(profiles).values({ userId: localUserId, fullName: input.fullName, phone: input.phone, summary: input.summary });
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
        await db.insert(skills).values(input.skills.map((name) => ({ profileId, name })));
      }
      return { success: true };
    }),
});
