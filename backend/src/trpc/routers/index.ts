import { router } from '../trpc.js';
import { assistantRouter } from './assistant.router.js';
import { liveInterviewRouter } from './liveInterview.router.js';
import { interviewRouter } from './interview.router.js';
import { profileRouter } from './profile.router.js';
import { billingRouter } from './billing.router.js';
import { securityRouter } from './security.router.js';
import { jobsRouter } from './jobs.router.js';
import { applicationsRouter } from './applications.router.js';
import { reviewRouter } from './review.router.js';
import { cvRouter } from './cv.router.js';
import { jobSessionsRouter } from './jobSessions.router.js';
import { emailSettingsRouter } from './emailSettings.router.js';
import { telegramRouter } from './telegram.router.js';
import { autoApplyRouter } from './autoApply.router.js';
import { styleRouter } from './style.router.js';
import { jobSourcesRouter } from './jobSources.router.js';
import { pushRouter } from './push.router.js';
import { emailMonitoringRouter } from './emailMonitoring.router.js';
import { radarRouter } from './radar.router.js';
import { coachRouter } from './coach.router.js';
import { jobRadarRouter } from './jobRadar.router.js';
import { documentsRouter } from './documents.router.js';

export const appRouter = router({
  assistant: assistantRouter,
  coach: coachRouter,
  interview: interviewRouter,
  liveInterview: liveInterviewRouter,
  profile: profileRouter,
  billing: billingRouter,
  security: securityRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  review: reviewRouter,
  cv: cvRouter,
  jobSessions: jobSessionsRouter,
  emailSettings: emailSettingsRouter,
  telegram: telegramRouter,
  autoApply: autoApplyRouter,
  style: styleRouter,
  jobSources: jobSourcesRouter,
  push: pushRouter,
  emailMonitoring: emailMonitoringRouter,
  radar: radarRouter,
  jobRadar: jobRadarRouter,
  documents: documentsRouter,
});

export type AppRouter = typeof appRouter;
