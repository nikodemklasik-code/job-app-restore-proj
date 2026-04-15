import type {
  ExtractedSignalDraft,
  JobRadarParser,
  ParsedSourceResult,
} from './job-radar.parser.js';

export class RegistryParser implements JobRadarParser {
  canParse(source: { sourceType: string; rawContent?: string | null }): boolean {
    return source.sourceType === 'registry' && Boolean(source.rawContent);
  }

  async parse(source: {
    sourceType: string;
    rawContent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<ParsedSourceResult> {
    const raw = source.rawContent ?? '{}';

    let parsedJson: Record<string, unknown>;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new Error('INVALID_REGISTRY_JSON');
    }

    const signals: ExtractedSignalDraft[] = [];
    const fieldConfidence: Record<string, 'low' | 'medium' | 'high'> = {};

    const companyName = this.getString(parsedJson.company_name);
    const companyStatus = this.getString(parsedJson.company_status);
    const companyNumber = this.getString(parsedJson.company_number);
    const incorporatedOn = this.getString(parsedJson.incorporated_on);
    const officeAddress = this.getString(parsedJson.registered_office_address);

    if (companyName) {
      signals.push({
        signalScope: 'employer',
        category: 'identity',
        signalKey: 'registry_company_name',
        signalValueText: companyName,
        confidence: 'high',
      });
      fieldConfidence.registry_company_name = 'high';
    }

    if (companyStatus) {
      signals.push({
        signalScope: 'employer',
        category: 'stability',
        signalKey: 'registry_status',
        signalValueText: companyStatus,
        confidence: 'high',
      });
      fieldConfidence.registry_status = 'high';

      if (companyStatus.toLowerCase() !== 'active') {
        signals.push({
          signalScope: 'risk',
          category: 'registry',
          signalKey: 'fake_or_inactive_company_signal',
          signalValueText: 'true',
          confidence: 'high',
        });
      }
    } else {
      signals.push({
        signalScope: 'risk',
        category: 'registry',
        signalKey: 'registry_status_missing',
        signalValueText: 'true',
        confidence: 'medium',
        isMissingData: true,
      });
    }

    if (companyNumber) {
      signals.push({
        signalScope: 'employer',
        category: 'identity',
        signalKey: 'registry_company_number',
        signalValueText: companyNumber,
        confidence: 'high',
      });
    }

    if (incorporatedOn) {
      signals.push({
        signalScope: 'employer',
        category: 'stability',
        signalKey: 'registry_incorporated_on',
        signalValueText: incorporatedOn,
        confidence: 'high',
      });
    }

    if (officeAddress) {
      signals.push({
        signalScope: 'employer',
        category: 'identity',
        signalKey: 'registry_registered_office',
        signalValueText: officeAddress,
        confidence: 'medium',
      });
    }

    return {
      containsOfferFields: false,
      extractedFields: {
        registry_company_name: companyName,
        registry_status: companyStatus,
        registry_company_number: companyNumber,
        registry_incorporated_on: incorporatedOn,
        registry_registered_office: officeAddress,
      },
      signals,
      fieldConfidence,
    };
  }

  private getString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
