import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

export class JobsAcUkProvider implements JobSourceProvider {
  name = 'jobs-ac-uk';
  label = 'jobs.ac.uk';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return {
      ready: false,
      reason: 'jobs.ac.uk provider is registered as a catalogue placeholder; RSS discovery must be implemented against the current SourceJob model before enabling.',
    };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}
