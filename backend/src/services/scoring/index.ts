/**
 * Scoring Service — barrel export.
 *
 * All scoring algorithms are pure functions (deterministic, no side effects)
 * except for auditLog which writes to the database.
 */

export { computeActionPriority, type ActionPriorityOutput } from './actionPriority.js';
export { computeInputHash, writeAuditEntry } from './auditLog.js';
export { computeEmployerRisk } from './employerRisk.js';
export { computeEmployerTrust } from './employerTrust.js';
export { computeEvidenceStrength } from './evidenceStrength.js';
export { computeJobFit } from './jobFit.js';
export { computeMarketValue, type MarketValueResult } from './marketValue.js';
export { computeRecencyDimension } from './recency.js';
export { computeSkillReadiness, type SkillReadinessInput } from './skillReadiness.js';
