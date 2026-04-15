# JobRadar v1.1 — backend package structure

Stack-agnostic module layout (Node.js + TypeScript friendly), aligned with MySQL + Drizzle in this repo. See `backend/src/db/schemas/job-radar.ts` for the Drizzle schema.

## 1. Architecture goals

The backend should:

- Separate HTTP from domain logic.
- Separate orchestration from collectors and scoring.
- Support async processing (queues / workers).
- Support **partial success** (partial report is a normal outcome, not an exception).
- Stay **debuggable** (structured logs, metrics, trace context).

## 2. Proposed directory layout (logical)

```
src/
  modules/
    job-radar/
      api/
        job-radar.controller.ts
        job-radar.dto.ts
        job-radar.http.mapper.ts

      application/
        commands/
          start-scan.command.ts
          start-scan.handler.ts
          rescan-report.command.ts
          rescan-report.handler.ts
        queries/
          get-scan-status.query.ts
          get-scan-status.handler.ts
          get-report.query.ts
          get-report.handler.ts
        services/
          scan-orchestrator.service.ts
          scan-status.service.ts
          report-read.service.ts
          quota.service.ts
          idempotency.service.ts
          cache-lookup.service.ts

      domain/
        entities/
          radar-scan.entity.ts
          radar-report.entity.ts
          radar-score.entity.ts
          radar-source.entity.ts
          radar-signal.entity.ts
          radar-finding.entity.ts
          benchmark.entity.ts
        value-objects/
          fingerprint.vo.ts
          freshness.vo.ts
          confidence.vo.ts
          recommendation.vo.ts
          override-audit.vo.ts
        rules/
          partial-report.rule.ts
          freshness.rule.ts
          override.rule.ts
          low-confidence-cap.rule.ts
          source-priority.rule.ts
        repositories/
          radar-scan.repository.ts
          radar-report.repository.ts
          radar-source.repository.ts
          radar-signal.repository.ts
          benchmark.repository.ts
          outbox.repository.ts

      infrastructure/
        persistence/
          pg-radar-scan.repository.ts        # name kept from spec; implement as mysql/drizzle in this repo
          ...
        queues/
          queue.constants.ts
          publish-event.ts
          queue-consumer.ts
        collectors/
          official-site.collector.ts
          careers-page.collector.ts
          registry.collector.ts
          job-board.collector.ts
          review-site.collector.ts
          salary-aggregator.collector.ts
        parsers/
          ...
        resolvers/
          employer-resolver.service.ts
          canonical-url.service.ts
          location-normalizer.service.ts
          role-family-resolver.service.ts
        scoring/
          scoring-engine.service.ts
          employer-score.service.ts
          offer-score.service.ts
          market-pay-score.service.ts
          benefits-score.service.ts
          culture-fit-score.service.ts
          risk-score.service.ts
        fit/
          fit-engine.service.ts
        benchmark/
          benchmark-engine.service.ts
        dedup/
          source-dedup.service.ts
          conflict-resolver.service.ts
        compliance/
          pii-sanitizer.service.ts
          raw-content-ttl.service.ts
        observability/
          metrics.service.ts
          tracing.service.ts
          audit-log.service.ts

      jobs/
        handlers/
          scan-requested.handler.ts
          source-fetch.handler.ts
          parse-source.handler.ts
          aggregate-signals.handler.ts
          compute-benchmark.handler.ts
          compute-fit.handler.ts
          compute-scores.handler.ts
          apply-overrides.handler.ts
          compose-report.handler.ts
          finalize-scan.handler.ts

      mappers/
        report-response.mapper.ts
        scan-status.mapper.ts
        event-payload.mapper.ts

      constants/
        scan-status.constants.ts
        event-names.constants.ts
        scoring.constants.ts
        source-tier.constants.ts

      job-radar.module.ts

  shared/
    db/
    queue/
    http/
    utils/
    types/
```

## 3. Layer responsibilities

