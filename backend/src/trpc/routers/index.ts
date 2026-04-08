import { router } from '../trpc.js';
import { assistantRouter } from './assistant.router.js';
import { interviewRouter } from './interview.router.js';
import { profileRouter } from './profile.router.js';
import { billingRouter } from './billing.router.js';
import { securityRouter } from './security.router.js';
import { jobsRouter } from './jobs.router.js';
import { applicationsRouter } from './applications.router.js';
import { reviewRouter } from './review.router.js';
import { cvRouter } from './cv.router.js';
import { jobSessionsRouter } from './jobSessions.router.js';

export const appRouter = router({
  assistant: assistantRouter,
  interview: interviewRouter,
  profile: profileRouter,
  billing: billingRouter,
  security: securityRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  review: reviewRouter,
  cv: cvRouter,
  jobSessions: jobSessionsRouter,
});

export type AppRouter = typeof appRouter;
