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

// UK Job Boards - API & RSS providers
import { JobsAcUkProvider } from './providers/jobsAcUkProvider.js';
import { NHSJobsProvider } from './providers/nhsJobsProvider.js';
import { CWJobsProvider } from './providers/cwjobsProvider.js';

// UK Job Boards - All niche providers (51 new)
import {
  // IT/Tech
  TechnojobsProvider,
  TheITJobBoardProvider,
  HarnhamProvider,
  DataCareerProvider,
  WorkInStartupsProvider,
  SiliconMilkroundaboutProvider,
  DiceUKProvider,
  // Finance
  GAAPwebProvider,
  CityJobsProvider,
  BarclaySimps onProvider,
  // Healthcare
  HealthjobsProvider,
  NursesProvider,
  BMJCareersProvider,
  TracJobsProvider,
  NHSProfessionalsProvider,
  // Education
  TesJobsProvider,
  TeachingVacanciesProvider,
  EteachProvider,
  FEjobsProvider,
  TimesHigherEducationProvider,
  // Engineering
  EngineeringJobsProvider,
  ICERecruitProvider,
  JustEngineersProvider,
  TheManufacturerJobsProvider,
  FawkesReeceProvider,
  PropertyWeekJobsProvider,
  IWFMJobsProvider,
  // Logistics
  CIPSJobsProvider,
  SupplyChainOnlineProvider,
  DriverHireProvider,
  // Hospitality
  CatererProvider,
  RetailChoiceProvider,
  HoscoProvider,
  CMTravelProvider,
  FashionJobsUKProvider,
  // Public/NGO
  CivilServiceJobsProvider,
  CharityJobProvider,
  EnvironmentJobProvider,
  GreenJobsProvider,
  FarmingUKJobsProvider,
  // Legal
  TotallyLegalProvider,
  LawGazetteJobsProvider,
  TheLawyerJobsProvider,
  // Graduate
  TargetJobsProvider,
  ProspectsProvider,
  MilkroundProvider,
  GradcrackerProvider,
  StudentCircusProvider,
  IndeedFlexProvider,
} from './providers/allNicheProviders.js';

let _providers: JobSourceProvider[] | null = null;

export function getProviders(): JobSourceProvider[] {
  if (_providers) return _providers;
  _providers = [
    // ── API-based providers (reliable, no cookies) ────────────────────────────
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

    // ── UK Job Boards - API & RSS (high priority) ─────────────────────────────
    new JobsAcUkProvider(),        // Academic - RSS ✅
    new NHSJobsProvider(),          // Healthcare - GOV.UK API
    new CWJobsProvider(),           // IT/Tech - placeholder

    // ── UK Job Boards - IT/Tech ───────────────────────────────────────────────
    new TechnojobsProvider(),
    new TheITJobBoardProvider(),
    new HarnhamProvider(),
    new DataCareerProvider(),
    new WorkInStartupsProvider(),
    new SiliconMilkroundaboutProvider(),
    new DiceUKProvider(),

    // ── UK Job Boards - Finance ───────────────────────────────────────────────
    new GAAPwebProvider(),
    new CityJobsProvider(),
    new BarclaySimps onProvider(),

    // ── UK Job Boards - Healthcare ────────────────────────────────────────────
    new HealthjobsProvider(),
    new NursesProvider(),
    new BMJCareersProvider(),
    new TracJobsProvider(),
    new NHSProfessionalsProvider(),

    // ── UK Job Boards - Education ─────────────────────────────────────────────
    new TesJobsProvider(),
    new TeachingVacanciesProvider(),
    new EteachProvider(),
    new FEjobsProvider(),
    new TimesHigherEducationProvider(),

    // ── UK Job Boards - Engineering ───────────────────────────────────────────
    new EngineeringJobsProvider(),
    new ICERecruitProvider(),
    new JustEngineersProvider(),
    new TheManufacturerJobsProvider(),
    new FawkesReeceProvider(),
    new PropertyWeekJobsProvider(),
    new IWFMJobsProvider(),

    // ── UK Job Boards - Logistics ─────────────────────────────────────────────
    new CIPSJobsProvider(),
    new SupplyChainOnlineProvider(),
    new DriverHireProvider(),

    // ── UK Job Boards - Hospitality ───────────────────────────────────────────
    new CatererProvider(),
    new RetailChoiceProvider(),
    new HoscoProvider(),
    new CMTravelProvider(),
    new FashionJobsUKProvider(),

    // ── UK Job Boards - Public/NGO ────────────────────────────────────────────
    new CivilServiceJobsProvider(),
    new CharityJobProvider(),
    new EnvironmentJobProvider(),
    new GreenJobsProvider(),
    new FarmingUKJobsProvider(),

    // ── UK Job Boards - Legal ─────────────────────────────────────────────────
    new TotallyLegalProvider(),
    new LawGazetteJobsProvider(),
    new TheLawyerJobsProvider(),

    // ── UK Job Boards - Graduate ──────────────────────────────────────────────
    new TargetJobsProvider(),
    new ProspectsProvider(),
    new MilkroundProvider(),
    new GradcrackerProvider(),
    new StudentCircusProvider(),
    new IndeedFlexProvider(),

    // ── Cookie/session-based providers (may be unreliable) ────────────────────
    new IndeedBrowserProvider(),
    new GumtreeProvider(),
    new LinkedInProvider(),
    new MonsterProvider(),
    new GlassdoorProvider(),

    // ── Scraping-based providers (may be blocked) ─────────────────────────────
    new TotaljobsProvider(),
    new CvLibraryProvider(),
    new FindAJobProvider(),

    // ── Internal providers ────────────────────────────────────────────────────
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
