import { randomUUID } from 'crypto';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';

const communityCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
});

const experiencePostSchema = z.object({
  id: z.string(),
  authorLabel: z.string(),
  topic: z.string(),
  lesson: z.string(),
  moduleHint: z.string(),
});

const supportOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
});

const communitySnapshotSchema = z.object({
  referralLink: z.string(),
  primaryAction: z.string(),
  emptyStatePrompt: z.string(),
  announcements: z.array(communityCardSchema),
  contests: z.array(communityCardSchema),
  productNews: z.array(communityCardSchema),
  experienceExchange: z.array(experiencePostSchema),
  openSpacePrompts: z.array(z.string()),
  patronageOptions: z.array(supportOptionSchema),
  volunteeringOptions: z.array(supportOptionSchema),
  generatedAt: z.string(),
});

const trackCommunityActionInputSchema = z.object({
  action: z.enum([
    'copy_referral_link',
    'open_announcement',
    'open_contest',
    'open_product_news',
    'share_experience',
    'open_open_space',
    'become_patron',
    'buy_credits_for_someone',
    'volunteer',
  ]),
});

const trackCommunityActionOutputSchema = z.object({
  id: z.string(),
  action: trackCommunityActionInputSchema.shape.action,
  acknowledgedAt: z.string(),
});

function getBaseUrl(): string {
  return process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'https://jobs.multivohub.com';
}

export function buildCommunityReferralLink(userId: string, baseUrl = getBaseUrl()): string {
  const code = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'member';
  return `${baseUrl.replace(/\/$/, '')}/ref/${code}`;
}

export function buildCommunitySnapshot(userId: string, now = new Date()) {
  return {
    referralLink: buildCommunityReferralLink(userId),
    primaryAction: 'Read announcements, share one useful lesson, or support someone with credits.',
    emptyStatePrompt: 'When there are no posts yet, show one prompt: share an experience, post an announcement, or join volunteering.',
    announcements: [
      {
        id: 'community-rules-board',
        title: 'Community board is for practical career help',
        category: 'Announcement',
        description: 'Use this space for job-search notices, useful resources, requests for feedback, and member opportunities.',
        ctaLabel: 'Open announcement',
      },
      {
        id: 'mentor-office-hours',
        title: 'Open office hours for application review',
        category: 'Open Space',
        description: 'Members can bring one application, one follow-up message, or one interview concern for peer review.',
        ctaLabel: 'Join open space',
      },
    ],
    contests: [
      {
        id: 'best-follow-up-template',
        title: 'Best follow-up template challenge',
        category: 'Contest',
        description: 'Submit a concise follow-up message. The winning template becomes a community example and earns credits.',
        ctaLabel: 'Open contest',
      },
      {
        id: 'warmup-streak-week',
        title: 'Daily Warmup streak week',
        category: 'Contest',
        description: 'Complete short warmups across the week and share one lesson from the practice loop.',
        ctaLabel: 'View challenge',
      },
    ],
    productNews: [
      {
        id: 'applications-review-refresh',
        title: 'Applications Review now shows listing status and silence days',
        category: 'Product News',
        description: 'The review queue now explains why follow-up, wait, or close is recommended instead of making users interpret stale data alone.',
        ctaLabel: 'Read update',
      },
    ],
    experienceExchange: [
      {
        id: 'experience-follow-up-after-silence',
        authorLabel: 'Member story',
        topic: 'Following up after silence',
        lesson: 'A short message after 10+ days worked better than a long explanation of motivation.',
        moduleHint: 'Applications Review',
      },
      {
        id: 'experience-salary-boundary',
        authorLabel: 'Member lesson',
        topic: 'Salary boundary wording',
        lesson: 'Naming a clear range helped keep the conversation practical instead of apologetic.',
        moduleHint: 'Negotiation',
      },
    ],
    openSpacePrompts: [
      'Ask for feedback on a follow-up email.',
      'Share what worked in an interview or screening call.',
      'Post a useful job-search resource with context, not just a naked link like some digital cave painting.',
    ],
    patronageOptions: [
      {
        id: 'gift-credits',
        title: 'Buy credits for someone else',
        description: 'Sponsor credits for a member who is in a harder life situation and needs access to paid practice or document help.',
        ctaLabel: 'Gift credits',
      },
      {
        id: 'community-patron',
        title: 'Become a patron',
        description: 'Support the shared pool that helps members access credits when money is the blocker, because apparently survival still has pricing tiers.',
        ctaLabel: 'Become a patron',
      },
    ],
    volunteeringOptions: [
      {
        id: 'volunteer-cv-review',
        title: 'Volunteer: CV and profile feedback',
        description: 'Offer limited peer feedback slots for members who need a second pair of eyes.',
        ctaLabel: 'Volunteer for reviews',
      },
      {
        id: 'volunteer-mock-interview',
        title: 'Volunteer: mock interview partner',
        description: 'Help another member rehearse answers, pressure, and follow-up language.',
        ctaLabel: 'Volunteer for practice',
      },
    ],
    generatedAt: now.toISOString(),
  };
}

export function buildCommunityActionAck(action: z.infer<typeof trackCommunityActionInputSchema>['action']) {
  return {
    id: randomUUID(),
    action,
    acknowledgedAt: new Date().toISOString(),
  };
}

export const communityRouter = router({
  getSnapshot: protectedProcedure.output(communitySnapshotSchema).query(({ ctx }) => {
    return buildCommunitySnapshot(ctx.user.id);
  }),

  trackAction: protectedProcedure
    .input(trackCommunityActionInputSchema)
    .output(trackCommunityActionOutputSchema)
    .mutation(({ input }) => buildCommunityActionAck(input.action)),
});
