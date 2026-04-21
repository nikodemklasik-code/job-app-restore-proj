import { PHASE_56_MODULES } from '@/features/product-core/config/phase56Modules';

export const phase56Readiness = {
  title: 'Phase 5–6 · Product Core readiness',
  modules: PHASE_56_MODULES,
};

export const PHASE_5_6_READINESS = phase56Readiness;

export function getPhase56ModuleTitles(): string[] {
  return PHASE_56_MODULES.map((module) => module.name);
}

export function getPhase56Routes(): string[] {
  return ['/applications', '/review', '/billing'];
}
