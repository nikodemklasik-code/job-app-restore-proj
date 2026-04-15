import { SCAN_STATUS, type ScanStatus } from '../types/scan-status.js';

/**
 * Maps pipeline outcome to user-visible scan/report status (skeleton).
 */
export function deriveReportStatusFromStages(_input: {
  sourcesBlocked: boolean;
  scanFailed: boolean;
  partialData: boolean;
}): ScanStatus {
  return SCAN_STATUS.PARTIAL_REPORT;
}
