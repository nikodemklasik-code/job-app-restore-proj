export type ExtractedSignalDraft = {
  signalScope: 'employer' | 'offer' | 'benchmark' | 'fit' | 'risk';
  category: string;
  signalKey: string;
  signalValueText?: string | null;
  signalValueNumber?: number | null;
  signalValueJson?: Record<string, unknown> | null;
  confidence: 'low' | 'medium' | 'high';
  isMissingData?: boolean;
};

export type ParsedSourceResult = {
  containsOfferFields: boolean;
  extractedFields: Record<string, unknown>;
  signals: ExtractedSignalDraft[];
  fieldConfidence: Record<string, 'low' | 'medium' | 'high'>;
};

export interface JobRadarParser {
  canParse(source: { sourceType: string; rawContent?: string | null }): boolean;

  parse(source: {
    sourceType: string;
    rawContent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<ParsedSourceResult>;
}
