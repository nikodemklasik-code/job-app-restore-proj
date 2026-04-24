import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import AppShell from './components/layout/AppShell';
import { APP_SCREENS, LEGACY_ROUTE_REDIRECTS } from './config/appScreens';

const AuthPage = lazy(() => import('./app/auth/AuthPage'));
const DashboardPage = lazy(() => import('./app/dashboard/DashboardPage'));
const JobsDiscovery = lazy(() => import('./app/jobs/JobsDiscovery'));
const ApplicationsPage = lazy(() => import('./app/applications/ApplicationsPage'));
const ApplicationsPipeline = lazy(() => import('./app/applications/ApplicationsPipeline'));
const ReviewQueue = lazy(() => import('./app/review/ReviewQueue'));
const AssistantPage = lazy(() => import('./app/assistant/AssistantPage'));
const InterviewPractice = lazy(() => import('./app/interview/InterviewPractice'));
const ProfilePage = lazy(() => import('./app/profile/ProfileScreenV2'));
const BillingPage = lazy(() => import('./app/billing/BillingPage'));
const SettingsHub = lazy(() => import('./app/settings/SettingsHub'));
const SecurityPage = lazy(() => import('./app/settings/SecurityPage'));
const StyleStudioRedirect = lazy(() => import('./app/style/StyleStudioRedirect'));
const UKSalaryCalculator = lazy(() => import('./app/salary/UKSalaryCalculator'));
const LegalHub = lazy(() => import('./app/legal/LegalHub'));
const TermsPage = lazy(() => import('./app/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./app/legal/PrivacyPage'));
const CookiesPage = lazy(() => import('./app/legal/CookiesPage'));
const ReportsHub = lazy(() => import('./app/reports/ReportsHub'));
const SkillsLab = lazy(() => import('./app/skills/SkillsLab'));
const NegotiationPage = lazy(() => import('./app/negotiation/NegotiationPage'));
const JobRadar = lazy(() => import('./app/radar/JobRadar'));
const JobRadarLandingPage = lazy(() => import('./app/job-radar/JobRadarLandingPage'));
const JobRadarReportPage = lazy(() => import('./app/job-radar/JobRadarReportPage'));
const JobRadarScanPage = lazy(() => import('./app/job-radar/JobRadarScanPage'));
const JobRadarAdminComplaintsPage = lazy(() => import('./app/job-radar/admin/JobRadarAdminComplaintsPage'));
const DailyWarmupPage = lazy(() => import('./app/warmup/DailyWarmupPage'));
const CoachPage = lazy(() => import('./app/coach/CoachPage'));
const FAQPage = lazy(() => import('./app/faq/FAQPage'));
const ProfileDocumentsScreen = lazy(() => import('./app/documents/ProfileDocumentsScreen'));
const DocumentLab = lazy(() => import('./app/documents/DocumentLab'));
const CasePracticePage = lazy(() => import('./app/case-practice/CasePracticePageCompact'));
const CommunityCenterPage = lazy(() => import('./app/community/CommunityCentrePage'));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center py-24">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
  </div>
);

const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    ),
  },
  {
    path: '/sso-callback',
    element: <AuthenticateWithRedirectCallback />,
  },
  {
    path: '/terms',
    element: (
      <Suspense fallback={<PageLoader />}>
        <TermsPage />
      </Suspense>
    ),
  },
  {
    path: '/privacy',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PrivacyPage />
      </Suspense>
    ),
  },
  {
    path: '/cookies',
    element: (
      <Suspense fallback={<PageLoader />}>
        <CookiesPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: APP_SCREENS.dashboard.path.slice(1), element: withSuspense(DashboardPage) },
      { path: APP_SCREENS.profile.path.slice(1), element: withSuspense(ProfilePage) },
      { path: APP_SCREENS.documentHub.path.slice(1), element: withSuspense(ProfileDocumentsScreen) },
      { path: APP_SCREENS.documentUpload.path.slice(1), element: withSuspense(DocumentLab) },
      { path: APP_SCREENS.styleStudio.path.slice(1), element: withSuspense(StyleStudioRedirect) },
      { path: APP_SCREENS.jobs.path.slice(1), element: withSuspense(JobsDiscovery) },
      { path: APP_SCREENS.applications.path.slice(1), element: withSuspense(ApplicationsPage) },
      { path: 'applications/board', element: withSuspense(ApplicationsPipeline) },
      { path: APP_SCREENS.applicationsReview.path.slice(1), element: withSuspense(ReviewQueue) },
      { path: APP_SCREENS.assistant.path.slice(1), element: withSuspense(AssistantPage) },
      { path: APP_SCREENS.dailyWarmup.path.slice(1), element: withSuspense(DailyWarmupPage) },
      { path: APP_SCREENS.interview.path.slice(1), element: withSuspense(InterviewPractice) },
      { path: APP_SCREENS.coach.path.slice(1), element: withSuspense(CoachPage) },
      { path: APP_SCREENS.negotiation.path.slice(1), element: withSuspense(NegotiationPage) },
      { path: APP_SCREENS.caseStudy.path.slice(1), element: withSuspense(CasePracticePage) },
      { path: APP_SCREENS.skillLab.path.slice(1), element: withSuspense(SkillsLab) },
      { path: APP_SCREENS.reports.path.slice(1), element: withSuspense(ReportsHub) },
      { path: APP_SCREENS.jobRadar.path.slice(1), element: withSuspense(JobRadarLandingPage) },
      { path: 'job-radar/scan/:scanId', element: withSuspense(JobRadarScanPage) },
      { path: 'job-radar/report/:reportId', element: withSuspense(JobRadarReportPage) },
      { path: 'job-radar/admin/complaints', element: withSuspense(JobRadarAdminComplaintsPage) },
      { path: APP_SCREENS.salaryCalculator.path.slice(1), element: withSuspense(UKSalaryCalculator) },
      { path: APP_SCREENS.legalHub.path.slice(1), element: withSuspense(LegalHub) },
      { path: APP_SCREENS.legalSearch.path.slice(1), element: <Navigate to="/legal#legal-search" replace /> },
      { path: APP_SCREENS.communityCenter.path.slice(1), element: withSuspense(CommunityCenterPage) },
      { path: APP_SCREENS.settings.path.slice(1), element: withSuspense(SettingsHub) },
      { path: APP_SCREENS.autoApply.path.slice(1), element: <Navigate to="/settings?tab=auto-apply" replace /> },
      { path: APP_SCREENS.billing.path.slice(1), element: withSuspense(BillingPage) },
      { path: APP_SCREENS.faq.path.slice(1), element: withSuspense(FAQPage) },

      ...LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => ({
        path: from.slice(1),
        element: <Navigate to={to} replace />,
      })),
      { path: 'security', element: withSuspense(SecurityPage) },
      { path: 'radar', element: withSuspense(JobRadar) },
    ],
  },
]);
