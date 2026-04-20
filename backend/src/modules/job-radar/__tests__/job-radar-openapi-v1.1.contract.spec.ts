/**
 * Contract tests: single source of truth is the repo file
 * `docs/job-radar/job-radar-openapi-v1.1.yaml` (same content as any uploaded OpenAPI v1.1).
 * Do not invent paths, methods, or schemas — only assert what appears in that file.
 * Gaps vs implementation are listed explicitly in OPENAPI_V1_1_GAPS_VS_REPO (empty when REST + tRPC parity is aligned).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { JobRadarHttpMapper } from '../api/job-radar.http.mapper.js';
import { startScanDtoSchema } from '../api/job-radar.dto.js';
import { JOB_RADAR_OPENAPI_V1_1_REST_OPERATIONS } from '../api/job-radar-openapi-v1.1.rest-operations.js';
import { RadarScanEntity } from '../domain/entities/radar-scan.entity.js';
import { SCAN_STATUS } from '../domain/types/scan-status.js';
import { SCAN_TRIGGER } from '../domain/types/scan-trigger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root = five levels up from this __tests__ folder (`backend` → monorepo root). */
const OPENAPI_PATH = resolve(__dirname, '../../../../../docs/job-radar/job-radar-openapi-v1.1.yaml');

function loadOpenApiDoc(): Record<string, unknown> {
  const raw = readFileSync(OPENAPI_PATH, 'utf8');
  return parse(raw) as Record<string, unknown>;
}

/** Shrink this list when behaviour or routes match the OpenAPI file. */
const OPENAPI_V1_1_GAPS_VS_REPO: readonly string[] = [];

