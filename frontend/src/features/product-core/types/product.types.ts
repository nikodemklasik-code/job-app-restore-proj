export type ReadinessStatus = 'ready' | 'in_progress' | 'blocked' | 'planned';

export type ProductModuleReadiness = {
  id: string;
  name: string;
  status: ReadinessStatus;
  summary: string;
  owner?: string;
};

