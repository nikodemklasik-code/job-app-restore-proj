export type SaveBenchmarkInput = {
  id: string;
  scanId: string;
  roleFamily: string;
  seniority?: string | null;
  location: string;
  country?: string | null;
  currency: string;
  benchmarkRegion: string;
  benchmarkPeriod: string;
  sampleSize: number;
  sourceMix: string[];
  normalizationVersion: string;
  salaryP25?: number | null;
  salaryMedian?: number | null;
  salaryP75?: number | null;
  confidence: 'low' | 'medium' | 'high';
};

export interface RadarBenchmarkRepository {
  save(input: SaveBenchmarkInput): Promise<void>;
  getByScanId(scanId: string): Promise<Record<string, unknown> | null>;
}
