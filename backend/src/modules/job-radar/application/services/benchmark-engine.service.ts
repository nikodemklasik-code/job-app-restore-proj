import { randomUUID } from 'node:crypto';
import type { RadarBenchmarkRepository } from '../../domain/repositories/radar-benchmark.repository.js';
import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';

export class BenchmarkEngineService {
  constructor(
    private readonly signalRepository: RadarSignalRepository,
    private readonly benchmarkRepository: RadarBenchmarkRepository,
  ) {}

  async compute(scanId: string): Promise<void> {
    const signals = await this.signalRepository.findByScanId(scanId);

    const roleFamily =
      this.findTextSignal(signals, 'role_family') ??
      this.inferRoleFamily(signals) ??
      'General';

    const location = this.findTextSignal(signals, 'location') ?? 'Unknown';

    const seniority = this.findTextSignal(signals, 'seniority') ?? null;

    const currency = this.findTextSignal(signals, 'currency') ?? 'GBP';

    const benchmark = this.resolveBasicBenchmark({
      roleFamily,
      location,
      seniority,
    });

    await this.benchmarkRepository.save({
      id: randomUUID(),
      scanId,
      roleFamily,
      seniority,
      location,
      country: null,
      currency,
      benchmarkRegion: benchmark.region,
      benchmarkPeriod: 'last_180_days',
      sampleSize: benchmark.sampleSize,
      sourceMix: ['heuristic_seed'],
      normalizationVersion: 'n1.0',
      salaryP25: benchmark.salaryP25,
      salaryMedian: benchmark.salaryMedian,
      salaryP75: benchmark.salaryP75,
      confidence: benchmark.confidence,
    });
  }

  private resolveBasicBenchmark(input: {
    roleFamily: string;
    location: string;
    seniority: string | null;
  }) {
    const role = input.roleFamily.toLowerCase();
    const location = input.location.toLowerCase();

    const londonMultiplier = location.includes('london') ? 1.15 : 1.0;
    const seniorityMultiplier = input.seniority?.toLowerCase().includes('senior')
      ? 1.25
      : input.seniority?.toLowerCase().includes('lead')
        ? 1.35
        : 1.0;

    let baseMedian = 50000;

    if (role.includes('product design')) baseMedian = 72000;
    else if (role.includes('software')) baseMedian = 78000;
    else if (role.includes('product')) baseMedian = 80000;
    else if (role.includes('data')) baseMedian = 65000;

    const median = Math.round(baseMedian * londonMultiplier * seniorityMultiplier);
    const p25 = Math.round(median * 0.8);
    const p75 = Math.round(median * 1.2);

    return {
      region: location.includes('london') ? 'London' : input.location,
      sampleSize: 40,
      salaryP25: p25,
      salaryMedian: median,
      salaryP75: p75,
      confidence: 'low' as const,
    };
  }

  private findTextSignal(signals: Record<string, unknown>[], key: string): string | null {
    const signal = signals.find((s) => String(s.signalKey) === key);
    return signal?.signalValueText ? String(signal.signalValueText) : null;
  }

  private inferRoleFamily(signals: Record<string, unknown>[]): string | null {
    const titleSignal = signals.find((s) => String(s.signalKey) === 'title');
    const title = titleSignal?.signalValueText
      ? String(titleSignal.signalValueText).toLowerCase()
      : undefined;

    if (!title) return null;
    if (title.includes('designer')) return 'Product Design';
    if (title.includes('engineer')) return 'Software Engineering';
    if (title.includes('product manager')) return 'Product Management';
    if (title.includes('data')) return 'Data';

    return null;
  }
}
