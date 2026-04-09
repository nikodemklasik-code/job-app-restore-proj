import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import AppShell from './components/layout/AppShell';

const AuthPage = lazy(() => import('./app/auth/AuthPage'));
const DashboardPage = lazy(() => import('./app/dashboard/DashboardPage'));
const JobsDiscovery = lazy(() => import('./app/jobs/JobsDiscovery'));
const ApplicationsPipeline = lazy(() => import('./app/applications/ApplicationsPipeline'));
const ReviewQueue = lazy(() => import('./app/review/ReviewQueue'));
const AssistantPage = lazy(() => import('./app/assistant/AssistantPage'));
const InterviewPractice = lazy(() => import('./app/interview/InterviewPractice'));
const ProfilePage = lazy(() => import('./app/profile/ProfilePage'));
const BillingPage = lazy(() => import('./app/billing/BillingPage'));
const SettingsHub = lazy(() => import('./app/settings/SettingsHub'));
const SecurityPage = lazy(() => import('./app/settings/SecurityPage'));
const StyleStudio = lazy(() => import('./app/style/StyleStudio'));
const UKSalaryCalculator = lazy(() => import('./app/salary/UKSalaryCalculator'));
const LegalHub = lazy(() => import('./app/legal/LegalHub'));
const TermsPage = lazy(() => import('./app/legal/TermsPage'));
const PrivacyPage = lazy(() => import('./app/legal/PrivacyPage'));
const ReportsHub = lazy(() => import('./app/reports/ReportsHub'));
const AutoApplyPage = lazy(() => import('./app/autopilot/AutoApplyPage'));
const SkillsLab = lazy(() => import('./app/skills/SkillsLab'));

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
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(DashboardPage) },
      { path: 'jobs', element: withSuspense(JobsDiscovery) },
      { path: 'applications', element: withSuspense(ApplicationsPipeline) },
      { path: 'review', element: withSuspense(ReviewQueue) },
      { path: 'assistant', element: withSuspense(AssistantPage) },
      { path: 'interview', element: withSuspense(InterviewPractice) },
      { path: 'profile', element: withSuspense(ProfilePage) },
      { path: 'billing', element: withSuspense(BillingPage) },
      { path: 'settings', element: withSuspense(SettingsHub) },
      { path: 'security', element: withSuspense(SecurityPage) },
      { path: 'style-studio', element: withSuspense(StyleStudio) },
      { path: 'salary', element: withSuspense(UKSalaryCalculator) },
      { path: 'legal', element: withSuspense(LegalHub) },
      { path: 'reports', element: withSuspense(ReportsHub) },
      { path: 'auto-apply', element: withSuspense(AutoApplyPage) },
      { path: 'skills', element: withSuspense(SkillsLab) },
    ],
  },
]);
