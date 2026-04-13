export interface SourceJob {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workMode: string | null;
  requirements: string[];
  postedAt: string;
  fitScore?: number;
}

export interface DiscoveryInput {
  query: string;
  location: string;
  limit: number;
  userId?: string;
  providers?: string[];
}

export interface ProviderFailure {
  provider: string;
  error: string;
}

export interface DiscoveryResult {
  jobs: SourceJob[];
  failures: ProviderFailure[];
  totalRaw: number;
  deduped: number;
}

export interface JobSourceProvider {
  name: string;
  label: string;
  readiness(): Promise<{ ready: boolean; reason?: string }>;
  discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]>;
}

export interface ProviderContext {
  sessionCookies?: Record<string, string>;
  storageState?: Record<string, string>;
  userId?: string;
}
