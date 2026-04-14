export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';

export type TargetRoleType =
  | 'software-engineer'
  | 'product-manager'
  | 'designer'
  | 'sales'
  | 'marketing'
  | 'engineering-manager'
  | 'customer-support';

export interface CandidateProfile {
  targetRole: TargetRoleType;
  targetLevel: SeniorityLevel;
  detectedStrengths: string[];
  areasToStrengthen: string[];
  communicationStyle?: 'analytical' | 'operational' | 'strategic' | 'relational' | 'mixed';
}
