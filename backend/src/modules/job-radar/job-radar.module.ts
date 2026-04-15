import { db } from '../../db/index.js';
import type { JobRadarDb } from './job-radar-database.types.js';
import { DrizzleTransactionManager } from '../../shared/db/drizzle-transaction-manager.js';
import { InputNormalizerService } from './infrastructure/services/input-normalizer.service.js';
import { FingerprintService } from './infrastructure/services/fingerprint.service.js';
import { PiiSanitizerService } from './infrastructure/services/pii-sanitizer.service.js';
import { QuotaService } from './application/services/quota.service.js';
import { IdempotencyService } from './application/services/idempotency.service.js';
import { StartScanHandler } from './application/handlers/start-scan.handler.js';
import { GetScanStatusHandler } from './application/handlers/get-scan-status.handler.js';
import { GetReportHandler } from './application/handlers/get-report.handler.js';
import { SourceFetchHandler } from './application/handlers/source-fetch.handler.js';
import { ParseSourceHandler } from './application/handlers/parse-source.handler.js';
import { ScanOrchestratorService } from './application/services/scan-orchestrator.service.js';
import { ScoringEngineService } from './application/services/scoring-engine.service.js';
import { ReportComposerService } from './application/services/report-composer.service.js';
import { ConfidenceSummaryBuilder } from './application/services/confidence-summary.builder.js';
import { OutboxPublisherService } from './infrastructure/services/outbox-publisher.service.js';
import type { QueuePublisher } from './infrastructure/services/outbox-publisher.service.js';
import { ScanRequestedWorker } from './infrastructure/workers/scan-requested.worker.js';
import { SourceFetchWorker } from './infrastructure/workers/source-fetch.worker.js';
import { ParseSourceWorker } from './infrastructure/workers/parse-source.worker.js';
import { OfficialSiteCollector } from './infrastructure/collectors/official-site.collector.js';
import { RegistryCollector } from './infrastructure/collectors/registry.collector.js';
import { RegistryLookupStubClient } from './infrastructure/collectors/registry-lookup.stub.js';
import { JobPostParser } from './infrastructure/parsers/job-post.parser.js';
import { RegistryParser } from './infrastructure/parsers/registry.parser.js';
import { DrizzleRadarScanRepository } from './infrastructure/repositories/drizzle-radar-scan.repository.js';
import { DrizzleRadarReportRepository } from './infrastructure/repositories/drizzle-radar-report.repository.js';
import { DrizzleRadarOutboxRepository } from './infrastructure/repositories/drizzle-radar-outbox.repository.js';
import { DrizzleRadarSourceRepository } from './infrastructure/repositories/drizzle-radar-source.repository.js';
import { DrizzleRadarSignalRepository } from './infrastructure/repositories/drizzle-radar-signal.repository.js';
import { DrizzleRadarScoreRepository } from './infrastructure/repositories/drizzle-radar-score.repository.js';
import { DrizzleRadarFindingRepository } from './infrastructure/repositories/drizzle-radar-finding.repository.js';
import { DrizzleRadarBenchmarkRepository } from './infrastructure/repositories/drizzle-radar-benchmark.repository.js';
import { BenchmarkEngineService } from './application/services/benchmark-engine.service.js';
import { ComputeBenchmarkHandler } from './application/handlers/compute-benchmark.handler.js';
import { SourceDedupService } from './application/services/source-dedup.service.js';
import { ConflictResolverService } from './application/services/conflict-resolver.service.js';
import { OverrideRuleEngine } from './application/services/override-rule-engine.service.js';
import { DeduplicateSourcesHandler } from './application/handlers/deduplicate-sources.handler.js';
import { ResolveConflictsHandler } from './application/handlers/resolve-conflicts.handler.js';
import { ApplyOverridesHandler } from './application/handlers/apply-overrides.handler.js';
import { DrizzleRadarComplaintRepository } from './infrastructure/repositories/drizzle-radar-complaint.repository.js';
import { InMemoryJobRadarConfigRepository } from './infrastructure/repositories/in-memory-job-radar-config.repository.js';
import { JobRadarKillSwitchService } from './application/services/job-radar-kill-switch.service.js';
import { CreateComplaintHandler } from './application/handlers/create-complaint.handler.js';
import { ReviewFindingHandler } from './application/handlers/review-finding.handler.js';
import { ListComplaintsHandler } from './application/handlers/list-complaints.handler.js';
import { UpdateKillSwitchHandler } from './application/handlers/update-kill-switch.handler.js';

/** Process-local kill-switch + config; swap for DB-backed flags in multi-instance deployments. */
const jobRadarSharedConfigRepository = new InMemoryJobRadarConfigRepository();

export type CreateJobRadarModuleOptions = {
  db?: JobRadarDb;
  queuePublisher?: QueuePublisher;
};

