import type { CreditCostViewModel } from '@/types/billing';

export type PracticeModuleKey = 'dailyWarmup' | 'coach' | 'interview' | 'negotiation';

export interface PracticeHeroData {
  eyebrow?: string;
  title: string;
  subtitle: string;
}

export interface PracticeModeOption {
  id: string;
  title: string;
  description: string;
  badge?: string;
  durationLabel?: string;
  cost: CreditCostViewModel;
  recommended?: boolean;
}

export interface PracticeSupportItem {
  id: string;
  title: string;
  body: string;
}

export interface PracticeAction {
  id: string;
  label: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export interface PracticePageConfig {
  module: PracticeModuleKey;
  hero: PracticeHeroData;
  modes: PracticeModeOption[];
  supportItems?: PracticeSupportItem[];
  primaryActions: PracticeAction[];
  secondaryActions?: PracticeAction[];
}
