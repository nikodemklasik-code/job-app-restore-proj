import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

export class CWJobsProvider implements JobSourceProvider {
  name = 'cwjobs';
  label = 'CWJobs';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return {
      ready: false,
      reason: 'CWJobs provider is registered as a catalogue placeholder; RSS or aggregator integration is not implemented yet.',
    };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}
