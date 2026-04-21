export type AppScreenKey =
  | 'dashboard'
  | 'profile'
  | 'jobs'
  | 'applications'
  | 'reviewQueue'
  | 'assistant'
  | 'interviewPractice'
  | 'coach'
  | 'dailyWarmup'
  | 'negotiation'
  | 'skills'
  | 'aiAnalysis'
  | 'casePractice'
  | 'jobRadar'
  | 'documents'
  | 'salary'
  | 'legal'
  | 'reports'
  | 'autoApply'
  | 'communityCentre'
  | 'settings'
  | 'security'
  | 'billing'
  | 'faq';

export interface AppScreenDefinition {
  path: string;
  label: string;
}

export const appScreens: Record<AppScreenKey, AppScreenDefinition> = {
  dashboard: { path: '/dashboard', label: 'Dashboard' },
  profile: { path: '/profile', label: 'Profile' },
  jobs: { path: '/jobs', label: 'Jobs' },
  applications: { path: '/applications', label: 'Applications' },
  reviewQueue: { path: '/review', label: 'Review queue' },
  assistant: { path: '/assistant', label: 'Assistant' },
  interviewPractice: { path: '/practice/interview', label: 'Interview' },
  coach: { path: '/practice/coach', label: 'Coach' },
  dailyWarmup: { path: '/practice/daily-warmup', label: 'Daily Warmup' },
  negotiation: { path: '/practice/negotiation', label: 'Negotiation' },
  skills: { path: '/skills', label: 'Skill Lab' },
  aiAnalysis: { path: '/ai-analysis', label: 'AI Analysis' },
  casePractice: { path: '/practice/case', label: 'Case Practice' },
  jobRadar: { path: '/job-radar', label: 'Job Radar' },
  documents: { path: '/documents', label: 'Document Lab' },
  salary: { path: '/salary', label: 'Salary Calculator' },
  legal: { path: '/legal', label: 'Legal Hub' },
  reports: { path: '/reports', label: 'Reports' },
  autoApply: { path: '/auto-apply', label: 'Auto Apply' },
  communityCentre: { path: '/settings', label: 'Community Centre' },
  settings: { path: '/settings', label: 'Settings' },
  security: { path: '/security', label: 'Security, passkeys & 2FA' },
  billing: { path: '/billing', label: 'Billing' },
  faq: { path: '/faq', label: 'FAQ' },
};

