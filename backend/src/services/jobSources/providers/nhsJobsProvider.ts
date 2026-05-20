import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

export class NHSJobsProvider implements JobSourceProvider {
  name = 'nhs-jobs';
  label = 'NHS Jobs';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return {
      ready: false,
      reason: 'NHS Jobs provider is registered as a catalogue placeholder; official API credentials/contract are not configured yet.',
    };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}
