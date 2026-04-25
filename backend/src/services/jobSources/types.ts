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

export interface ProviderDiagnostic {
  provider: string;
  query: string;
  location: string;
  count: number;
  durationMs: number | null;
  error?: string;
}

export interface DiscoveryDiagnostics {
  traceId: string;
  query: string;
  location: string;
  providers: string[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  rawCount: number;
  dedupedCount: number;
  finalCount: number;
  failures: ProviderFailure[];
  providerDiagnostics: ProviderDiagnostic[];
}

export interface DiscoveryResult {
  /** Ready job ads returned by real providers. Never AI-generated synthetic listings. */
  jobs: SourceJob[];
  failures: ProviderFailure[];
  totalRaw: number;
  deduped: number;
  /** Debug metadata for tracing empty searches. This is not the product result. */
  diagnostics?: DiscoveryDiagnostics;
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
