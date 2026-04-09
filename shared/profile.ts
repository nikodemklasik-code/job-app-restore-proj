export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
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

export interface ProfileSnapshot {
  personalInfo: PersonalInfo;
  skills: string[];
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  trainings: ProfileTraining[];
}
