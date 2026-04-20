import { tryGetOpenAiClient } from '../../lib/openai/openai.client.js';
import { getLegalSearchModel } from '../../lib/openai/model-registry.js';
import type { LegalSearchHit } from './legal-hub-search.types.js';

export interface LegalCatalogGroundedSummary {
  /** Plain-language synthesis; must not replace official sources. */
  text: string;
  /** Product tier label only (not raw OpenAI model id). */
  modelTier: 'legalSearch';
  sourceCount: number;
  synthesisLabel: string;
}

/**
 * Grounded synthesis over catalogue hits only (no open web).
 * When `OPENAI_LEGAL_VECTOR_STORE_ID` is added later, wire file_search here without changing the API shape.
 */
export async function trySynthesizeLegalCatalogHits(
  query: string,
  hits: LegalSearchHit[],
): Promise<LegalCatalogGroundedSummary | null> {
  if (hits.length === 0) return null;
  const client = tryGetOpenAiClient();
  if (!client) return null;

  const context = hits
    .slice(0, 12)
    .map((h, i) => `[${i + 1}] ${h.title}\nURL: ${h.url}\nSnippet: ${h.snippet}`)
    .join('\n\n');

  const system = `You are a UK employment-law reference assistant inside a career app.
Rules:
- Use ONLY the numbered official sources below (titles, snippets, URLs). Do not use outside knowledge or the open web.
- If sources are insufficient, say so in one sentence and tell the user to open GOV.UK / ACAS / HMRC for live guidance.
- Educational guidance only — not legal advice. Under 220 words.
- Output: 1 short paragraph + bullet list of which links to open first and why.`;

  const user = `User topic: "${query.slice(0, 500)}"\n\nCatalogue sources:\n${context}`;

  try {
    const resp = await client.chat.completions.create({
      model: getLegalSearchModel(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 420,
      temperature: 0.35,
    });
    const text = resp.choices[0]?.message?.content?.trim();
    if (!text) return null;
    return {
      text,
      modelTier: 'legalSearch',
      sourceCount: hits.length,
      synthesisLabel: 'Official catalogue summary',
    };
  } catch (err) {
    console.error('[legal-hub-search] grounded synthesis failed:', err);
    return null;
  }
}
