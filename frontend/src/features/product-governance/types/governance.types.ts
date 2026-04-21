import type { ReadinessStatus } from '@/features/product-core/types/product.types';

export type GovernanceModuleReadiness = {
  id: string;
  area: string;
  status: ReadinessStatus;
  note: string;
};

