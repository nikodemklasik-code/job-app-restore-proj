import type { ScanStatus } from '../types/scan-status.js';

export class RadarReportEntity {
  constructor(
    public readonly id: string,
    public readonly scanId: string,
    public status: ScanStatus,
    public readonly scoringVersion: string,
    public readonly parserVersion: string,
    public readonly normalizationVersion: string,
    public readonly resolverVersion: string,
    public readonly lastScannedAt: Date,
  ) {}
}