export function createJobRadarModule(options: CreateJobRadarModuleOptions = {}) {
  const database = options.db ?? (db as JobRadarDb);

  const transactionManager = new DrizzleTransactionManager(database);

  const scanRepository = new DrizzleRadarScanRepository(database);
  const reportRepository = new DrizzleRadarReportRepository(database);
  const outboxRepository = new DrizzleRadarOutboxRepository(database);
  const sourceRepository = new DrizzleRadarSourceRepository(database);
  const signalRepository = new DrizzleRadarSignalRepository(database);
  const scoreRepository = new DrizzleRadarScoreRepository(database);
  const findingRepository = new DrizzleRadarFindingRepository(database);
  const benchmarkRepository = new DrizzleRadarBenchmarkRepository(database);
  const complaintRepository = new DrizzleRadarComplaintRepository(database);

  const inputNormalizer = new InputNormalizerService();
  const fingerprintService = new FingerprintService();
  const piiSanitizer = new PiiSanitizerService();
  const quotaService = new QuotaService();
  const idempotencyService = new IdempotencyService();

  const registryLookupClient = new RegistryLookupStubClient();
  const collectors = [new OfficialSiteCollector(), new RegistryCollector(registryLookupClient)];
  const parsers = [new JobPostParser(), new RegistryParser()];

  const startScanHandler = new StartScanHandler(
    scanRepository,
    outboxRepository,
    inputNormalizer,
    fingerprintService,
    quotaService,
    idempotencyService,
    transactionManager,
  );

  const getScanStatusHandler = new GetScanStatusHandler(scanRepository, reportRepository);

  const confidenceSummaryBuilder = new ConfidenceSummaryBuilder();
  const killSwitchService = new JobRadarKillSwitchService(jobRadarSharedConfigRepository);

  const benchmarkEngine = new BenchmarkEngineService(signalRepository, benchmarkRepository);
  const computeBenchmarkHandler = new ComputeBenchmarkHandler(benchmarkEngine, outboxRepository);

  const scoringEngine = new ScoringEngineService(
    signalRepository,
    scoreRepository,
    findingRepository,
    benchmarkRepository,
  );

  const reportComposer = new ReportComposerService(
    reportRepository,
    scoreRepository,
    sourceRepository,
    signalRepository,
    findingRepository,
    confidenceSummaryBuilder,
    killSwitchService,
  );

  const getReportHandler = new GetReportHandler(
    reportRepository,
    findingRepository,
    scoreRepository,
    reportComposer,
    killSwitchService,
  );

  const createComplaintHandler = new CreateComplaintHandler(
    complaintRepository,
    reportRepository,
    scanRepository,
    findingRepository,
  );

  const reviewFindingHandler = new ReviewFindingHandler(findingRepository, complaintRepository);

  const listComplaintsHandler = new ListComplaintsHandler(complaintRepository);

  const updateKillSwitchHandler = new UpdateKillSwitchHandler(jobRadarSharedConfigRepository);

  const sourceDedupService = new SourceDedupService();
  const conflictResolverService = new ConflictResolverService();
  const overrideRuleEngine = new OverrideRuleEngine();

  const deduplicateSourcesHandler = new DeduplicateSourcesHandler(
    sourceRepository,
    outboxRepository,
    sourceDedupService,
  );

  const resolveConflictsHandler = new ResolveConflictsHandler(signalRepository, conflictResolverService);

  const applyOverridesHandler = new ApplyOverridesHandler(
    scoreRepository,
    findingRepository,
    signalRepository,
    reportRepository,
    overrideRuleEngine,
  );

  const orchestrator = new ScanOrchestratorService(
    scanRepository,
    sourceRepository,
    outboxRepository,
    scoringEngine,
    reportComposer,
    deduplicateSourcesHandler,
    resolveConflictsHandler,
    applyOverridesHandler,
    computeBenchmarkHandler,
  );

  const sourceFetchHandler = new SourceFetchHandler(
    sourceRepository,
    outboxRepository,
    collectors,
    piiSanitizer,
  );

  const parseSourceHandler = new ParseSourceHandler(
    sourceRepository,
    signalRepository,
    outboxRepository,
    parsers,
  );

  const noopPublisher: QueuePublisher = {
    async publish() {
      /* no-op — workers poll outbox in-process */
    },
  };

  const outboxPublisher = new OutboxPublisherService(
    outboxRepository,
    options.queuePublisher ?? noopPublisher,
  );

  const scanRequestedWorker = new ScanRequestedWorker(orchestrator);
  const sourceFetchWorker = new SourceFetchWorker(sourceFetchHandler, orchestrator);
  const parseSourceWorker = new ParseSourceWorker(parseSourceHandler, orchestrator);

  return {
    db: database,
    repositories: {
      scanRepository,
      reportRepository,
      outboxRepository,
      sourceRepository,
      signalRepository,
      scoreRepository,
      findingRepository,
      benchmarkRepository,
      complaintRepository,
      jobRadarConfigRepository: jobRadarSharedConfigRepository,
    },
    handlers: {
      startScanHandler,
      getScanStatusHandler,
      getReportHandler,
      sourceFetchHandler,
      parseSourceHandler,
      createComplaintHandler,
      reviewFindingHandler,
      listComplaintsHandler,
      updateKillSwitchHandler,
    },
    services: {
      outboxPublisher,
      orchestrator,
      scoringEngine,
      reportComposer,
      benchmarkEngine,
      computeBenchmarkHandler,
      sourceDedupService,
      conflictResolverService,
      overrideRuleEngine,
      killSwitchService,
    },
    workers: {
      scanRequestedWorker,
      sourceFetchWorker,
      parseSourceWorker,
    },
  };
}

let cached: ReturnType<typeof createJobRadarModule> | null = null;

export function getJobRadarModule(): ReturnType<typeof createJobRadarModule> {
  if (!cached) cached = createJobRadarModule();
  return cached;
}
