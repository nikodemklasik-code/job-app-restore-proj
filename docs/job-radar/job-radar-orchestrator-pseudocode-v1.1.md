# JobRadar orchestrator — pseudocode (v1.1)

Language-agnostic pseudocode for backend implementation. Wire to your framework (Express, queues, workers). **Outbox rows must commit in the same DB transaction as scan/report rows.**

---

## Constants

```text
LOW_CONFIDENCE_IMPACT_CAP = 10   # max net impact of low-confidence drivers per score
```

---

## 3.1 Start scan handler

```text
function start_scan(request, user):
    validate_scan_input(request)
    enforce_quota(user.id)

    idempotency_key = request.headers.get("Idempotency-Key")
    normalized_input = normalize_scan_request(request.body)
    entity_fingerprint = compute_entity_fingerprint(normalized_input)
    source_fingerprint = compute_source_fingerprint(normalized_input)

    existing_by_idempotency = find_scan_by_idempotency(user.id, idempotency_key)
    if existing_by_idempotency:
        if payload_matches(existing_by_idempotency.input_payload, request.body):
            return accepted_response(
                scan_id=existing_by_idempotency.id,
                status=existing_by_idempotency.status,
                reused=True
            )
        raise ConflictError("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD")

    cached_report = find_fresh_report_by_fingerprint(entity_fingerprint)
    if cached_report and not request.body.get("force_rescan", False):
        emit_audit_event(
            event_name="scan_requested_cache_hit",
            payload={
                "user_id": str(user.id),
                "report_id": str(cached_report.id),
                "entity_fingerprint": entity_fingerprint
            }
        )
        return accepted_response(
            scan_id=str(cached_report.scan_id),
            report_id=str(cached_report.id),
            status="ready",
            reused=True
        )

    scan_id = uuid4()
    report_id = uuid4()

    with db.transaction():
        create_job_radar_scan(
            id=scan_id,
            user_id=user.id,
            scan_trigger=request.body["scan_trigger"],
            idempotency_key=idempotency_key,
            entity_fingerprint=entity_fingerprint,
            source_fingerprint=source_fingerprint,
            input_payload=request.body
        )

        create_report_skeleton(
            id=report_id,
            scan_id=scan_id,
            status="processing",
            scoring_version="v1.1.0",
            parser_version="p3.2",
            normalization_version="n1.0",
            resolver_version="r1.4"
        )

        enqueue_outbox(
            aggregate_type="job_radar_scan",
            aggregate_id=scan_id,
            event_name="scan_requested",
            payload={
                "scan_id": str(scan_id),
                "user_id": str(user.id),
                "scan_trigger": request.body["scan_trigger"],
                "idempotency_key": str(idempotency_key) if idempotency_key else null,
                "entity_fingerprint": entity_fingerprint,
                "source_fingerprint": source_fingerprint,
                "input": request.body
            }
        )

    return accepted_response(scan_id=str(scan_id), report_id=str(report_id), status="processing")
```

---

## 3.2 Main orchestrator

```text
function handle_scan_requested(event):
    scan_id = event["scan_id"]

    mark_scan_stage(scan_id, "employer_scan", "processing")

    scan = load_scan(scan_id)
    normalized = normalize_input(scan.input_payload)

    emit_event("input_normalized", {
        "scan_id": scan_id,
        "normalized_input": normalized,
        "entity_fingerprint": scan.entity_fingerprint
    })

    emit_event("fingerprint_computed", {
        "scan_id": scan_id,
        "entity_fingerprint": scan.entity_fingerprint,
        "source_fingerprint": scan.source_fingerprint
    })

    employer = resolve_employer(normalized)
    attach_employer_to_scan(scan_id, employer.id)

    emit_event("employer_resolved", {
        "scan_id": scan_id,
        "employer": {
            "employer_id": str(employer.id),
            "canonical_name": employer.canonical_name,
            "display_name": employer.display_name,
            "aliases": employer.aliases
        },
        "resolver_version": "r1.4",
        "confidence": employer.confidence
    })

    collector_jobs = build_collector_jobs(scan, normalized, employer)

    run_collectors_with_parallelism(
        scan_id=scan_id,
        jobs=collector_jobs,
        max_parallel=3
    )

    sources = load_sources_for_scan(scan_id)
    deduplicate_sources(scan_id, sources)

    parse_all_available_sources(scan_id)

    aggregate_signals(scan_id)

    run_benchmark_engine(scan_id)

    run_fit_engine(scan_id)

    run_scoring_engine(scan_id)

    apply_override_rules(scan_id)

    compose_report(scan_id)

    finalize_scan(scan_id)
```

