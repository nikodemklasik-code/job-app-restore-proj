import { randomUUID } from 'crypto';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';

const communityEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAtLabel: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
});

const memberOutcomeSchema = z.object({
  id: z.string(),
  memberName: z.string(),
  outcome: z.string(),
  proofSignal: z.string(),
});

const communitySnapshotSchema = z.object({
  referralLink: z.string(),
  primaryAction: z.string(),
  emptyStatePrompt: z.string(),
  events: z.array(communityEventSchema),
  featuredOutcomes: z.array(memberOutcomeSchema),
  trending: z.array(z.string()),
  generatedAt: z.string(),
});

const trackCommunityActionInputSchema = z.object({
  action: z.enum(['copy_referral_link', 'view_event_details', 'open_community_feed', 'become_patron']),
});

const trackCommunityActionOutputSchema = z.object({
  id: z.string(),
  action: trackCommunityActionInputSchema.shape.action,
  acknowledgedAt: z.string(),
});

function getBaseUrl(): string {
  return process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'https://jobs.multivohub.com';
}

function buildReferralLink(userId: string): string {
  const code = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'member';
  return `${getBaseUrl().replace(/\/$/, '')}/ref/${code}`;
}

export const communityRouter = router({
  getSnapshot: protectedProcedure.output(communitySnapshotSchema).query(({ ctx }) => {
    const now = new Date();

    return {
      referralLink: buildReferralLink(ctx.user.id),
      primaryAction: 'Invite one peer and share one verified outcome.',
      emptyStatePrompt: 'Invite one peer, join one event, and return here after your first community action.',
      events: [
        {
          id: 'interview-rehearsal-sprint',
          title: 'Interview Rehearsal Sprint',
          startsAtLabel: 'Thursday',
          description: 'Practice concise answers, pressure handling, and follow-up framing.',
          ctaLabel: 'View event details',
        },
        {
          id: 'negotiation-language-lab',
          title: 'Negotiation Language Lab',
          startsAtLabel: 'Saturday',
          description: 'Work on compensation boundaries, counter-offers, and value framing.',
          ctaLabel: 'View event details',
        },
        {
          id: 'skill-value-positioning',
          title: 'Skill Value Positioning Q&A',
          startsAtLabel: 'Tuesday',
          description: 'Connect skill proof, market value, and stronger application positioning.',
          ctaLabel: 'View event details',
        },
      ],
      featuredOutcomes: [
        {
          id: 'elena-warmup-confidence',
          memberName: 'Elena',
          outcome: 'Improved interview confidence score after a Daily Warmup streak.',
          proofSignal: 'Practice Activity',
        },
        {
          id: 'marcus-report-replies',
          memberName: 'Marcus',
          outcome: 'Converted report insights into stronger application replies.',
          proofSignal: 'Reports',
        },
        {
          id: 'priya-negotiation-framing',
          memberName: 'Priya',
          outcome: 'Negotiated compensation band with clearer value framing.',
          proofSignal: 'Negotiation',
        },
      ],
      trending: [
        'Follow-up strategy after 7+ days of silence.',
        'Compensation boundary response draft.',
        '10-minute Daily Warmup challenge.',
      ],
      generatedAt: now.toISOString(),
    };
  }),

  trackAction: protectedProcedure
    .input(trackCommunityActionInputSchema)
    .output(trackCommunityActionOutputSchema)
    .mutation(({ input }) => ({
      id: randomUUID(),
      action: input.action,
      acknowledgedAt: new Date().toISOString(),
    })),
});
