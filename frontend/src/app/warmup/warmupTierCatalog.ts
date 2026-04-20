/** Single source of truth for Daily Warmup length tiers and credit cost (UI + spend payload). */

export type WarmupTier = {
  id: string;
  seconds: number;
  credits: number;
  title: string;
  subtitle: string;
  accent: 'amber' | 'sky' | 'violet' | 'rose';
  icon: 'zap' | 'timer' | 'sparkles' | 'crown';
};

export const WARMUP_TIERS: WarmupTier[] = [
  {
    id: 'spark',
    seconds: 15,
    credits: 0,
    title: 'Quick spark',
    subtitle: 'One question · 15s answer · No category · Free once per day',
    accent: 'amber',
    icon: 'zap',
  },
  {
    id: 'focus',
    seconds: 30,
    credits: 1,
    title: 'Focus',
    subtitle: '30s · Pick a category · 1 credit (fits as many short answers as the timer allows)',
    accent: 'sky',
    icon: 'timer',
  },
  {
    id: 'depth',
    seconds: 45,
    credits: 2,
    title: 'Depth',
    subtitle: '45s · Category focus · 2 credits',
    accent: 'violet',
    icon: 'sparkles',
  },
  {
    id: 'full',
    seconds: 60,
    credits: 3,
    title: 'Full minute',
    subtitle: '60s · More room to land STAR · 3 credits',
    accent: 'rose',
    icon: 'crown',
  },
];
