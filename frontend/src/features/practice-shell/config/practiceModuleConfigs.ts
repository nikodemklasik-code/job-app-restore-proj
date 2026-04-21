import type { PracticeAccent } from '../types/practice.types';

export type PracticeModuleKey = 'interview' | 'coach' | 'negotiation' | 'warmup' | 'case-practice';

export type PracticeModuleConfig = {
  key: PracticeModuleKey;
  title: string;
  subtitle: string;
  accent: PracticeAccent;
  path: string;
};

/**
 * Presentation-only defaults for practice modules.
 * Keep domain logic in existing pages/stores/services.
 */
export const PRACTICE_MODULE_CONFIGS: Record<PracticeModuleKey, PracticeModuleConfig> = {
  interview: {
    key: 'interview',
    title: 'Interview Practice',
    subtitle: 'Simulacje pytań i feedback odpowiedzi.',
    accent: 'sky',
    path: '/interview',
  },
  coach: {
    key: 'coach',
    title: 'Coach',
    subtitle: 'Trening narracji i pewności wypowiedzi.',
    accent: 'violet',
    path: '/coach',
  },
  negotiation: {
    key: 'negotiation',
    title: 'Negotiation',
    subtitle: 'Ćwiczenie języka wynagrodzenia i granic.',
    accent: 'amber',
    path: '/negotiation',
  },
  warmup: {
    key: 'warmup',
    title: 'Daily Warmup',
    subtitle: 'Krótkie sesje rozgrzewkowe.',
    accent: 'rose',
    path: '/warmup',
  },
  'case-practice': {
    key: 'case-practice',
    title: 'Case Practice',
    subtitle: 'Scenariusze sytuacyjne pod presją.',
    accent: 'sky',
    path: '/case-practice',
  },
};

