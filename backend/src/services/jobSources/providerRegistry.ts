import type { JobSourceProvider } from './types.js';
import { ReedProvider } from './providers/reedProvider.js';
import { AdzunaProvider } from './providers/adzunaProvider.js';
import { JoobleProvider } from './providers/joobleProvider.js';
import { IndeedBrowserProvider } from './providers/indeedBrowserProvider.js';
import { GumtreeProvider } from './providers/gumtreeProvider.js';
import { TotaljobsProvider } from './providers/totaljobsProvider.js';
import { CvLibraryProvider } from './providers/cvLibraryProvider.js';
import { FindAJobProvider } from './providers/findAJobProvider.js';
import { DatabaseProvider } from './providers/databaseProvider.js';
import { ManualProvider } from './providers/manualProvider.js';
import { CompanyTargetsProvider } from './providers/companyTargetsProvider.js';
import { OpenAiDiscoveryProvider } from './providers/openAiDiscoveryProvider.js';

let _providers: JobSourceProvider[] | null = null;

export function getProviders(): JobSourceProvider[] {
  if (_providers) return _providers;
  _providers = [
    new ReedProvider(),
    new AdzunaProvider(),
    new JoobleProvider(),
    new IndeedBrowserProvider(),
    new GumtreeProvider(),
    new TotaljobsProvider(),
    new CvLibraryProvider(),
    new FindAJobProvider(),
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
