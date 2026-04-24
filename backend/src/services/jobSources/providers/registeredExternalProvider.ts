import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

export class RegisteredExternalProvider implements JobSourceProvider {
  name: string;
  label: string;

  constructor(name: string, label: string) {
    this.name = name;
    this.label = label;
  }

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return {
      ready: false,
      reason: 'Registered external source. Direct API or approved web adapter is not connected yet.',
    };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}
