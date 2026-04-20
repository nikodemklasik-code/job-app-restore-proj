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
}

export interface ProfileExperienceInput {
  employerName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  description: string;
}

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

export type ProfileStrategyJson = Record<string, unknown>;

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
  careerGoals?: CareerGoalsSnapshot;
  socialConsents?: SocialConsentsSnapshot;
  preferenceFlags?: UserPreferenceFlagsSnapshot;
}
