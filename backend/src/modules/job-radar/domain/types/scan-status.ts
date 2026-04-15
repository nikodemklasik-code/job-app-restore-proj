export const SCAN_STATUS = {
  PROCESSING: 'processing',
  PARTIAL_REPORT: 'partial_report',
  READY: 'ready',
  SOURCES_BLOCKED: 'sources_blocked',
  SCAN_FAILED: 'scan_failed',
} as const;

export type ScanStatus = (typeof SCAN_STATUS)[keyof typeof SCAN_STATUS];
