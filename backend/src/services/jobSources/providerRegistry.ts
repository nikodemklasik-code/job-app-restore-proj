import type { JobSourceProvider } from './types.js';
import { ReedProvider } from './providers/reedProvider.js';
import { AdzunaProvider } from './providers/adzunaProvider.js';
import { JoobleProvider } from './providers/joobleProvider.js';
import { IndeedBrowserProvider } from './providers/indeedBrowserProvider.js';
import { GumtreeProvider } from './providers/gumtreeProvider.js';
import { TotaljobsProvider } from './providers/totaljobsProvider.js';
import { CvLibraryProvider } from './providers/cvLibraryProvider.js';
import { FindAJobProvider } from './providers/findAJobProvider.js';
import { LinkedInProvider } from './providers/linkedinProvider.js';
import { MonsterProvider } from './providers/monsterProvider.js';
import { GlassdoorProvider } from './providers/glassdoorProvider.js';
import { DatabaseProvider } from './providers/databaseProvider.js';
import { ManualProvider } from './providers/manualProvider.js';
import { CompanyTargetsProvider } from './providers/companyTargetsProvider.js';
import { OpenAiDiscoveryProvider } from './providers/openAiDiscoveryProvider.js';
import { RapidApiJobsProvider } from './providers/rapidApiJobsProvider.js';
import { SerpApiJobsProvider } from './providers/serpApiJobsProvider.js';
import { TheMuseJobsProvider } from './providers/theMuseJobsProvider.js';
// New API-based providers (no cookies required)
import { RapidApiProvider } from './providers/rapidApiProvider.js';
import { GovJobsProvider } from './providers/govJobsProvider.js';
import { RssFeedProvider } from './providers/rssFeedProvider.js';
import { AggregatorProvider } from './providers/aggregatorProvider.js';

let _providers: JobSourceProvider[] | null = null;

export function getProviders(): JobSourceProvider[] {
  if (_providers) return _providers;
  _providers = [
    // API-based providers (reliable, no cookies)
    new ReedProvider(),
    new AdzunaProvider(),
    new JoobleProvider(),
    new RapidApiProvider(),
    new GovJobsProvider(),
    new RssFeedProvider(),
    new AggregatorProvider(),
    new RapidApiJobsProvider(),
    new SerpApiJobsProvider(),
    new TheMuseJobsProvider(),

    // Cookie/session-based providers (may be unreliable)
    new IndeedBrowserProvider(),
    new GumtreeProvider(),
    new LinkedInProvider(),
    new MonsterProvider(),
    new GlassdoorProvider(),

    // Scraping-based providers (may be blocked)
    new TotaljobsProvider(),
    new CvLibraryProvider(),
    new FindAJobProvider(),

    // Internal providers
    new DatabaseProvider(),
    new ManualProvider(),
    new CompanyTargetsProvider(),
    new OpenAiDiscoveryProvider(),
  ];
  return _providers;
}

export function getProvider(name: string): JobSourceProvider | undefined {
  return getProviders().find((p) => p.name === name);
}
