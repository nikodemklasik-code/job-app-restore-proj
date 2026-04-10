export type ProviderName =
  | 'reed'
  | 'adzuna'
  | 'jooble'
  | 'indeed-browser'
  | 'gumtree'
  | 'database'
  | 'manual'
  | 'openai-discovery'
  | 'company-targets';

export interface JobSourceCatalogEntry {
  name: ProviderName;
  label: string;
  description: string;
  icon: string;
  requiresApiKey: string | null;
  requiresSession: boolean;
  isAiPowered: boolean;
  defaultEnabled: boolean;
  category: 'api' | 'browser' | 'ai' | 'local';
}

export const JOB_SOURCE_CATALOG: JobSourceCatalogEntry[] = [
  {
    name: 'reed',
    label: 'Reed',
    description: 'UK\'s largest job board via official API',
    icon: '🔴',
    requiresApiKey: 'REED_API_KEY',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
  },
  {
    name: 'adzuna',
    label: 'Adzuna',
    description: 'Global job search engine aggregator',
    icon: '🟠',
    requiresApiKey: 'ADZUNA_APP_ID',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
  },
  {
    name: 'jooble',
    label: 'Jooble',
    description: 'International job search aggregator',
    icon: '🟡',
    requiresApiKey: 'JOOBLE_API_KEY',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
  },
  {
    name: 'indeed-browser',
    label: 'Indeed',
    description: 'World\'s largest job site via browser session',
    icon: '🔵',
    requiresApiKey: null,
    requiresSession: true,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
  },
  {
    name: 'gumtree',
    label: 'Gumtree',
    description: 'UK classifieds job listings via browser session',
    icon: '🟢',
    requiresApiKey: null,
    requiresSession: true,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
  },
  {
    name: 'database',
    label: 'Saved Jobs',
    description: 'Jobs previously saved to your database',
    icon: '💾',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'local',
  },
  {
    name: 'manual',
    label: 'Manual Entries',
    description: 'Jobs you have added manually',
    icon: '✍️',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'local',
  },
  {
    name: 'openai-discovery',
    label: 'AI Discovery',
    description: 'AI-powered job discovery tailored to your profile',
    icon: '🤖',
    requiresApiKey: 'OPENAI_API_KEY',
    requiresSession: false,
    isAiPowered: true,
    defaultEnabled: false,
    category: 'ai',
  },
  {
    name: 'company-targets',
    label: 'Company Targets',
    description: 'Watch jobs from your target companies',
    icon: '🎯',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'local',
  },
];
