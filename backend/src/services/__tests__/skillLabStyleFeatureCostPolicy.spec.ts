import { describe, expect, it } from 'vitest';
import { estimateCostFor } from '../creditsBilling.policy.js';
import { FEATURE_COSTS } from '../creditsConfig.js';

/**
 * Narrow regression slice: Skill Lab gap / course suggest + Style document analysis
 * catalogue keys must stay aligned with estimateCostFor (used by approveSpend paths).
 */
describe('skill_lab + style feature keys / estimateCostFor', () => {
  it.each([
    ['skill_lab_gap_analysis', 3, 6] as const,
    ['skill_lab_course_suggest', 1, 3] as const,
    ['style_analyze_document', 3, 6] as const,
  ])('%s matches FEATURE_COSTS and suggested max', (key, min, max) => {
    const cfg = FEATURE_COSTS[key];
    if (cfg.kind !== 'estimated') throw new Error('expected estimated cfg');
    const est = estimateCostFor(key);
    expect(est.kind).toBe('estimated');
    expect(est.minCost).toBe(min);
    expect(est.maxCost).toBe(max);
    expect(est.suggestedApprovedMaxCost).toBe(max);
    expect(cfg.minCost).toBe(min);
    expect(cfg.maxCost).toBe(max);
  });
});
