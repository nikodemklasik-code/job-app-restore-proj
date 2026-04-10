import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';
import { discoverJobsForProfile } from '../profileDrivenDiscovery.js';

export class OpenAiDiscoveryProvider implements JobSourceProvider {
  name = 'openai-discovery';
  label = 'AI Discovery';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (!process.env.OPENAI_API_KEY) {
      return { ready: false, reason: 'OPENAI_API_KEY not set' };
    }
    return { ready: true };
  }

  async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
    if (!process.env.OPENAI_API_KEY) return [];
    // Delegates only to non-AI providers to avoid infinite recursion
    return discoverJobsForProfile(input, context);
  }
}
