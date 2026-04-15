# JobRadar — event flow & pipeline (v1.1 final)

Complements `job-radar-openapi-v1.1.yaml` and `job-radar-sql-schema-v1.sql`.

## Separation of concerns

| Concept | Where it lives |
| --- | --- |
| Pipeline state | `scan.status` — `processing` \| `partial_report` \| `ready` \| `sources_blocked` \| `scan_failed` |
| Data staleness | `report.freshness.freshness_status` — `fresh` \| `acceptable` \| `stale` |
| Never use `stale` as a **scan** status — avoids UI/backend confusion (“ready but outdated”). |

## High-level flow

```mermaid
flowchart TD
  A[POST /job-radar/scan] --> B{Validate + quota + idempotency}
  B -->|fail| Z[400 / 403 / 409 / 429]
  B -->|ok| C[Create radar_scans + fingerprint_computed]
  C --> D[Emit scan_requested]
  D --> E[Input normalizer]
  E --> F[Employer resolver]
  F --> G[Collectors fan-out max 3 parallel]
  G --> H[Dedup + cluster]
  H --> I[Parse + extracted_signals]
  I --> J[Benchmark + fit]
  J --> K[Scoring + low-confidence caps]
  K --> L[Override engine]
  L --> M[override_applied]
  M --> N[Report composer]
  N --> O[Persist reports + scores + findings]
  O --> P[scan_completed]
```

## Scan state machine

`stale` data does **not** change `scan.status`; it only updates `report.freshness`. A **new** rescan creates a **new** `scan_id`.

```mermaid
stateDiagram-v2
  [*] --> processing
  processing --> partial_report
  processing --> ready
  processing --> sources_blocked
  processing --> scan_failed
  partial_report --> ready
  partial_report --> scan_failed
  sources_blocked --> partial_report
  sources_blocked --> scan_failed
  note right of ready
    Old report may become stale
    in DB; user runs POST .../rescan
    which creates NEW processing scan
  end note
```

## Internal events (outbox / queue)

| Event | When |
| --- | --- |
| `scan_requested` | API accepted scan after quota/idempotency |
| `fingerprint_computed` | Dedupe key + entity/source fingerprints ready |
| `input_normalized` | Employer string, URL, role, location normalized |
| `employer_resolved` | `employer_id` + aliases |
| `collectors_started` | Orchestrator dispatched collectors |
| `source_collected` | Row in `collected_sources` |
| `source_deduplicated` | Cluster id + content_hash grouping applied |
| `source_parsed` | `parse_status` updated |
| `signals_extracted` | Rows in `extracted_signals` |
| `conflicts_resolved` | Tier/freshness rules applied |
| `benchmark_resolved` | `market_benchmarks` row selected or fallback |
| `fit_computed` | User prefs vs offer/employer |
| `scores_computed` | `radar_scores` + `score_drivers` |
| `override_applied` | Override engine capped recommendation / forced finding |
| `report_generated` | `radar_reports` JSON blobs written |
| `scan_completed` | Terminal `scan.status` set |

## Idempotency & fingerprint

1. **Entity fingerprint** — `sha256(canonical_employer | normalized_role_family | normalized_location | normalized_source_url)` (exact formula in backend constants).
2. **Source fingerprint** — hash of canonical URL + optional content hash after fetch.
3. `Idempotency-Key` + identical body within TTL → same `scan_id` (202).
4. Same key + different body → `409` + `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

## Partial report threshold (implementation hint)

Generate `partial_report` only if:

- employer resolved, and  
- ≥ 2 collected sources after dedup, and  
- ≥ 2 of 6 scores computed, and  
- at least one finding with medium/high confidence **or** multiple low (per PRD).

## Related files

- `docs/job-radar/job-radar-openapi-v1.1.yaml`
- `docs/job-radar/job-radar-sql-schema-v1.sql`
