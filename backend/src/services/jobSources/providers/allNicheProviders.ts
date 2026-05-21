import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

type PlaceholderDefinition = {
  name: string;
  label: string;
  reason: string;
};

abstract class PlaceholderProvider implements JobSourceProvider {
  readonly name: string;
  readonly label: string;
  private readonly reason: string;

  protected constructor(definition: PlaceholderDefinition) {
    this.name = definition.name;
    this.label = definition.label;
    this.reason = definition.reason;
  }

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: false, reason: this.reason };
  }

  async discover(_input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    return [];
  }
}

// IT / Tech
export class TechnojobsProvider extends PlaceholderProvider { constructor() { super({ name: 'technojobs', label: 'Technojobs', reason: 'Provider registered as catalogue placeholder; RSS/API integration not implemented yet.' }); } }
export class TheITJobBoardProvider extends PlaceholderProvider { constructor() { super({ name: 'theitjobboard', label: 'The IT Job Board', reason: 'Provider registered as catalogue placeholder; aggregator integration not implemented yet.' }); } }
export class HarnhamProvider extends PlaceholderProvider { constructor() { super({ name: 'harnham', label: 'Harnham', reason: 'Provider registered as catalogue placeholder; data specialist feed not implemented yet.' }); } }
export class DataCareerProvider extends PlaceholderProvider { constructor() { super({ name: 'datacareer', label: 'DataCareer', reason: 'Provider registered as catalogue placeholder; feed integration not implemented yet.' }); } }
export class WorkInStartupsProvider extends PlaceholderProvider { constructor() { super({ name: 'workinstartups', label: 'Work In Startups', reason: 'Provider registered as catalogue placeholder; public feed integration not implemented yet.' }); } }
export class SiliconMilkroundaboutProvider extends PlaceholderProvider { constructor() { super({ name: 'siliconmilkroundabout', label: 'Silicon Milkroundabout', reason: 'Provider registered as catalogue placeholder; event/job feed integration not implemented yet.' }); } }
export class DiceUKProvider extends PlaceholderProvider { constructor() { super({ name: 'dice-uk', label: 'Dice UK', reason: 'Provider registered as catalogue placeholder; API or aggregator integration not implemented yet.' }); } }

// Finance
export class GAAPwebProvider extends PlaceholderProvider { constructor() { super({ name: 'gaapweb', label: 'GAAPweb', reason: 'Provider registered as catalogue placeholder; finance feed integration not implemented yet.' }); } }
export class CityJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'cityjobs', label: 'CityJobs', reason: 'Provider registered as catalogue placeholder; finance aggregator integration not implemented yet.' }); } }
export class BarclaySimpsonProvider extends PlaceholderProvider { constructor() { super({ name: 'barclaysimpson', label: 'Barclay Simpson', reason: 'Provider registered as catalogue placeholder; risk/compliance feed integration not implemented yet.' }); } }

// Healthcare
export class HealthjobsProvider extends PlaceholderProvider { constructor() { super({ name: 'healthjobs', label: 'Healthjobs.co.uk', reason: 'Provider registered as catalogue placeholder; healthcare feed integration not implemented yet.' }); } }
export class NursesProvider extends PlaceholderProvider { constructor() { super({ name: 'nurses', label: 'Nurses.co.uk', reason: 'Provider registered as catalogue placeholder; nursing feed integration not implemented yet.' }); } }
export class BMJCareersProvider extends PlaceholderProvider { constructor() { super({ name: 'bmj-careers', label: 'BMJ Careers', reason: 'Provider registered as catalogue placeholder; RSS/API integration not implemented yet.' }); } }
export class TracJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'trac-jobs', label: 'trac.jobs', reason: 'Provider registered as catalogue placeholder; NHS trust feed integration not implemented yet.' }); } }
export class NHSProfessionalsProvider extends PlaceholderProvider { constructor() { super({ name: 'nhs-professionals', label: 'NHS Professionals', reason: 'Provider registered as catalogue placeholder; flexible shift feed integration not implemented yet.' }); } }

