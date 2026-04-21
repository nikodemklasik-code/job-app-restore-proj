export type AppScreenKey =
  | 'dashboard'
  | 'profile'
  | 'jobs'
  | 'applications'
  | 'review'
  | 'documents'
  | 'assistant'
  | 'aiAnalysis'
  | 'skills'
  | 'jobRadar'
  | 'legal'
  | 'settings'
  | 'billing'
  | 'warmup'
  | 'coach'
  | 'interview'
  | 'negotiation';

export interface AppScreenDefinition {
  key: AppScreenKey;
  label: string;
  path: string;
  section:
    | 'mainFlow'
    | 'aiGrowth'
    | 'documents'
    | 'tools'
    | 'technical';
  navLabel?: string;
  title?: string;
}

export const APP_SCREENS: Record<AppScreenKey, AppScreenDefinition> = {
  dashboard: { key: 'dashboard', label: 'Dashboard', path: '/dashboard', section: 'mainFlow' },
  profile: { key: 'profile', label: 'Profile', path: '/profile', section: 'mainFlow' },
  jobs: { key: 'jobs', label: 'Jobs', path: '/jobs', section: 'mainFlow' },
  applications: { key: 'applications', label: 'Applications', path: '/applications', section: 'mainFlow' },
  review: { key: 'review', label: 'Review queue', path: '/review', section: 'mainFlow' },
  assistant: { key: 'assistant', label: 'Assistant', path: '/assistant', section: 'aiGrowth' },
  interview: { key: 'interview', label: 'Interview', path: '/interview', section: 'aiGrowth' },
  coach: { key: 'coach', label: 'Coach', path: '/coach', section: 'aiGrowth' },
  warmup: { key: 'warmup', label: 'Daily Warmup', path: '/warmup', section: 'aiGrowth' },
  negotiation: { key: 'negotiation', label: 'Negotiation', path: '/negotiation', section: 'aiGrowth' },
  skills: { key: 'skills', label: 'Skill Lab', path: '/skills', section: 'aiGrowth' },
  aiAnalysis: { key: 'aiAnalysis', label: 'AI Analysis', path: '/ai-analysis', section: 'aiGrowth' },
  jobRadar: { key: 'jobRadar', label: 'Job Radar', path: '/job-radar', section: 'aiGrowth' },
  documents: { key: 'documents', label: 'Document Lab', path: '/documents', section: 'documents' },
  legal: { key: 'legal', label: 'Legal Hub', path: '/legal', section: 'tools' },
  settings: { key: 'settings', label: 'Settings', path: '/settings', section: 'technical' },
  billing: { key: 'billing', label: 'Billing', path: '/billing', section: 'technical' },
};
