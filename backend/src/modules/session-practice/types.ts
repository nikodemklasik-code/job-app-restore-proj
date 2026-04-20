/**
 * Practice session modules (Daily Warmup, Coach, Interview, Negotiation).
 * Backend contracts for billing + analytics — keep boundaries explicit (see session-modules-backend spec).
 */
export type PracticeSessionModule = 'daily_warmup' | 'coach' | 'interview' | 'negotiation';

/** Keys passed from the client when deducting credits for a practice session. */
export type PracticeBillingFeature =
  | 'warmup_session'
  | 'coach_session'
  | 'interview_session'
  | 'negotiation_session';
