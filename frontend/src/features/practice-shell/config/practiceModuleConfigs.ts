import type { PracticePageConfig } from '../types/practice.types';

export const PRACTICE_MODULE_CONFIGS: Record<PracticePageConfig['module'], PracticePageConfig> = {
  dailyWarmup: {
    module: 'dailyWarmup',
    hero: { eyebrow: 'Daily Practice', title: 'Daily Warmup', subtitle: 'Light daily ritual to keep momentum.' },
    modes: [
      { id: 'quick', title: 'Quick Warmup', description: 'Fast repetition', cost: { type: 'free', label: 'Free allowance', credits: 0, freeAllowanceNote: 'Uses monthly warmup allowance when available.' }, recommended: true },
      { id: 'extended', title: 'Extended Warmup', description: 'Longer timed set', cost: { type: 'fixed', label: 'Fixed cost', credits: 2 } },
    ],
    supportItems: [{ id: 'pace', title: 'Low friction', body: 'Open and start in seconds.' }],
    primaryActions: [{ id: 'start', label: 'Start Warmup' }],
  },
  coach: {
    module: 'coach',
    hero: { eyebrow: 'Strategic guidance', title: 'Coach', subtitle: 'Reframe answers and improve interview positioning.' },
    modes: [
      { id: 'quick-reframe', title: 'Quick Reframe', description: 'Tactical response tune-up', cost: { type: 'fixed', label: 'Fixed cost', credits: 2 } },
      { id: 'deep-coaching', title: 'Deep Coaching', description: 'Full strategic coaching', cost: { type: 'estimated', label: 'Estimated spend', credits: null, estimatedMin: 4, estimatedMax: 10, approvalRule: { maxCostWithoutFurtherApproval: 8, requiresApproval: true } }, recommended: true },
    ],
    supportItems: [{ id: 'plan', title: 'Action plan', body: 'Get specific next steps for follow-up practice.' }],
    primaryActions: [{ id: 'continue', label: 'Continue coaching' }],
  },
  interview: {
    module: 'interview',
    hero: { eyebrow: 'Mock interview', title: 'Interview', subtitle: 'Realistic interview practice with structured feedback.' },
    modes: [
      { id: 'lite', title: 'Interview Lite', description: 'Short session', cost: { type: 'free', label: 'Free allowance', credits: 0, freeAllowanceNote: 'Free quota resets monthly.' } },
      { id: 'standard', title: 'Standard', description: 'Default practice depth', cost: { type: 'fixed', label: 'Fixed cost', credits: 4 }, recommended: true },
      { id: 'deep', title: 'Deep Practice', description: 'Longer adaptive interview', cost: { type: 'estimated', label: 'Estimated spend', credits: null, estimatedMin: 6, estimatedMax: 14, approvalRule: { maxCostWithoutFurtherApproval: 10, requiresApproval: true } } },
    ],
    supportItems: [{ id: 'summary', title: 'Session summary', body: 'Transcript, STAR feedback, and report export.' }],
    primaryActions: [{ id: 'start', label: 'Start interview' }],
  },
  negotiation: {
    module: 'negotiation',
    hero: { eyebrow: 'Offer strategy', title: 'Negotiations', subtitle: 'Salary and terms strategy with simulation mode.' },
    modes: [
      { id: 'strategy', title: 'Strategy', description: 'Draft negotiation responses', cost: { type: 'fixed', label: 'Fixed cost', credits: 3 }, recommended: true },
      { id: 'simulator', title: 'Simulation', description: 'Live back-and-forth simulation', cost: { type: 'estimated', label: 'Estimated spend', credits: null, estimatedMin: 5, estimatedMax: 12, approvalRule: { maxCostWithoutFurtherApproval: 9, requiresApproval: true } } },
    ],
    supportItems: [{ id: 'positioning', title: 'Positioning', body: 'Protect your floor while keeping relationship quality high.' }],
    primaryActions: [{ id: 'continue', label: 'Continue negotiation' }],
  },
};
