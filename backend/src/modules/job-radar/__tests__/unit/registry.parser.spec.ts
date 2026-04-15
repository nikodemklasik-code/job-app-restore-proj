import { describe, it, expect } from 'vitest';
import { RegistryParser } from '../../infrastructure/parsers/registry.parser.js';

describe('RegistryParser', () => {
  const parser = new RegistryParser();

  it('creates inactive company risk signal', async () => {
    const result = await parser.parse({
      sourceType: 'registry',
      rawContent: JSON.stringify({
        company_name: 'Example Ltd',
        company_status: 'dissolved',
        company_number: '12345678',
      }),
      metadata: {},
    });

    const keys = result.signals.map((s) => s.signalKey);
    expect(keys).toContain('registry_status');
    expect(keys).toContain('fake_or_inactive_company_signal');
  });
});
