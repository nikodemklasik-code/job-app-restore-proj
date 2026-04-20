export type {
  LegalSourceTier,
  LegalSearchScopeSummary,
  LegalSearchHit,
  LegalCatalogEntry,
} from './legal-hub-search.types.js';
export { LEGAL_HUB_SOURCE_CATALOG } from './legal-hub-search.catalog.js';
export { getLegalSearchScopeSummary, searchLegalHubSources } from './legal-hub-search.service.js';
export { renderLegalSearchPdfBuffer } from './legal-hub-search.pdf.js';
