/**
 * Canonical list of OpenAPI v1.1 Job Radar paths implemented as literal Express routes
 * (mounted under `/job-radar` on the HTTP server). Kept in a tiny module so contract tests
 * can assert parity without importing Clerk-backed route handlers.
 */
export const JOB_RADAR_OPENAPI_V1_1_REST_OPERATIONS: readonly { method: string; openApiPath: string }[] = [
  { method: 'POST', openApiPath: '/job-radar/scan' },
  { method: 'POST', openApiPath: '/job-radar/scan/from-saved-job' },
  { method: 'GET', openApiPath: '/job-radar/scan/{scan_id}' },
  { method: 'GET', openApiPath: '/job-radar/report/{report_id}' },
  { method: 'POST', openApiPath: '/job-radar/report/{report_id}/rescan' },
  { method: 'GET', openApiPath: '/job-radar/employers/{employer_id}/history' },
] as const;
