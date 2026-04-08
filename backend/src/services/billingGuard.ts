import { db } from '../db/index.js';
import { subscriptions, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export type PlanTier = 'free' | 'pro' | 'autopilot';

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    'basic_jobs', 'profile', 'cv_upload', 'applications_10',
    'salary_calculator', 'legal_hub',
  ],
  pro: [
    'basic_jobs', 'profile', 'cv_upload', 'applications_unlimited',
    'ai_documents', 'indeed_session', 'gumtree_session',
    'interview_practice', 'skills_lab', 'style_studio',
    'salary_calculator', 'legal_hub', 'reports',
    'follow_up_copilot', 'job_fit_explain',
  ],
  autopilot: [
    'basic_jobs', 'profile', 'cv_upload', 'applications_unlimited',
    'ai_documents', 'indeed_session', 'gumtree_session',
    'interview_practice', 'skills_lab', 'style_studio',
    'salary_calculator', 'legal_hub', 'reports',
    'follow_up_copilot', 'job_fit_explain',
    'auto_apply', 'telegram_notifications', 'smtp_settings',
    'bulk_export', 'priority_support',
  ],
};

export const PLAN_LIMITS: Record<PlanTier, { applications: number; aiCredits: number }> = {
  free: { applications: 10, aiCredits: 20 },
  pro: { applications: -1, aiCredits: 500 },
  autopilot: { applications: -1, aiCredits: 2000 },
};

export const PLAN_PRICES: Record<PlanTier, { monthly: string; label: string }> = {
  free: { monthly: '0', label: 'Free' },
  pro: { monthly: '9.99', label: 'Pro' },
  autopilot: { monthly: '24.99', label: 'Autopilot' },
};

export async function getUserPlan(clerkId: string): Promise<PlanTier> {
  const userRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!userRow[0]) return 'free';

  const subRow = await db
    .select({ plan: subscriptions.plan, status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userRow[0].id))
    .limit(1);

  if (!subRow[0] || subRow[0].status !== 'active') return 'free';
  return (subRow[0].plan as PlanTier) || 'free';
}

export async function hasFeature(clerkId: string, feature: string): Promise<boolean> {
  const plan = await getUserPlan(clerkId);
  return PLAN_FEATURES[plan].includes(feature);
}

export function planHasFeature(plan: PlanTier, feature: string): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}
