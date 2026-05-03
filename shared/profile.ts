export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  linkedinUrl: string;
  cvUrl: string;
}

export interface ProfileExperience {
  id: string;
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements?: string[];}

export interface ProfileExperienceInput {
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements?: string[];}

export interface ProfileEducation {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
}

export interface ProfileEducationInput {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
}

export interface ProfileTraining {
  id: string;
  title: string;
  providerName: string;
  issuedAt: string;
  expiresAt: string | null;
  credentialUrl: string;
}

export interface ProfileTrainingInput {
  title: string;
  providerName: string;
  issuedAt: string;
  expiresAt: string | null;
  credentialUrl: string;
}

export interface ProfileLanguage {
  id: string;
  name: string;
  proficiency: string;
  certificate?: string | null;
}

export interface ProfileLanguageInput {
  name: string;
  proficiency: string;
  certificate?: string | null;
}

export interface ProfileHobby {
  id: string;
  name: string;
  description?: string | null;
}

export interface ProfileHobbyInput {
  name: string;
  description?: string | null;
}

export type JobSearchStatus = 'active' | 'passive' | 'open' | 'not_looking';
export type WorkModePreference = 'remote' | 'hybrid' | 'onsite';
export type EmploymentTypePreference = 'full_time' | 'part_time' | 'temporary' | 'occasional';
export type ContractTypePreference = 'employment_contract' | 'b2b' | 'self_employed' | 'fixed_term' | 'contract';
export type RoadmapMilestoneStatus = 'not_started' | 'in_progress' | 'done';

export interface ProfileRoadmapMilestone {
  id: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  evidenceTarget?: string;
  status?: RoadmapMilestoneStatus;
}

export interface PreferredWorkSetup {
  workModePreferences: WorkModePreference[];
  employmentTypePreferences: EmploymentTypePreference[];
  contractPreferences: ContractTypePreference[];
  preferredHoursPerWeek?: number | null;
  preferredWorkRatio?: number | null;
}

export interface DreamJobProfile {
  targetRole?: string | null;
  targetSeniority?: string | null;
  targetIndustries?: string[];
  workModePreferences?: WorkModePreference[];
  employmentTypePreferences?: EmploymentTypePreference[];
  contractPreferences?: ContractTypePreference[];
  preferredHoursPerWeek?: number | null;
  preferredWorkRatio?: number | null;
  jobSearchStatus?: JobSearchStatus | null;
}

export interface ProfileStrategyJson {
  growthPlan?: string[];
  roadmap?: ProfileRoadmapMilestone[];
  skillCourseLinks?: Array<{
    skillName: string;
    courseId?: string;
    note?: string;
  }>;
  practiceAreas?: string[];
  blockedAreas?: string[];
  highImpactImprovements?: string[];
  workModePreferences?: WorkModePreference[];
  employmentTypePreferences?: EmploymentTypePreference[];
  contractPreferences?: ContractTypePreference[];
  preferredHoursPerWeek?: number | null;
  preferredWorkRatio?: number | null;
  targetIndustries?: string[];
  jobSearchStatus?: JobSearchStatus;
  languages?: ProfileLanguageInput[];
  hobbies?: ProfileHobbyInput[];
  dreamJob?: DreamJobProfile;
  potentialLearningPath?: Array<{
    id: string;
    title: string;
    whyItMatters?: string;
    relatedSkills?: string[];
    suggestedCourses?: string[];
    evidenceTarget?: string;
    status?: RoadmapMilestoneStatus;
  }>;
  [key: string]: unknown;
}

export interface CareerGoalsSnapshot {
  currentJobTitle: string | null;
  currentSalary: number | null;
  targetJobTitle: string | null;
  targetSalary: number | null;
  targetSalaryMin: number | null;
  targetSalaryMax: number | null;
  targetSeniority: string | null;
  workValues: string[];
  autoApplyMinScore: number;
  preferredWorkSetup?: PreferredWorkSetup;
  strategy: ProfileStrategyJson;
}

export interface SocialConsentsSnapshot {
  linkedinConsent: boolean;
  facebookConsent: boolean;
  instagramConsent: boolean;
}

export interface UserPreferenceFlagsSnapshot {
  caseStudyOptIn: boolean;
  communityVisibility: boolean;
  referralParticipation: boolean;
  sharedSessionsDiscoverable: boolean;
  aiPersonalizationEnabled: boolean;
}

export interface ProfileSnapshot {
  personalInfo: PersonalInfo;
  skills: string[];
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  trainings: ProfileTraining[];
  /** New dynamic collections are served by profilePreferences during router migration. */
  languages?: ProfileLanguage[];
  hobbies?: ProfileHobby[];
  careerGoals?: CareerGoalsSnapshot;
  socialConsents?: SocialConsentsSnapshot;
  preferenceFlags?: UserPreferenceFlagsSnapshot;
}
