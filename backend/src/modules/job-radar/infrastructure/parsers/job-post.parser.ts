import type { ExtractedSignalDraft, JobRadarParser, ParsedSourceResult } from './job-radar.parser.js';

export class JobPostParser implements JobRadarParser {
  canParse(source: { sourceType: string; rawContent?: string | null }): boolean {
    return (
      Boolean(source.rawContent) &&
      ['official_website', 'careers_page', 'job_board'].includes(source.sourceType)
    );
  }

  async parse(source: {
    sourceType: string;
    rawContent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<ParsedSourceResult> {
    const raw = source.rawContent ?? '';
    const text = this.stripHtml(raw);

    const signals: ExtractedSignalDraft[] = [];
    const fieldConfidence: Record<string, 'low' | 'medium' | 'high'> = {};

    const workMode = this.detectWorkMode(text);
    if (workMode) {
      signals.push({
        signalScope: 'offer',
        category: 'flexibility',
        signalKey: 'work_mode',
        signalValueText: workMode,
        confidence: 'medium',
      });
      fieldConfidence.work_mode = 'medium';
    }

    const currencySalary = this.detectSalary(text);
    if (currencySalary) {
      signals.push({
        signalScope: 'offer',
        category: 'salary',
        signalKey: 'salary_min',
        signalValueNumber: currencySalary.min,
        confidence: 'medium',
      });
      signals.push({
        signalScope: 'offer',
        category: 'salary',
        signalKey: 'salary_max',
        signalValueNumber: currencySalary.max,
        confidence: 'medium',
      });
      signals.push({
        signalScope: 'offer',
        category: 'salary',
        signalKey: 'currency',
        signalValueText: currencySalary.currency,
        confidence: 'medium',
      });
      fieldConfidence.salary = 'medium';
    } else {
      signals.push({
        signalScope: 'offer',
        category: 'salary',
        signalKey: 'salary_missing',
        signalValueText: 'true',
        confidence: 'high',
        isMissingData: true,
      });
    }

    const benefits = this.detectBenefits(text);
    for (const benefit of benefits) {
      signals.push({
        signalScope: 'offer',
        category: 'benefits',
        signalKey: `benefit_${benefit}`,
        signalValueText: 'true',
        confidence: 'medium',
      });
    }

    const title = this.detectTitle(text);
    if (title) {
      fieldConfidence.title = 'low';
    }

    return {
      containsOfferFields: Boolean(workMode || currencySalary || benefits.length > 0),
      extractedFields: {
        title,
        work_mode: workMode,
        salary: currencySalary,
        benefits,
      },
      signals,
      fieldConfidence,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectWorkMode(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes('hybrid')) return 'Hybrid';
    if (lower.includes('remote')) return 'Remote';
    if (lower.includes('on-site') || lower.includes('onsite')) return 'Onsite';
    return null;
  }

  private detectSalary(text: string): { min: number; max: number; currency: string } | null {
    const gbpRange = text.match(/£\s?(\d{2,3}(?:,\d{3})?)\s?[-–to]{1,3}\s?£?\s?(\d{2,3}(?:,\d{3})?)/i);
    if (!gbpRange) return null;

    const min = Number(gbpRange[1].replace(/,/g, ''));
    const max = Number(gbpRange[2].replace(/,/g, ''));
    if (Number.isNaN(min) || Number.isNaN(max)) return null;

    return { min, max, currency: 'GBP' };
  }

  private detectBenefits(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];

    if (lower.includes('private healthcare')) found.push('private_healthcare');
    if (lower.includes('training budget')) found.push('training_budget');
    if (lower.includes('flexible hours')) found.push('flexible_hours');
    if (lower.includes('bonus')) found.push('bonus');
    if (lower.includes('home office')) found.push('home_office_support');

    return found;
  }

  private detectTitle(text: string): string | null {
    const match = text.match(/(product designer|software engineer|product manager|data analyst)/i);
    return match?.[1] ?? null;
  }
}
