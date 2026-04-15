import { describe, it, expect } from 'vitest';
import { OverrideRuleEngine } from '../../application/services/override-rule-engine.service.js';

describe('OverrideRuleEngine', () => {
  it('applies override for inactive registry signal', () => {
    const engine = new OverrideRuleEngine();

    const result = engine.evaluate({
      signals: [{ signalKey: 'fake_or_inactive_company_signal' }],
      findings: [],
      recommendation: 'Strong Match',
    });

    expect(result.overrideApplied).toBe(true);
    expect(result.overrideCeiling).toBe('Mixed Signals');
  });
});
