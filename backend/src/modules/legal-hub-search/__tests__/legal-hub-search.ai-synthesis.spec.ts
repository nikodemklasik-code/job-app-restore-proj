import { describe, expect, it, vi, afterEach } from 'vitest';
import * as openaiClient from '../../../lib/openai/openai.client.js';
import { trySynthesizeLegalCatalogHits } from '../legal-hub-search.ai-synthesis.js';

const sampleHit = {
  title: 'Holiday entitlement',
  url: 'https://www.gov.uk/holiday-entitlement-rights',
  tier: 'core' as const,
  snippet: 'Statutory leave basics',
  score: 5,
};

describe('trySynthesizeLegalCatalogHits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns grounded summary when OpenAI client is available', async () => {
    vi.spyOn(openaiClient, 'tryGetOpenAiClient').mockReturnValue({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Summary paragraph.\n- Open GOV.UK first' } }],
          }),
        },
      },
    } as unknown as NonNullable<ReturnType<typeof openaiClient.tryGetOpenAiClient>>);

    const out = await trySynthesizeLegalCatalogHits('holiday pay', [sampleHit]);
    expect(out?.text).toContain('Summary');
    expect(out?.synthesisLabel).toBe('Official catalogue summary');
    expect(out?.sourceCount).toBe(1);
  });

  it('returns null when client is unavailable', async () => {
    vi.spyOn(openaiClient, 'tryGetOpenAiClient').mockReturnValue(null);
    expect(await trySynthesizeLegalCatalogHits('holiday pay', [sampleHit])).toBeNull();
  });
});
