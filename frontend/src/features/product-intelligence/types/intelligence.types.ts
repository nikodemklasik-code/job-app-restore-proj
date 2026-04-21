import type { ReadinessStatus } from '@/features/product-core/types/product.types';

export type IntelligenceModuleReadiness = {
  id: string;
  capability: string;
  status: ReadinessStatus;
  signal: string;
};

