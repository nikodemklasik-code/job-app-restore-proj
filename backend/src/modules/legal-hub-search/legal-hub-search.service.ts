import { LEGAL_HUB_SOURCE_CATALOG } from './legal-hub-search.catalog.js';
import type {
  LegalSearchHit,
  LegalSearchScopeSummary,
  LegalSourceTier,
} from './legal-hub-search.types.js';

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function tokenize(q: string): string[] {
  return normalizeQuery(q)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/gi, ''))
    .filter((t) => t.length > 1);
}

function scoreEntry(query: string, tokens: string[], tier: LegalSourceTier): number {
  const nq = normalizeQuery(query);
  let score = tier === 'core' ? 2 : 0;
  if (!nq) return 0;
  const hay = nq;
  for (const t of tokens) {
    if (hay.includes(t)) score += 3;
  }
  return score;
}

export function getLegalSearchScopeSummary(): LegalSearchScopeSummary {
  const coreSourceCount = LEGAL_HUB_SOURCE_CATALOG.filter((e) => e.tier === 'core').length;
  const optionalEnabledCount = LEGAL_HUB_SOURCE_CATALOG.filter((e) => e.tier === 'optional').length;
  const vectorRetrievalMode =
    typeof process.env.OPENAI_LEGAL_VECTOR_STORE_ID === 'string' && process.env.OPENAI_LEGAL_VECTOR_STORE_ID.trim().length > 0
      ? ('configured' as const)
      : ('none' as const);
  const base = `${coreSourceCount} core GOV.UK/ACAS links, ${optionalEnabledCount} optional reference links in catalogue`;
  const scopeLabel =
    vectorRetrievalMode === 'configured'
      ? `${base}; vector store id configured (retrieval path is product-dependent — catalogue grounding remains primary).`
      : `${base}; vector-backed file_search not configured (catalogue + optional grounded summary only).`;
  return {
    coreSourceCount,
    optionalEnabledCount,
    scopeLabel,
    vectorRetrievalMode,
  };
}

export function searchLegalHubSources(query: string, limit = 8): LegalSearchHit[] {
  const nq = normalizeQuery(query);
  if (nq.length < 2) return [];
  const tokens = tokenize(query);

  const hits: LegalSearchHit[] = [];
  for (const entry of LEGAL_HUB_SOURCE_CATALOG) {
    const blob = `${entry.title} ${entry.snippet} ${entry.tags.join(' ')}`.toLowerCase();
    let s = scoreEntry(query, tokens, entry.tier);
    if (blob.includes(nq)) s += 5;
    for (const t of tokens) {
      if (blob.includes(t)) s += 2;
    }
    if (s > 0) {
      hits.push({
        title: entry.title,
        url: entry.url,
        tier: entry.tier,
        snippet: entry.snippet,
        score: s,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, Math.min(Math.max(limit, 1), 20));
}