| Layer | Does | Does not |
| --- | --- | --- |
| **API** | Validate request shape, map DTOs, return HTTP | Business orchestration, scoring, partial-report rules |
| **Application** | Use cases, commands/queries, transactions at boundaries, call domain/app services | Raw SQL in controllers |
| **Domain** | Product rules, state transitions, caps, overrides, VO/entities | HTTP, queue adapters, external HTTP |
| **Infrastructure** | DB, queues, collectors, parsers, external IO, cache, metrics | Ad-hoc business rules in repositories |
| **Jobs** | Async handlers, pipeline stages, outbox consumers | Duplicating orchestration in random places |

## 4. Key services (contracts)

### 4.1 `StartScanHandler`

```ts
interface StartScanHandler {
  execute(command: StartScanCommand): Promise<StartScanResult>;
}
```

Responsibilities: quota, idempotency key, fingerprint, fresh cache lookup, create scan + report skeleton, enqueue `scan_requested` via outbox (transactional with state).

### 4.2 `ScanOrchestratorService`

```ts
interface ScanOrchestratorService {
  handleScanRequested(scanId: string): Promise<void>;
  finalize(scanId: string): Promise<void>;
}
```

Coordinates pipeline stages, state transitions, partial vs ready vs failed.

### 4.3 `EmployerResolverService`

Input: `employer_name`, `source_url`. Output: `employer_id`, `canonical_name`, `confidence`.

### 4.4 `JobRadarCollector`

```ts
interface JobRadarCollector {
  readonly sourceType: SourceType;
  readonly sourceQualityTier: 1 | 2 | 3;
  canHandle(input: CollectorInput): boolean;
  collect(input: CollectorInput): Promise<CollectorResult>;
}

type CollectorResult = {
  status: 'done' | 'blocked' | 'failed';
  sourceUrl: string;
  normalizedUrl?: string;
  title?: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
  blockReason?: string;
  errorCode?: string;
};
```

### 4.5 `JobRadarParser`

```ts
interface JobRadarParser {
  canParse(source: RadarSourceEntity): boolean;
  parse(source: RadarSourceEntity): Promise<ParsedSourceResult>;
}

type ParsedSourceResult = {
  containsOfferFields: boolean;
  extractedFields: Record<string, unknown>;
  signals: ExtractedSignalDraft[];
  fieldConfidence: Record<string, 'low' | 'medium' | 'high'>;
};
```

### 4.6 `SourceDedupService`

```ts
interface SourceDedupService {
  deduplicate(scanId: string): Promise<SourceClusterResult[]>;
}
```

### 4.7 `ConflictResolverService`

```ts
interface ConflictResolverService {
  resolve(signals: RadarSignalEntity[]): Promise<RadarSignalEntity[]>;
}
```

### 4.8 `BenchmarkEngineService`

```ts
interface BenchmarkEngineService {
  compute(scanId: string): Promise<BenchmarkResult>;
}
```

### 4.9 `FitEngineService`

```ts
interface FitEngineService {
  compute(scanId: string): Promise<FitResult>;
}
```

### 4.10 `ScoringEngineService`

```ts
interface ScoringEngineService {
  compute(scanId: string): Promise<ScoringResult>;
}
```

Delegates to sub-calculators; applies caps/normalization centrally.

### 4.11 `OverrideRuleEngine`

```ts
interface OverrideRuleEngine {
  apply(scanId: string): Promise<OverrideResult>;
}
```

### 4.12 `InsightComposerService`

```ts
interface InsightComposerService {
  compose(scanId: string): Promise<ComposedReport>;
}
```

## 5. Job handlers (pipeline stages)

| Handler | Role |
| --- | --- |
| `scan-requested` | Normalize input, resolve employer, enqueue collector jobs |
| `source-fetch` | Fetch, retry, PII sanitize, persist source, emit parse job |
| `parse-source` | Select parser, parse, persist fields, create signals |
| `aggregate-signals` | Dedup, conflict resolution, persist resolved signals |
| `compute-benchmark` | Lookup + provenance + persist benchmark |
| `compute-fit` | Fit vs profile + next best action |
| `compute-scores` | Sub-scores, drivers, caps, persist scores |
| `apply-overrides` | Severe rules, audit, recommendation ceiling |
| `compose-report` | UI payload, partial/full, freshness block |
| `finalize-scan` | Final status, `report_ready`, `completed_at` |

