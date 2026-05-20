/**
 * CWJobs Provider
 * UK leader for IT, infrastructure and development roles
 * Method: Browser/Scraping (no public API)
 */

import type { JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

export class CWJobsProvider implements JobSourceProvider {
  name = 'cwjobs' as const;
  requiresSession = false;

  async search(ctx: ProviderContext): Promise<SourceJob[]> {
    // CWJobs doesn't have public API
    // Implementation would require:
    // 1. RSS feed parsing (if available)
    // 2. Or integration with aggregator API (JSearch, SerpApi)
    // 3. Or browser automation (Playwright)
    
    console.log('[CWJobsProvider] Search not yet implemented - requires RSS or aggregator integration');
    return [];
  }

  async isHealthy(): Promise<boolean> {
    return true; // Placeholder
  }
}
