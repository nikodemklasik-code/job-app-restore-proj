/** Core vs optional sources (see source registry + backend spec). */
export type LegalSourceTier = 'core' | 'optional';

export interface LegalSearchScopeSummary {
  coreSourceCount: number;
  optionalEnabledCount: number;
  /** Human-readable scope line for responses / PDF. */
  scopeLabel: string;
  /**
   * `none` — catalogue + optional LLM summary over hits only (AFI narrow slice).
   * `configured` — `OPENAI_LEGAL_VECTOR_STORE_ID` is set; file_search wiring may be enabled in a later release (no false claim here).
   */
  vectorRetrievalMode: 'none' | 'configured';
}

export interface LegalCatalogEntry {
  title: string;
  url: string;
  tier: LegalSourceTier;
  tags: string[];
  snippet: string;
}

export interface LegalSearchHit {
  title: string;
  url: string;
  tier: LegalSourceTier;
  snippet: string;
  score: number;
}
