import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications, applicationLogs, profiles, skills, users } from '../../db/schema.js';
import { generateCoverLetter, generateCvSummary, scoreJobFit, generateFollowUp } from '../../services/aiPersonalizer.js';
import { generateCvPdf, generateCoverLetterPdf } from '../../services/pdfGenerator.js';
import { getLearnedSignals, recordOutcome } from '../../services/learningService.js';
import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const applicationsRouter = router({
  getAll: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return [];
      return db.select().from(applications)
        .where(eq(applications.userId, userRecord[0].id))
        .orderBy(desc(applications.updatedAt));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      const rows = await db.select().from(applications).where(eq(applications.id, input.id)).limit(1);
      const row = rows[0];
      if (!row || row.userId !== localUserId) return null;
      return row;
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      jobId: z.string().optional(),
      jobTitle: z.string().min(1),
      company: z.string().min(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const id = randomUUID();
      await db.insert(applications).values({
        id, userId: userRecord[0].id,
        jobId: input.jobId,
        jobTitle: input.jobTitle,
        company: input.company,
        status: 'draft',
        notes: input.notes,
      });

      await db.insert(applicationLogs).values({ id: randomUUID(), applicationId: id, action: 'created' });
      return { id };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      status: z.enum(['draft', 'prepared', 'sent', 'rejected', 'accepted', 'interview']),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      const rows = await db.select({ userId: applications.userId }).from(applications).where(eq(applications.id, input.id)).limit(1);
      if (!rows[0] || rows[0].userId !== localUserId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }
      await db.update(applications).set({ status: input.status, updatedAt: new Date() }).where(eq(applications.id, input.id));
      await db.insert(applicationLogs).values({ id: randomUUID(), applicationId: input.id, action: `status:${input.status}` });
      return { success: true };
    }),

  generateDocuments: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const appRow = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!appRow[0]) throw new Error('Application not found');

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = profileRecord[0];
      if (!profile) throw new Error('Profile not found — complete your profile first');

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));
      const learnedSignals = await getLearnedSignals(userRecord[0].id);

      const jobData = { title: appRow[0].jobTitle, company: appRow[0].company };
      const profileData = {
        fullName: profile.fullName,
        summary: profile.summary ?? '',
        skills: skillRecords.map((s) => s.name),
      };

      const [coverLetter, cvSummary] = await Promise.all([
        generateCoverLetter(profileData, jobData, learnedSignals),
        generateCvSummary(profileData, jobData),
      ]);

      const jobFit = await scoreJobFit(profileData, jobData);

      await db.update(applications).set({
        coverLetterSnapshot: coverLetter,
        cvSnapshot: cvSummary,
        fitScore: jobFit.score,
        status: 'prepared',
        updatedAt: new Date(),
      }).where(eq(applications.id, input.applicationId));

      await db.insert(applicationLogs).values({ id: randomUUID(), applicationId: input.applicationId, action: 'documents_generated' });

      return { coverLetter, cvSummary, fitScore: jobFit.score, fitReasons: jobFit.reasons };
    }),

  sendByEmail: publicProcedure
    .input(z.object({
      userId: z.string(),
      applicationId: z.string(),
      recipientEmail: z.string().email(),
      subject: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const appRow = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!appRow[0]) throw new Error('Application not found');
      if (appRow[0].userId !== userRecord[0].id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your application' });

      if (!appRow[0].coverLetterSnapshot) throw new Error('Generate documents first');

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = profileRecord[0];
      const skillRecords = profile ? await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id)) : [];

      // Generate PDFs
      const [cvPdf, clPdf] = await Promise.all([
        generateCvPdf({
          fullName: profile?.fullName ?? '',
          email: userRecord[0].email,
          phone: profile?.phone ?? '',
          summary: profile?.summary ?? '',
          skills: skillRecords.map((s) => s.name),
        }),
        generateCoverLetterPdf(appRow[0].coverLetterSnapshot, {
          senderName: profile?.fullName ?? '',
          company: appRow[0].company,
          role: appRow[0].jobTitle,
        }),
      ]);

      const subject = input.subject ?? `Application for ${appRow[0].jobTitle} at ${appRow[0].company}`;

      await getResend().emails.send({
        from: 'applications@multivohub.com',
        to: input.recipientEmail,
        subject,
        html: `<p>Dear Hiring Manager,</p><p>Please find attached my CV and cover letter for the ${appRow[0].jobTitle} role.</p><p>Best regards,<br/>${profile?.fullName ?? 'Candidate'}</p>`,
        attachments: [
          { filename: 'CV.pdf', content: cvPdf.toString('base64') },
          { filename: 'Cover_Letter.pdf', content: clPdf.toString('base64') },
        ],
      });

      await db.update(applications).set({ status: 'sent', emailSentAt: new Date(), updatedAt: new Date() }).where(eq(applications.id, input.applicationId));
      await db.insert(applicationLogs).values({ id: randomUUID(), applicationId: input.applicationId, action: 'email_sent', meta: { to: input.recipientEmail } });

      return { success: true };
    }),

  recordOutcome: publicProcedure
    .input(z.object({
      userId: z.string(),
      applicationId: z.string(),
      outcome: z.enum(['interview', 'offer', 'rejection']),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return { success: false };

      const appRow = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!appRow[0]) return { success: false };

      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const skillRecords = profileRecord[0] ? await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profileRecord[0].id)) : [];

      await recordOutcome(userRecord[0].id, skillRecords.map((s) => s.name), appRow[0].jobTitle, input.outcome);

      const statusMap = { interview: 'interview', offer: 'accepted', rejection: 'rejected' } as const;
      await db.update(applications).set({ status: statusMap[input.outcome], updatedAt: new Date() }).where(eq(applications.id, input.applicationId));

      return { success: true };
    }),

  generateFollowUp: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const appRow = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!appRow[0]) throw new Error('Application not found');
      if (appRow[0].userId !== userRecord[0].id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });

      const profileRecord = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const applicantName = profileRecord[0]?.fullName ?? 'Candidate';

      const createdAt = appRow[0].createdAt;
      const daysSinceApply = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      const emailText = await generateFollowUp({
        applicantName,
        jobTitle: appRow[0].jobTitle,
        company: appRow[0].company,
        daysSinceApply,
        previousStatus: appRow[0].status,
      });

      return { emailText };
    }),

  getAnalytics: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return { total: 0, byStatus: {}, recentActivity: [], applied: 0, interviews: 0, offers: 0, rejections: 0, responseRate: 0 };

      const all = await db.select({ status: applications.status, createdAt: applications.createdAt })
        .from(applications).where(eq(applications.userId, userRecord[0].id));

      const byStatus: Record<string, number> = {};
      for (const a of all) {
        byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      }

      return {
        total: all.length,
        byStatus,
        applied: byStatus['sent'] ?? 0,
        interviews: byStatus['interview'] ?? 0,
        offers: byStatus['accepted'] ?? 0,
        rejections: byStatus['rejected'] ?? 0,
        responseRate: all.length > 0
          ? Math.round(((byStatus['interview'] ?? 0) + (byStatus['accepted'] ?? 0)) / all.length * 100)
          : 0,
      };
    }),

  downloadCvPdf: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = profileRecord[0];
      if (!profile) throw new Error('Complete your profile first');

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));

      const pdfBuffer = await generateCvPdf({
        fullName: profile.fullName,
        email: userRecord[0].email,
        phone: profile.phone ?? '',
        summary: profile.summary ?? '',
        skills: skillRecords.map((s) => s.name),
      });

      return { base64: pdfBuffer.toString('base64') };
    }),
});