// Education
export class TesJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'tes-jobs', label: 'Tes Jobs', reason: 'Provider registered as catalogue placeholder; education feed integration not implemented yet.' }); } }
export class TeachingVacanciesProvider extends PlaceholderProvider { constructor() { super({ name: 'teaching-vacancies', label: 'Teaching Vacancies', reason: 'Provider registered as catalogue placeholder; GOV.UK feed integration not implemented yet.' }); } }
export class EteachProvider extends PlaceholderProvider { constructor() { super({ name: 'eteach', label: 'Eteach', reason: 'Provider registered as catalogue placeholder; school jobs feed integration not implemented yet.' }); } }
export class FEjobsProvider extends PlaceholderProvider { constructor() { super({ name: 'fejobs', label: 'FEjobs', reason: 'Provider registered as catalogue placeholder; further education feed integration not implemented yet.' }); } }
export class TimesHigherEducationProvider extends PlaceholderProvider { constructor() { super({ name: 'timeshighereducation', label: 'Times Higher Education Jobs', reason: 'Provider registered as catalogue placeholder; higher education feed integration not implemented yet.' }); } }

// Engineering / construction
export class EngineeringJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'engineeringjobs', label: 'Engineering Jobs', reason: 'Provider registered as catalogue placeholder; engineering feed integration not implemented yet.' }); } }
export class ICERecruitProvider extends PlaceholderProvider { constructor() { super({ name: 'ice-recruit', label: 'ICE Recruit', reason: 'Provider registered as catalogue placeholder; civil engineering feed integration not implemented yet.' }); } }
export class JustEngineersProvider extends PlaceholderProvider { constructor() { super({ name: 'justengineers', label: 'Just Engineers', reason: 'Provider registered as catalogue placeholder; engineering aggregator integration not implemented yet.' }); } }
export class TheManufacturerJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'themanufacturerjobs', label: 'The Manufacturer Jobs', reason: 'Provider registered as catalogue placeholder; manufacturing feed integration not implemented yet.' }); } }
export class FawkesReeceProvider extends PlaceholderProvider { constructor() { super({ name: 'fawkesreece', label: 'Fawkes & Reece', reason: 'Provider registered as catalogue placeholder; construction feed integration not implemented yet.' }); } }
export class PropertyWeekJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'propertyweekjobs', label: 'Property Week Jobs', reason: 'Provider registered as catalogue placeholder; property feed integration not implemented yet.' }); } }
export class IWFMJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'iwfmjobs', label: 'IWFM Jobs', reason: 'Provider registered as catalogue placeholder; facilities management feed integration not implemented yet.' }); } }

// Logistics
export class CIPSJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'cips-jobs', label: 'CIPS Procurement & Supply Jobs', reason: 'Provider registered as catalogue placeholder; procurement feed integration not implemented yet.' }); } }
export class SupplyChainOnlineProvider extends PlaceholderProvider { constructor() { super({ name: 'supplychainonline', label: 'SupplyChainOnline', reason: 'Provider registered as catalogue placeholder; supply chain feed integration not implemented yet.' }); } }
export class DriverHireProvider extends PlaceholderProvider { constructor() { super({ name: 'driverhire', label: 'Driver Hire', reason: 'Provider registered as catalogue placeholder; driver jobs feed integration not implemented yet.' }); } }

