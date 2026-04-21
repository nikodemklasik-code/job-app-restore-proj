import { PHASE_5_6_MODULES } from '@/features/product-core/config/phase56Modules';

export const getPhase56ModuleTitles = () => PHASE_5_6_MODULES.map((m) => m.title);
export const getPhase56Routes = () => PHASE_5_6_MODULES.map((m) => m.route);
export { PHASE_5_6_MODULES };