## 6. API surface (controller sketch)

```ts
class JobRadarController {
  async startScan(req: StartScanHttpRequest): Promise<StartScanHttpResponse>;
  async startFromSavedJob(req: FromSavedJobHttpRequest): Promise<StartScanHttpResponse>;
  async getScanStatus(req: GetScanStatusHttpRequest): Promise<ScanStatusHttpResponse>;
  async getReport(req: GetReportHttpRequest): Promise<ReportHttpResponse>;
  async rescanReport(req: RescanReportHttpRequest): Promise<StartScanHttpResponse>;
}
```

Controller: DTO validation, optional `Idempotency-Key`, delegate to application handlers, map domain → HTTP only.

## 7. DTO examples

**Start scan** — at least one of: `employer_name`, `source_url`, `job_post_id`.

**Scan status** — includes `progress` with per-stage `StageState`.

## 8. Repository interfaces (domain)

Interfaces live in `domain/repositories/`; Drizzle implementations live under `infrastructure/persistence/` (see Drizzle tables in `backend/src/db/schemas/job-radar.ts`).

## 9. Queue topology (minimal)

1. `job-radar-orchestrator` — scan pipeline coordination (`scan_requested`, aggregate, benchmark, fit, scores, overrides, compose, finalize).
2. `job-radar-collectors` — `source_fetch`.
3. `job-radar-parsers` — `parse_source`.
4. `job-radar-maintenance` — raw TTL, freshness refresh, rescan scheduler.

## 10. Orchestration context (internal)

```ts
type OrchestrationContext = {
  scanId: string;
  userId: string;
  employerId?: string;
  reportId?: string;
  entityFingerprint: string;
  sourceFingerprint?: string | null;
  stage: 'collect' | 'parse' | 'aggregate' | 'benchmark' | 'fit' | 'score' | 'compose' | 'finalize';
};
```

## 11. Observability

**Metrics (examples):** scans accepted, success/partial/failed rates, p50/p95 report time, collector timeouts, sources blocked, overrides applied, cache hit ratio, duplicate scans prevented.

**Log context:** `scan_id`, `report_id` (if any), `user_id`, `event_name`, `source_type` (if relevant), `stage`.

## 12. Code review rules

1. Controllers must not use repositories directly.
2. Collectors must not compute scoring.
3. Parsers must not decide final recommendation.
4. Override engine adjusts recommendation/audit/findings — not raw numeric scores.
5. Repositories are persistence only — no business rules.
6. Outbox events are written **in the same transaction** as the state change they announce.
7. Partial report is not modeled as an unhandled exception path.
8. Low-confidence caps are enforced in one place (e.g. scoring engine), not scattered across calculators.

## 13. Suggested first files to land

- `job-radar.module.ts`, `job-radar.controller.ts`
- `start-scan.handler.ts`, `get-scan-status.handler.ts`, `get-report.handler.ts`
- `scan-orchestrator.service.ts`, `employer-resolver.service.ts`
- `source-fetch.handler.ts`, `parse-source.handler.ts`
- `scoring-engine.service.ts`, `insight-composer.service.ts`
- Drizzle repos: scan, report, outbox (then sources/signals)

## 14. Implementation order (phased)

1. APIs: start scan, status, report; persistence; report skeleton; outbox.
2. Employer resolver; two collectors (official + registry); source persistence; basic parser.
3. Signal aggregation; benchmark; basic scoring; report composer.
4. Fit engine; overrides; review collector; full partial-report behavior.
5. Maintenance jobs; metrics; cache/dedup refinement; SLO instrumentation.

## 15. MySQL + Drizzle notes

- Prefer application validation for ranges (e.g. scores 0–100) where MySQL `CHECK` is awkward.
- Composite unique on `(user_id, idempotency_key)` does not replicate PostgreSQL partial unique indexes; add strict idempotency handling in `StartScanHandler` if needed.
- Heavy analytics should use normalized columns/tables; JSON columns hold payloads and convenience blobs.
- Optional FKs to core `employers` / `jobs` can be added in a later integration migration when IDs and resolution rules are stable.
