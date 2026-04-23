export type AppScreenKey =
  | 'dashboard'
  | 'profile'
  | 'documentHub'
  | 'documentUpload'
  | 'styleStudio'
  | 'jobs'
  | 'applications'
  | 'applicationsReview'
  | 'assistant'
  | 'dailyWarmup'
  | 'interview'
  | 'coach'
  | 'negotiation'
  | 'caseStudy'
  | 'skills'
  | 'reports'
  | 'jobRadar'
  | 'salaryCalculator'
  | 'legal'
  | 'legalSearch'
  | 'communityCenter'
  | 'settings'
  | 'autoApply'
  | 'billing'
  | 'faq';

export interface AppScreenDefinition {
  key: AppScreenKey;
  label: string;
  path: string;
  topLevel: boolean;
  parentKey?: AppScreenKey;
  showInSidebar: boolean;
}

export const APP_SCREENS: Record<AppScreenKey, AppScreenDefinition> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', path: '/dashboard', topLevel: true, showInSidebar: true },
  profile: { key: 'profile', label: 'Profile', path: '/profile', topLevel: true, showInSidebar: true },
  documentHub: { key: 'documentHub', label: 'Document Hub', path: '/documents', topLevel: true, showInSidebar: true },
  documentUpload: { key: 'documentUpload', label: 'Document Upload', path: '/documents/upload', topLevel: false, parentKey: 'documentHub', showInSidebar: false },
  styleStudio: { key: 'styleStudio', label: 'Style Studio', path: '/documents/style-studio', topLevel: false, parentKey: 'documentHub', showInSidebar: false },
  jobs: { key: 'jobs', label: 'Jobs Discovery', path: '/jobs', topLevel: true, showInSidebar: true },
  applications: { key: 'applications', label: 'Applications Pipeline', path: '/applications', topLevel: true, showInSidebar: true },
  applicationsReview: { key: 'applicationsReview', label: 'Review Queue', path: '/applications-review', topLevel: true, showInSidebar: true },
  assistant: { key: 'assistant', label: 'AI Assistant', path: '/assistant', topLevel: false, showInSidebar: false },
  dailyWarmup: { key: 'dailyWarmup', label: 'Daily Warmup', path: '/warmup', topLevel: true, showInSidebar: true },
  interview: { key: 'interview', label: 'Interview', path: '/interview', topLevel: true, showInSidebar: true },
  coach: { key: 'coach', label: 'Coach', path: '/coach', topLevel: true, showInSidebar: true },
  negotiation: { key: 'negotiation', label: 'Negotiation', path: '/negotiation', topLevel: true, showInSidebar: true },
  caseStudy: { key: 'caseStudy', label: 'Case Study', path: '/case-study', topLevel: false, showInSidebar: false },
  skills: { key: 'skills', label: 'Skill Lab', path: '/skills', topLevel: true, showInSidebar: true },
  reports: { key: 'reports', label: 'Reports', path: '/reports', topLevel: true, showInSidebar: true },
  jobRadar: { key: 'jobRadar', label: 'Job Radar', path: '/job-radar', topLevel: false, showInSidebar: false },
  salaryCalculator: { key: 'salaryCalculator', label: 'Salary Calculator', path: '/salary-calculator', topLevel: false, showInSidebar: false },
  legal: { key: 'legal', label: 'Legal Hub', path: '/legal', topLevel: true, showInSidebar: true },
  legalSearch: { key: 'legalSearch', label: 'Legal Search', path: '/legal/search', topLevel: false, parentKey: 'legal', showInSidebar: false },
  communityCenter: { key: 'communityCenter', label: 'Community Centre', path: '/community', topLevel: true, showInSidebar: true },
  settings: { key: 'settings', label: 'Settings', path: '/settings', topLevel: true, showInSidebar: true },
  autoApply: { key: 'autoApply', label: 'Auto Apply', path: '/settings/auto-apply', topLevel: false, parentKey: 'settings', showInSidebar: false },
  billing: { key: 'billing', label: 'Billing', path: '/billing', topLevel: true, showInSidebar: true },
  faq: { key: 'faq', label: 'FAQ', path: '/faq', topLevel: false, showInSidebar: false },
};

export const SIDEBAR_SCREEN_ORDER: AppScreenKey[] = [
  'dashboard',
  'profile',
  'documentHub',
  'jobs',
  'applications',
  'applicationsReview',
  'dailyWarmup',
  'interview',
  'coach',
  'negotiation',
  'skills',
  'reports',
  'legal',
  'communityCenter',
  'billing',
  'settings',
];

export const LEGACY_ROUTE_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: '/review', to: APP_SCREENS.applicationsReview.path },
  { from: '/case-practice', to: APP_SCREENS.caseStudy.path },
  { from: '/salary', to: APP_SCREENS.salaryCalculator.path },
  { from: '/auto-apply', to: APP_SCREENS.autoApply.path },
  { from: '/style-studio', to: APP_SCREENS.styleStudio.path },
  { from: '/interview-warmup', to: APP_SCREENS.dailyWarmup.path },
  { from: '/negotiation-coach', to: APP_SCREENS.negotiation.path },
  { from: '/ai-analysis', to: APP_SCREENS.reports.path },
  { from: '/jobs-discovery', to: APP_SCREENS.jobs.path },
];
