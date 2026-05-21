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
import { RapidApiProvider } from './providers/rapidApiProvider.js';
import { GovJobsProvider } from './providers/govJobsProvider.js';
import { RssFeedProvider } from './providers/rssFeedProvider.js';
import { AggregatorProvider } from './providers/aggregatorProvider.js';
import { JobsAcUkProvider } from './providers/jobsAcUkProvider.js';
import { NHSJobsProvider } from './providers/nhsJobsProvider.js';
import { CWJobsProvider } from './providers/cwjobsProvider.js';
import {
  TechnojobsProvider,
  TheITJobBoardProvider,
  HarnhamProvider,
  DataCareerProvider,
  WorkInStartupsProvider,
  SiliconMilkroundaboutProvider,
  DiceUKProvider,
  GAAPwebProvider,
  CityJobsProvider,
  BarclaySimpsonProvider,
  HealthjobsProvider,
  NursesProvider,
  BMJCareersProvider,
  TracJobsProvider,
  NHSProfessionalsProvider,
  TesJobsProvider,
  TeachingVacanciesProvider,
  EteachProvider,
  FEjobsProvider,
  TimesHigherEducationProvider,
  EngineeringJobsProvider,
  ICERecruitProvider,
  JustEngineersProvider,
  TheManufacturerJobsProvider,
  FawkesReeceProvider,
  PropertyWeekJobsProvider,
  IWFMJobsProvider,
  CIPSJobsProvider,
  SupplyChainOnlineProvider,
  DriverHireProvider,
  CatererProvider,
  RetailChoiceProvider,
  HoscoProvider,
  CMTravelProvider,
  FashionJobsUKProvider,
  CivilServiceJobsProvider,
  CharityJobProvider,
  EnvironmentJobProvider,
  GreenJobsProvider,
  FarmingUKJobsProvider,
  TotallyLegalProvider,
  LawGazetteJobsProvider,
  TheLawyerJobsProvider,
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

    // UK job board catalogue additions. Most are explicit placeholders with readiness=false.
    new JobsAcUkProvider(),
    new NHSJobsProvider(),
    new CWJobsProvider(),
    new TechnojobsProvider(),
    new TheITJobBoardProvider(),
    new HarnhamProvider(),
    new DataCareerProvider(),
    new WorkInStartupsProvider(),
    new SiliconMilkroundaboutProvider(),
    new DiceUKProvider(),
    new GAAPwebProvider(),
    new CityJobsProvider(),
    new BarclaySimpsonProvider(),
    new HealthjobsProvider(),
    new NursesProvider(),
    new BMJCareersProvider(),
    new TracJobsProvider(),
    new NHSProfessionalsProvider(),
    new TesJobsProvider(),
    new TeachingVacanciesProvider(),
    new EteachProvider(),
    new FEjobsProvider(),
    new TimesHigherEducationProvider(),
    new EngineeringJobsProvider(),
    new ICERecruitProvider(),
    new JustEngineersProvider(),
    new TheManufacturerJobsProvider(),
    new FawkesReeceProvider(),
    new PropertyWeekJobsProvider(),
    new IWFMJobsProvider(),
    new CIPSJobsProvider(),
    new SupplyChainOnlineProvider(),
    new DriverHireProvider(),
    new CatererProvider(),
    new RetailChoiceProvider(),
    new HoscoProvider(),
    new CMTravelProvider(),
    new FashionJobsUKProvider(),
    new CivilServiceJobsProvider(),
    new CharityJobProvider(),
    new EnvironmentJobProvider(),
    new GreenJobsProvider(),
    new FarmingUKJobsProvider(),
    new TotallyLegalProvider(),
    new LawGazetteJobsProvider(),
    new TheLawyerJobsProvider(),
    new TargetJobsProvider(),
    new ProspectsProvider(),
    new MilkroundProvider(),
    new GradcrackerProvider(),
    new StudentCircusProvider(),
    new IndeedFlexProvider(),

    new IndeedBrowserProvider(),
    new GumtreeProvider(),
    new LinkedInProvider(),
    new MonsterProvider(),
    new GlassdoorProvider(),
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
