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
  | 'skillLab'
  | 'reports'
  | 'jobRadar'
  | 'salaryCalculator'
  | 'legalHub'
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
  documentHub: { key: 'documentHub', label: 'Profile Documents', path: '/documents', topLevel: true, showInSidebar: true },
  documentUpload: { key: 'documentUpload', label: 'Document Intake', path: '/documents/upload', topLevel: false, parentKey: 'documentHub', showInSidebar: false },
  styleStudio: { key: 'styleStudio', label: 'Style Studio', path: '/documents/style-studio', topLevel: false, parentKey: 'documentHub', showInSidebar: false },
  jobs: { key: 'jobs', label: 'Jobs', path: '/jobs', topLevel: true, showInSidebar: true },
  applications: { key: 'applications', label: 'Applications', path: '/applications', topLevel: true, showInSidebar: true },
  applicationsReview: { key: 'applicationsReview', label: 'Applications Review', path: '/applications-review', topLevel: true, showInSidebar: true },
  assistant: { key: 'assistant', label: 'AI Assistant', path: '/assistant', topLevel: true, showInSidebar: true },
  dailyWarmup: { key: 'dailyWarmup', label: 'Daily Warm-up', path: '/warmup', topLevel: true, showInSidebar: true },
  interview: { key: 'interview', label: 'Interview', path: '/interview', topLevel: true, showInSidebar: true },
  coach: { key: 'coach', label: 'Coach', path: '/coach', topLevel: true, showInSidebar: true },
  negotiation: { key: 'negotiation', label: 'Negotiation', path: '/negotiation', topLevel: true, showInSidebar: true },
  caseStudy: { key: 'caseStudy', label: 'Case Practice', path: '/case-study', topLevel: true, showInSidebar: true },
  skillLab: { key: 'skillLab', label: 'Skill Lab', path: '/skills', topLevel: true, showInSidebar: true },
  reports: { key: 'reports', label: 'Reports', path: '/reports', topLevel: true, showInSidebar: true },
  jobRadar: { key: 'jobRadar', label: 'Job Radar', path: '/job-radar', topLevel: true, showInSidebar: true },
  salaryCalculator: { key: 'salaryCalculator', label: 'UK Salary Calculator', path: '/salary-calculator', topLevel: true, showInSidebar: true },
  legalHub: { key: 'legalHub', label: 'Legal Hub', path: '/legal', topLevel: true, showInSidebar: true },
  legalSearch: { key: 'legalSearch', label: 'Legal Search', path: '/legal/search', topLevel: false, parentKey: 'legalHub', showInSidebar: false },
  communityCenter: { key: 'communityCenter', label: 'Community Center', path: '/community', topLevel: true, showInSidebar: true },
  settings: { key: 'settings', label: 'Settings', path: '/settings', topLevel: true, showInSidebar: true },
  autoApply: { key: 'autoApply', label: 'Auto Apply', path: '/settings/auto-apply', topLevel: false, parentKey: 'settings', showInSidebar: false },
  billing: { key: 'billing', label: 'Billing', path: '/billing', topLevel: true, showInSidebar: true },
  faq: { key: 'faq', label: 'FAQ', path: '/faq', topLevel: true, showInSidebar: true },
};

export const SIDEBAR_SCREEN_ORDER: AppScreenKey[] = [
  'dashboard',
  'profile',
  'documentHub',
  'jobs',
  'applications',
  'applicationsReview',
  'assistant',
  'dailyWarmup',
  'interview',
  'coach',
  'negotiation',
  'caseStudy',
  'skillLab',
  'jobRadar',
  'reports',
  'salaryCalculator',
  'legalHub',
  'communityCenter',
  'settings',
  'billing',
  'faq',
];

export const LEGACY_ROUTE_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: '/review', to: APP_SCREENS.applicationsReview.path },
  { from: '/case-practice', to: APP_SCREENS.caseStudy.path },
  { from: '/salary', to: APP_SCREENS.salaryCalculator.path },
  { from: '/auto-apply', to: APP_SCREENS.autoApply.path },
  { from: '/style-studio', to: APP_SCREENS.styleStudio.path },
  { from: '/interview-warmup', to: APP_SCREENS.dailyWarmup.path },
  { from: '/negotiation-coach', to: APP_SCREENS.negotiation.path },
  { from: '/settings/community', to: APP_SCREENS.communityCenter.path },
  { from: '/ai-analysis', to: APP_SCREENS.reports.path },
];
