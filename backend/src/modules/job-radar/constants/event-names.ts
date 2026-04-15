export const JOB_RADAR_EVENTS = {
  SCAN_REQUESTED: 'scan_requested',
  SCAN_REQUESTED_CACHE_HIT: 'scan_requested_cache_hit',
  SOURCE_FETCH_REQUESTED: 'source_fetch_requested',
  SOURCE_FETCH_STARTED: 'source_fetch_started',
  SOURCE_FETCH_COMPLETED: 'source_fetch_completed',
  SOURCE_FETCH_FAILED: 'source_fetch_failed',
  PARSE_SOURCE_REQUESTED: 'parse_source_requested',
  OFFER_PARSED: 'offer_parsed',
  BENCHMARK_READY: 'benchmark_ready',
  SOURCE_DEDUPLICATED: 'source_deduplicated',
} as const;
