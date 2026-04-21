import type { ProductModuleReadiness } from '../types/product.types';

export const PHASE_56_MODULES: ProductModuleReadiness[] = [
  {
    id: 'applications-review',
    name: 'Applications & Review',
    status: 'ready',
    summary: 'Core pipeline and review queue are active and stable.',
    owner: 'Product Core',
  },
  {
    id: 'practice-shell',
    name: 'Practice Shell UI',
    status: 'in_progress',
    summary: 'Shared shell is available and being progressively adopted in modules.',
    owner: 'Frontend',
  },
  {
    id: 'billing-visibility',
    name: 'Billing Visibility Layer',
    status: 'planned',
    summary: 'Common credit-cost view models are prepared for wider rollout.',
    owner: 'Billing',
  },
];

