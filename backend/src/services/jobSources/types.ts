export interface SourceJob {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  /** Annual salary minimum (normalized from any period to yearly). */
  salaryMin: number | null;
  /** Annual salary maximum (normalized from any period to yearly). */
  salaryMax: number | null;
  /** Original salary period as detected: 'hour' | 'day' | 'week' | 'month' | 'year'. */
  salaryPeriod?: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
  /** Original salary min value in the detected period (not normalized). */
  salaryOriginalMin?: number | null;
  /** Original salary max value in the detected period (not normalized). */
  salaryOriginalMax?: number | null;
  /** Currency: GBP, USD, EUR, PLN etc. */
  salaryCurrency?: string | null;
  /** Human-readable salary line preserved from the listing. */
  salaryText?: string | null;
  workMode: string | null;
  /** full-time | part-time | contract | temporary | permanent | internship | apprenticeship */
  contractType?: string | null;
  /** E.g. "37.5 hours per week", "Mon-Fri 9am-5pm". */
  workingHours?: string | null;
  /** Entry / Junior / Mid / Senior / Lead / etc. */
  experienceLevel?: string | null;
  /** Benefits mentioned (pension, private healthcare, etc.). */
  benefits?: string[];
  requirements: string[];
  /** Qualifications & education requirements. */
  qualifications?: string[];
  /** Responsibilities / "what you'll do". */
  responsibilities?: string[];
  /** Employer contact email extracted from description. */
  employerEmail?: string | null;
  postedAt: string;
  /** When the role starts (if stated). */
  startDate?: string | null;
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