---

## 3.3 Collector runner

```text
function run_collectors_with_parallelism(scan_id, jobs, max_parallel=3):
    results = parallel_map(
        fn=run_single_collector_job,
        items=jobs,
        concurrency=max_parallel
    )

    successful = sum(1 for r in results if r["status"] == "done")
    blocked = sum(1 for r in results if r["status"] == "blocked")
    failed = sum(1 for r in results if r["status"] == "failed")

    if successful == 0 and blocked > 0:
        set_scan_status(scan_id, "sources_blocked")
    elif successful == 0 and failed > 0:
        fail_scan(scan_id, "No sources could be collected")
```

---

## 3.4 Single collector with retry

See implementation notes: timeout per source type, max 2 retries, exponential backoff, `source_fetch_failed` / `source_fetch_completed` events, PII sanitize before persist.

---

## 3.5 Dedup + conflict resolver

```text
function deduplicate_sources(scan_id, sources):
    clusters = group_sources_by_content_hash_or_similarity(sources)

    for cluster in clusters:
        primary = choose_primary_source(cluster)  # tier1 > fresher > richer metadata
        assign_cluster_id(cluster, cluster.id, primary.id)

        if len(cluster.sources) > 1:
            emit_event("source_deduplicated", {
                "scan_id": scan_id,
                "source_cluster_id": cluster.id,
                "primary_source_id": str(primary.id),
                "duplicate_source_ids": [str(s.id) for s in cluster.sources if s.id != primary.id],
                "dedup_reason": cluster.reason
            })

function resolve_signal_conflicts(signals):
    resolved = []
    grouped = group_by_signal_key(signals)
    for signal_key, candidates in grouped.items():
        if len(candidates) == 1:
            resolved.append(candidates[0])
            continue

        best = sorted(
            candidates,
            key=lambda s: (
                -(s.source_quality_tier or 99),
                -freshness_rank(s),
                -structured_signal_rank(s)
            )
        )[0]

        for candidate in candidates:
            if candidate.id != best.id:
                mark_signal_conflicted(
                    candidate.id,
                    reason=f"resolved_by_priority_against_{best.id}"
                )

        resolved.append(best)

    return resolved
```

---

## 3.6 Parser + signal extraction

`parse_all_available_sources` → `offer_parsed` events; `aggregate_signals` → `signals_extracted`.

---

## 3.7–3.11 Benchmark, fit, scoring, override, composer

Scoring applies `cap_low_confidence_influence` per score dimension. Override engine emits `override_applied` and persists `override_id`, `override_ceiling`, `override_confidence` on `job_radar_reports`.

`compose_report` writes JSON blobs + syncs `job_radar_scores`; `finalize_scan` sets `job_radar_scans.status` and `completed_at`.

---

## derive_report_status

```text
function derive_report_status(scan_id):
    sources = load_sources_for_scan(scan_id)
    parsed_count = count_parsed_sources(sources)
    blocked_count = count_blocked_sources(sources)
    score_count = count_available_scores(scan_id)

    if score_count >= 6 and parsed_count >= 2:
        return "ready"

    if score_count >= 2 and parsed_count >= 2:
        return "partial_report"

    if parsed_count == 0 and blocked_count > 0:
        return "sources_blocked"

    return "scan_failed"
```

---

## Maintenance jobs

### Raw content cleanup

Delete or null `job_radar_sources.raw_content` where `raw_content_expires_at < now()`.

### Freshness refresh

Update `job_radar_reports.freshness_status`, `freshness_hours`, `auto_rescan_eligible`, `rescan_recommended` from `last_scanned_at` (0–24h fresh, 24–72h acceptable, >72h stale).

---

## Related files

| File | Purpose |
| --- | --- |
| `db/migrations/001–005_*.sql` | PostgreSQL schema + outbox |
| `docs/job-radar/job-radar-event-examples-v1.1.json` | Example event payloads |
| `docs/job-radar/job-radar-openapi-v1.1.yaml` | HTTP contract |