// Hospitality / retail / tourism
export class CatererProvider extends PlaceholderProvider { constructor() { super({ name: 'caterer', label: 'Caterer.com', reason: 'Provider registered as catalogue placeholder; hospitality feed integration not implemented yet.' }); } }
export class RetailChoiceProvider extends PlaceholderProvider { constructor() { super({ name: 'retailchoice', label: 'RetailChoice.com', reason: 'Provider registered as catalogue placeholder; retail feed integration not implemented yet.' }); } }
export class HoscoProvider extends PlaceholderProvider { constructor() { super({ name: 'hosco', label: 'Hosco', reason: 'Provider registered as catalogue placeholder; hospitality aggregator integration not implemented yet.' }); } }
export class CMTravelProvider extends PlaceholderProvider { constructor() { super({ name: 'cmtravel', label: 'C&M Travel Recruitment', reason: 'Provider registered as catalogue placeholder; travel recruitment feed integration not implemented yet.' }); } }
export class FashionJobsUKProvider extends PlaceholderProvider { constructor() { super({ name: 'fashionjobs-uk', label: 'FashionJobs UK', reason: 'Provider registered as catalogue placeholder; fashion jobs feed integration not implemented yet.' }); } }

// Public / NGO / green
export class CivilServiceJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'civilservicejobs', label: 'Civil Service Jobs', reason: 'Provider registered as catalogue placeholder; civil service API integration not implemented yet.' }); } }
export class CharityJobProvider extends PlaceholderProvider { constructor() { super({ name: 'charityjob', label: 'CharityJob', reason: 'Provider registered as catalogue placeholder; charity jobs feed integration not implemented yet.' }); } }
export class EnvironmentJobProvider extends PlaceholderProvider { constructor() { super({ name: 'environmentjob', label: 'Environmentjob.co.uk', reason: 'Provider registered as catalogue placeholder; environment feed integration not implemented yet.' }); } }
export class GreenJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'greenjobs', label: 'GreenJobs', reason: 'Provider registered as catalogue placeholder; green jobs feed integration not implemented yet.' }); } }
export class FarmingUKJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'farmingukjobs', label: 'Farming UK Jobs', reason: 'Provider registered as catalogue placeholder; agriculture feed integration not implemented yet.' }); } }

// Legal
export class TotallyLegalProvider extends PlaceholderProvider { constructor() { super({ name: 'totallylegal', label: 'TotallyLegal', reason: 'Provider registered as catalogue placeholder; legal jobs feed integration not implemented yet.' }); } }
export class LawGazetteJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'lawgazettejobs', label: 'Law Gazette Jobs', reason: 'Provider registered as catalogue placeholder; law gazette feed integration not implemented yet.' }); } }
export class TheLawyerJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'thelawyerjobs', label: 'The Lawyer Jobs', reason: 'Provider registered as catalogue placeholder; legal feed integration not implemented yet.' }); } }

// Graduate / student
export class TargetJobsProvider extends PlaceholderProvider { constructor() { super({ name: 'targetjobs', label: 'TargetJobs', reason: 'Provider registered as catalogue placeholder; graduate feed integration not implemented yet.' }); } }
export class ProspectsProvider extends PlaceholderProvider { constructor() { super({ name: 'prospects', label: 'Prospects', reason: 'Provider registered as catalogue placeholder; graduate feed integration not implemented yet.' }); } }
export class MilkroundProvider extends PlaceholderProvider { constructor() { super({ name: 'milkround', label: 'Milkround', reason: 'Provider registered as catalogue placeholder; graduate feed integration not implemented yet.' }); } }
export class GradcrackerProvider extends PlaceholderProvider { constructor() { super({ name: 'gradcracker', label: 'Gradcracker', reason: 'Provider registered as catalogue placeholder; STEM graduate feed integration not implemented yet.' }); } }
export class StudentCircusProvider extends PlaceholderProvider { constructor() { super({ name: 'studentcircus', label: 'Student Circus', reason: 'Provider registered as catalogue placeholder; visa sponsorship feed integration not implemented yet.' }); } }
export class IndeedFlexProvider extends PlaceholderProvider { constructor() { super({ name: 'indeedflex', label: 'Indeed Flex', reason: 'Provider registered as catalogue placeholder; flexible work feed integration not implemented yet.' }); } }
