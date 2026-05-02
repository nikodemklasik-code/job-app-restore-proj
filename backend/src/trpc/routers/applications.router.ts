import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications, applicationLogs, profiles, skills, users, experiences, educations } from '../../db/schema.js';
import { generateCoverLetter, generateCvSummary, scoreJobFit, generateFollowUp } from '../../services/aiPersonalizer.js';
import { generateCvPdf, generateCoverLetterPdf, generateCandidateReport, generateAtsCvPdf, calculateAtsScore } from '../../services/pdfGenerator.js';
import { getLearnedSignals, recordOutcome } from '../../services/learningService.js';
import { analyzeJobDescription, matchProfileToJob } from '../../services/jobAnalyzer.js';
import { generateTailoredCv, generateTailoredCoverLetter } from '../../services/documentTailoring.js';
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
      status: z.enum(['draft', 'prepared', 'sent', 'follow_up_sent', 'rejected', 'accepted', 'interview']),
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
      const experienceRecords = await db.select().from(experiences).where(eq(experiences.profileId, profile.id)).orderBy(desc(experiences.startDate));
      const educationRecords = await db.select().from(educations).where(eq(educations.profileId, profile.id)).orderBy(desc(educations.startDate));
      const learnedSignals = await getLearnedSignals(userRecord[0].id);

      const jobData = { title: appRow[0].jobTitle, company: appRow[0].company, description: appRow[0].jobDescription ?? '' };
      const profileData = {
        fullName: profile.fullName,
        summary: profile.summary ?? '',
        skills: skillRecords.map((s) => s.name),
        experience: experienceRecords.map((e) => ({
          id: e.id,
          title: e.jobTitle,
          company: e.employerName,
          description: e.description ?? '',
          achievements: e.achievements ? JSON.parse(e.achievements as string) : [],
        })),
        education: educationRecords.map((e) => ({
          degree: e.degree,
          school: e.schoolName,
        })),
      };

      // Phase 1: Analyze job and match profile
      let jobAnalysis;
      let profileMatch;
      try {
        jobAnalysis = await analyzeJobDescription(jobData.title, jobData.company, jobData.description);
        profileMatch = await matchProfileToJob(profileData, jobAnalysis);
      } catch (error) {
        console.warn('Job analysis failed, continuing with basic generation:', error);
        jobAnalysis = null;
        profileMatch = null;
      }

      const [coverLetter, cvSummary] = await Promise.all([
        generateCoverLetter(profileData, jobData, learnedSignals),
        generateCvSummary(profileData, jobData),
      ]);

      const jobFit = await scoreJobFit(profileData, jobData);

      // Store job analysis metadata if available
      const metadata = jobAnalysis && profileMatch ? {
        jobAnalysis,
        profileMatch,
        generatedAt: new Date().toISOString(),
      } : null;

      await db.update(applications).set({
        coverLetterSnapshot: coverLetter,
        cvSnapshot: cvSummary,
        fitScore: jobFit.score,
        status: 'prepared',
        updatedAt: new Date(),
        metadata: metadata ? JSON.stringify(metadata) : null,
      }).where(eq(applications.id, input.applicationId));

      await db.insert(applicationLogs).values({ id: randomUUID(), applicationId: input.applicationId, action: 'documents_generated' });

      return {
        coverLetter,
        cvSummary,
        fitScore: jobFit.score,
        fitReasons: jobFit.reasons,
        jobAnalysis: jobAnalysis || undefined,
        profileMatch: profileMatch || undefined,
      };
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

      // Fetch experience and education for complete CV
      const experienceRecords = profile ? await db.select().from(experiences).where(eq(experiences.profileId, profile.id)).orderBy(desc(experiences.startDate)) : [];
      const educationRecords = profile ? await db.select().from(educations).where(eq(educations.profileId, profile.id)).orderBy(desc(educations.startDate)) : [];

      // Generate PDFs
      const [cvPdf, clPdf] = await Promise.all([
        generateCvPdf({
          fullName: profile?.fullName ?? '',
          email: userRecord[0].email,
          phone: profile?.phone ?? '',
          summary: profile?.summary ?? '',
          skills: skillRecords.map((s) => s.name),
          experience: experienceRecords.map((e) => ({
            title: e.jobTitle,
            company: e.employerName,
            startDate: e.startDate,
            endDate: e.endDate ?? undefined,
            description: e.description ?? undefined,
          })),
          education: educationRecords.map((e) => ({
            degree: e.degree,
            school: e.schoolName,
            startDate: e.startDate,
            endDate: e.endDate ?? undefined,
          })),
        }),
        generateCoverLetterPdf(appRow[0].coverLetterSnapshot, {
          senderName: profile?.fullName ?? '',
          company: appRow[0].company,
          role: appRow[0].jobTitle,
        }),
      ]);

      const subject = input.subject ?? `Application for ${appRow[0].jobTitle} at ${appRow[0].company}`;

      // BCC the sender so they have a copy in their own inbox
      const bccAddress = userRecord[0].email ?? undefined;

      await getResend().emails.send({
        from: `${profile?.fullName ?? 'Candidate'} via MultivoHub <applications@multivohub.com>`,
        to: input.recipientEmail,
        bcc: bccAddress,
        replyTo: userRecord[0].email ?? undefined,
        subject,
        html: `<p>Dear Hiring Manager,</p><p>Please find attached my CV and cover letter for the ${appRow[0].jobTitle} role at ${appRow[0].company}.</p><p>I look forward to hearing from you.</p><p>Best regards,<br/>${profile?.fullName ?? 'Candidate'}${userRecord[0].email ? `<br/><a href="mailto:${userRecord[0].email}">${userRecord[0].email}</a>` : ''}</p>`,
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
      const experienceRecords = await db.select().from(experiences).where(eq(experiences.profileId, profile.id)).orderBy(desc(experiences.startDate));
      const educationRecords = await db.select().from(educations).where(eq(educations.profileId, profile.id)).orderBy(desc(educations.startDate));

      const pdfBuffer = await generateCvPdf({
        fullName: profile.fullName,
        email: userRecord[0].email,
        phone: profile.phone ?? '',
        summary: profile.summary ?? '',
        skills: skillRecords.map((s) => s.name),
        experience: experienceRecords.map((e) => ({
          title: e.jobTitle,
          company: e.employerName,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
          description: e.description ?? undefined,
        })),
        education: educationRecords.map((e) => ({
          degree: e.degree,
          school: e.schoolName,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
        })),
      });

      return { base64: pdfBuffer.toString('base64') };
    }),

  downloadCoverLetterPdf: publicProcedure
    .input(z.object({
      userId: z.string(),
      text: z.string(),
      company: z.string().optional(),
      role: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const profileRecord = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);

      const pdfBuffer = await generateCoverLetterPdf(input.text, {
        senderName: profileRecord[0]?.fullName ?? undefined,
        company: input.company,
        role: input.role,
      });

      return { base64: pdfBuffer.toString('base64') };
    }),

  getLogs: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return [];
      const rows = await db
        .select({ userId: applications.userId })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);
      if (!rows[0] || rows[0].userId !== userRecord[0].id) return [];
      return db
        .select()
        .from(applicationLogs)
        .where(eq(applicationLogs.applicationId, input.applicationId))
        .orderBy(desc(applicationLogs.createdAt));
    }),

  downloadCandidateReport: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);
      if (!userRecord[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const profileRecord = await db
        .select({ id: profiles.id, fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.userId, userRecord[0].id))
        .limit(1);

      const allApps = await db
        .select({ status: applications.status, company: applications.company })
        .from(applications)
        .where(eq(applications.userId, userRecord[0].id));

      const total = allApps.length;
      const interviews = allApps.filter((a) => ['interview', 'interview_scheduled'].includes(a.status ?? '')).length;
      const offers = allApps.filter((a) => a.status === 'offer').length;
      const responseRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

      // Status breakdown
      const statusCounts = new Map<string, number>();
      for (const a of allApps) {
        const s = a.status ?? 'unknown';
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
      }
      const topStatuses = [...statusCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([status, count]) => ({ status, count }));

      // Top companies
      const companyCounts = new Map<string, number>();
      for (const a of allApps) {
        const c = a.company ?? 'Unknown';
        companyCounts.set(c, (companyCounts.get(c) ?? 0) + 1);
      }
      const topCompanies = [...companyCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([company]) => company);

      const pdfBuffer = await generateCandidateReport({
        fullName: profileRecord[0]?.fullName ?? undefined,
        email: userRecord[0].email,
        totalApplications: total,
        interviews,
        offers,
        responseRate,
        topCompanies,
        topStatuses,
        generatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      });

      return { base64: pdfBuffer.toString('base64') };
    }),

  // Phase 4: New ATS-Optimized Endpoints

  analyzeJobFit: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const appRow = await db.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!appRow[0]) throw new Error('Application not found');

      // Parse metadata if available
      if (appRow[0].metadata) {
        try {
          const metadata = JSON.parse(appRow[0].metadata as string);
          return {
            jobAnalysis: metadata.jobAnalysis,
            profileMatch: metadata.profileMatch,
            generatedAt: metadata.generatedAt,
          };
        } catch {
          return { error: 'Metadata parsing failed' };
        }
      }

      return { error: 'No job analysis available - generate documents first' };
    }),

  getAtsScore: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = profileRecord[0];
      if (!profile) throw new Error('Profile not found');

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));
      const experienceRecords = await db.select().from(experiences).where(eq(experiences.profileId, profile.id));
      const educationRecords = await db.select().from(educations).where(eq(educations.profileId, profile.id));

      const atsScore = calculateAtsScore({
        fullName: profile.fullName,
        email: userRecord[0].email,
        phone: profile.phone ?? undefined,
        summary: profile.summary ?? undefined,
        skills: skillRecords.map((s) => s.name),
        experience: experienceRecords.map((e) => ({
          title: e.jobTitle,
          company: e.employerName,
          description: e.description ?? undefined,
        })),
        education: educationRecords.map((e) => ({
          degree: e.degree,
          school: e.schoolName,
        })),
      });

      return { atsScore };
    }),

  downloadAtsCvPdf: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) throw new Error('User not found');

      const profileRecord = await db.select().from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
      const profile = profileRecord[0];
      if (!profile) throw new Error('Complete your profile first');

      const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id));
      const experienceRecords = await db.select().from(experiences).where(eq(experiences.profileId, profile.id)).orderBy(desc(experiences.startDate));
      const educationRecords = await db.select().from(educations).where(eq(educations.profileId, profile.id)).orderBy(desc(educations.startDate));

      const pdfBuffer = await generateAtsCvPdf({
        fullName: profile.fullName,
        email: userRecord[0].email,
        phone: profile.phone ?? '',
        summary: profile.summary ?? '',
        skills: skillRecords.map((s) => s.name),
        experience: experienceRecords.map((e) => ({
          title: e.jobTitle,
          company: e.employerName,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
          description: e.description ?? undefined,
        })),
        education: educationRecords.map((e) => ({
          degree: e.degree,
          school: e.schoolName,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
        })),
      });

      return { base64: pdfBuffer.toString('base64') };
    }),
});
