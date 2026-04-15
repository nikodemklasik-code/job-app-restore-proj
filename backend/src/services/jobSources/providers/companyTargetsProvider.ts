import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

export class CompanyTargetsProvider implements JobSourceProvider {
  name = 'company-targets';
  label = 'Company Targets';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: false, reason: 'Company targets not configured yet' };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}
