export type ProviderName =
  | 'reed'
  | 'adzuna'
  | 'jooble'
  | 'indeed-browser'
  | 'gumtree'
  | 'totaljobs'
  | 'cv-library'
  | 'findajob'
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
  isExternalProvider?: boolean;
}

export const EXTERNAL_JOB_PROVIDER_NAMES: ProviderName[] = [
  'reed',
  'adzuna',
  'jooble',
  'indeed-browser',
  'gumtree',
  'totaljobs',
  'cv-library',
  'findajob',
];

export const JOB_SOURCE_CATALOG: JobSourceCatalogEntry[] = [
  {
    name: 'reed',
    label: 'Reed',
    description: 'UK job board via official API. Enabling this source allows MultivoHub to search Reed listings for your job search.',
    icon: '🔴',
    requiresApiKey: 'REED_API_KEY',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
    isExternalProvider: true,
  },
  {
    name: 'adzuna',
    label: 'Adzuna',
    description: 'Global job search aggregator. Enabling this source allows MultivoHub to search Adzuna listings for your job search.',
    icon: '🟠',
    requiresApiKey: 'ADZUNA_APP_ID',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
    isExternalProvider: true,
  },
  {
    name: 'jooble',
    label: 'Jooble',
    description: 'International job search aggregator. Enabling this source allows MultivoHub to search Jooble listings for your job search.',
    icon: '🟡',
    requiresApiKey: 'JOOBLE_API_KEY',
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'api',
    isExternalProvider: true,
  },
  {
    name: 'indeed-browser',
    label: 'Indeed',
    description: 'Job board searched through a saved browser session or web scanning when direct API access is unavailable. Enabling this source is your consent to use it for search.',
    icon: '🔵',
    requiresApiKey: null,
    requiresSession: true,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
    isExternalProvider: true,
  },
  {
    name: 'gumtree',
    label: 'Gumtree',
    description: 'UK classifieds job listings searched through a saved browser session or web scanning. Enabling this source is your consent to use it for search.',
    icon: '🟢',
    requiresApiKey: null,
    requiresSession: true,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
    isExternalProvider: true,
  },
  {
    name: 'totaljobs',
    label: 'Totaljobs',
    description: 'UK job board source for web-scanned listings when no direct API is available. Enabling this source is your consent to use it for search.',
    icon: '🟣',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
    isExternalProvider: true,
  },
  {
    name: 'cv-library',
    label: 'CV-Library',
    description: 'UK CV-Library job board source for web-scanned listings when no direct API is available. Enabling this source is your consent to use it for search.',
    icon: '📘',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
    isExternalProvider: true,
  },
  {
    name: 'findajob',
    label: 'Find a Job',
    description: 'UK government Find a Job source. Enabling this source allows MultivoHub to search public listings for your job search.',
    icon: '🇬🇧',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'browser',
    isExternalProvider: true,
  },
  {
    name: 'database',
    label: 'Saved Jobs',
    description: 'Jobs previously saved to your database. This is a local product source, not an external provider consent.',
    icon: '💾',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'local',
    isExternalProvider: false,
  },
  {
    name: 'manual',
    label: 'Manual Entries',
    description: 'Jobs you have added manually. This is a local product source, not an external provider consent.',
    icon: '✍️',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: true,
    category: 'local',
    isExternalProvider: false,
  },
  {
    name: 'openai-discovery',
    label: 'AI Discovery',
    description: 'AI-assisted discovery tailored to your profile. This is a product feature, not a job board provider consent.',
    icon: '🤖',
    requiresApiKey: 'OPENAI_API_KEY',
    requiresSession: false,
    isAiPowered: true,
    defaultEnabled: false,
    category: 'ai',
    isExternalProvider: false,
  },
  {
    name: 'company-targets',
    label: 'Company Targets',
    description: 'Watch jobs from your target companies. This is a product feature, not a job board provider consent.',
    icon: '🎯',
    requiresApiKey: null,
    requiresSession: false,
    isAiPowered: false,
    defaultEnabled: false,
    category: 'local',
    isExternalProvider: false,
  },
];