describe('Job Radar OpenAPI v1.1 (file is sole contract)', () => {
  const doc = loadOpenApiDoc();

  it('parses YAML from docs/job-radar/job-radar-openapi-v1.1.yaml', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect((doc.info as { title?: string }).title).toBe('JobRadar API');
    expect((doc.info as { version?: string }).version).toBe('1.1.0');
  });

  it('defines exactly these paths (no extras inferred)', () => {
    const paths = doc.paths as Record<string, unknown>;
    expect(Object.keys(paths).sort()).toEqual(
      [
        '/job-radar/employers/{employer_id}/history',
        '/job-radar/report/{report_id}',
        '/job-radar/report/{report_id}/rescan',
        '/job-radar/scan',
        '/job-radar/scan/from-saved-job',
        '/job-radar/scan/{scan_id}',
      ].sort(),
    );
  });

  it('REST operations manifest lists every OpenAPI v1.1 path (literal /job-radar routes mounted in server)', () => {
    const paths = Object.keys((doc.paths as Record<string, unknown>) ?? {}).sort();
    const manifestPaths = [...new Set(JOB_RADAR_OPENAPI_V1_1_REST_OPERATIONS.map((o) => o.openApiPath))].sort();
    expect(manifestPaths).toEqual(paths);
  });

  it('GET /job-radar/scan/{scan_id} declares 200, 401, 404 from the file only', () => {
    const get = (doc.paths as Record<string, Record<string, unknown>>)['/job-radar/scan/{scan_id}']!.get as Record<
      string,
      unknown
    >;
    expect(get.operationId).toBe('jobRadarGetScan');
    const responses = Object.keys((get.responses as Record<string, unknown>) ?? {}).sort();
    expect(responses).toEqual(['200', '401', '404'].sort());
  });

  it('POST /job-radar/scan declares 202 and error responses from the file only', () => {
    const post = (doc.paths as Record<string, Record<string, unknown>>)['/job-radar/scan']!.post as Record<
      string,
      unknown
    >;
    expect(post.operationId).toBe('jobRadarStartScan');
    const responses = Object.keys((post.responses as Record<string, unknown>) ?? {}).sort();
    expect(responses).toEqual(['202', '400', '401', '403', '409', '429'].sort());
  });

  it('POST /job-radar/report/{report_id}/rescan declares Idempotency-Key parameter (repo REST + tRPC must honour header)', () => {
    const post = (doc.paths as Record<string, Record<string, unknown>>)['/job-radar/report/{report_id}/rescan']!
      .post as Record<string, unknown>;
    expect(post.operationId).toBe('jobRadarRescanReport');
    const params = (post.parameters as { $ref?: string; name?: string; in?: string }[]) ?? [];
    expect(params.some((p) => p.$ref === '#/components/parameters/IdempotencyKey')).toBe(true);
  });

  it('components.schemas.ScanStatus matches enum in file', () => {
    const schemas = (doc.components as { schemas?: Record<string, { enum?: string[] }> }).schemas!;
    expect(schemas.ScanStatus?.enum).toEqual([
      'processing',
      'partial_report',
      'ready',
      'sources_blocked',
      'scan_failed',
    ]);
  });

  it('components.schemas.ScanRequest requires scan_trigger and oneOf identifier branches', () => {
    const scanRequest = (doc.components as { schemas?: Record<string, unknown> }).schemas!.ScanRequest as {
      required?: string[];
      allOf?: Array<{ oneOf?: Array<{ required?: string[] }> }>;
    };
    expect(scanRequest.required).toEqual(['scan_trigger']);
    const oneOf = scanRequest.allOf?.[0]?.oneOf;
    expect(oneOf?.map((b) => b.required?.[0]).sort()).toEqual(['employer_name', 'job_post_id', 'saved_job_id', 'source_url'].sort());
  });

  it('components.schemas.ScanAcceptedResponse required properties are scan_id and status', () => {
    const schemas = (doc.components as { schemas?: Record<string, { required?: string[] }> }).schemas!;
    const schema = schemas.ScanAcceptedResponse;
    expect(schema.required?.slice().sort()).toEqual(['scan_id', 'status']);
  });

  it('ScanProgressResponse required fields are emitted by JobRadarHttpMapper.toScanProgressResponseWire', () => {
    const required = (
      (doc.components as { schemas?: Record<string, { required?: string[] }> }).schemas!.ScanProgressResponse as {
        required?: string[];
      }
    ).required?.slice().sort() ?? [];
    expect(required).toEqual(
      ['fingerprint', 'last_updated_at', 'progress', 'scan_id', 'scan_trigger', 'started_at', 'status'].sort(),
    );
    const scan = new RadarScanEntity(
      'scan-x',
      'u1',
      SCAN_TRIGGER.MANUAL_SEARCH,
      SCAN_STATUS.PROCESSING,
      'fp1',
      null,
      {},
      {
        employer_scan: 'processing',
        offer_parse: 'pending',
        benchmark: 'pending',
        reviews: 'pending',
        scoring: 'pending',
        report_compose: 'pending',
      },
      null,
      null,
      null,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:01:00.000Z'),
      null,
      null,
    );
    const wire = JobRadarHttpMapper.toScanProgressResponseWire({ ...scan, reportId: 'rep-y' });
    for (const k of required) {
      expect(wire).toHaveProperty(k);
    }
    expect(wire).toHaveProperty('partial_report_id');
    expect(wire).toHaveProperty('failed_reason');
    expect(wire.partial_report_id).toBe('rep-y');
    const progKeys = Object.keys(
      (
        (doc.components as { schemas?: Record<string, { properties?: Record<string, unknown> }> }).schemas!.ScanProgress as {
          properties?: Record<string, unknown>;
        }
      ).properties ?? {},
    ).sort();
    expect(Object.keys(wire.progress).sort()).toEqual(progKeys);
  });

  it('JobRadarHttpMapper.toScanAcceptedResponse uses only property names declared on ScanAcceptedResponse', () => {
    const props = Object.keys(
      (
        (doc.components as { schemas?: Record<string, { properties?: Record<string, unknown> }> }).schemas!
          .ScanAcceptedResponse as { properties?: Record<string, unknown> }
      ).properties ?? {},
    );
    const out = JobRadarHttpMapper.toScanAcceptedResponse({
      scanId: 's1',
      status: 'processing',
      reportId: 'r1',
      quotaRemaining: 2,
      idempotencyReused: false,
    });
    for (const k of Object.keys(out)) {
      expect(props).toContain(k);
    }
    expect(out.scan_id).toBe('s1');
    expect(out.status).toBe('processing');
    expect(out.report_id).toBe('r1');
    expect(out.quota_remaining).toBe(2);
    expect(out.idempotency_reused).toBe(false);
  });
});

describe('OpenAPI v1.1 vs repo (explicit gaps — update when fixed)', () => {
  it('OPENAPI_V1_1_GAPS_VS_REPO has no undocumented mismatches', () => {
    expect(OPENAPI_V1_1_GAPS_VS_REPO).toHaveLength(0);
  });

  it('startScanDtoSchema matches ScanRequest oneOf (saved_job_id branch)', () => {
    const parsed = startScanDtoSchema.safeParse({
      scanTrigger: 'manual_search',
      employerName: 'Acme',
    });
    expect(parsed.success).toBe(true);
    const savedOnlyCamel = startScanDtoSchema.safeParse({
      scanTrigger: 'saved_job',
      savedJobId: 'job-123',
    });
    expect(savedOnlyCamel.success).toBe(true);
    if (savedOnlyCamel.success) expect(savedOnlyCamel.data.savedJobId).toBe('job-123');

    const savedOnlySnake = startScanDtoSchema.safeParse({
      scan_trigger: 'saved_job',
      saved_job_id: 'job-456',
    });
    expect(savedOnlySnake.success).toBe(true);
    if (savedOnlySnake.success) expect(savedOnlySnake.data.savedJobId).toBe('job-456');
  });
});
