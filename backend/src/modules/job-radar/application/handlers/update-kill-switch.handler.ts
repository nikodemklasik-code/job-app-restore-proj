import type {
  JobRadarKillSwitchFlags,
  MutableJobRadarConfigRepository,
} from '../../domain/repositories/job-radar-config.repository.js';

export class UpdateKillSwitchHandler {
  constructor(private readonly configRepository: MutableJobRadarConfigRepository) {}

  async execute(input: Partial<JobRadarKillSwitchFlags>): Promise<{ ok: true }> {
    await this.configRepository.setFlags(input);
    return { ok: true };
  }
}
