import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';
import { ConflictResolverService } from '../services/conflict-resolver.service.js';

export class ResolveConflictsHandler {
  constructor(
    private readonly signalRepository: RadarSignalRepository,
    private readonly conflictResolver: ConflictResolverService,
  ) {}

  async execute(input: { scanId: string }): Promise<Record<string, unknown>[]> {
    const signals = await this.signalRepository.findByScanId(input.scanId);
    const result = this.conflictResolver.resolve(signals);

    for (const conflicted of result.conflictedSignalIds) {
      await this.signalRepository.markConflicted(conflicted.id, conflicted.reason);
    }

    return result.resolvedSignals;
  }
}
