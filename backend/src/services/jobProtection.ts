export interface ScamSignal {
  code: string;
  label: string;
  weight: number;
  evidence?: string;
}

export interface ScamAssessment {
  riskScore: number;
  confidenceScore: number;
  level: 'low' | 'medium' | 'high';
  safeForAutomation: boolean;
  signals: ScamSignal[];
  reasons: string[];
}

export interface ScamJobInput {
  title: string;
  company?: string | null;
  description?: string | null;
  applyUrl?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

const suspiciousPatterns: Array<{ code: string; label: string; weight: number; regex: RegExp }> = [
  { code: 'payment_request', label: 'Mentions fees, deposits, or payments from the candidate', weight: 35, regex: /(deposit|registration fee|training fee|processing fee|pay upfront|purchase equipment|security payment)/i },
  { code: 'messaging_redirect', label: 'Pushes the candidate to WhatsApp or Telegram', weight: 22, regex: /(whatsapp|telegram|signal app|text me on)/i },
  { code: 'crypto', label: 'Mentions crypto or investment-style recruitment', weight: 26, regex: /(crypto|blockchain investment|trading signals|forex|investment return)/i },
  { code: 'pressure_language', label: 'Uses urgency or pressure language', weight: 14, regex: /(immediate start|urgent hiring|limited spots|act now|today only|quick money)/i },
  { code: 'guaranteed_money', label: 'Promises unrealistic or guaranteed earnings', weight: 24, regex: /(guaranteed income|guaranteed earnings|earn \$?\d+\s*(per day|daily|weekly)|easy money|instant income)/i },
  { code: 'mlm', label: 'Looks like MLM or commission-only selling', weight: 25, regex: /(mlm|multi[- ]level|pyramid scheme|commission only|be your own boss)/i },
  { code: 'generic_recruitment', label: 'The description is very generic', weight: 10, regex: /(no experience needed|simple tasks|anyone can do this|full training provided)/i },
  { code: 'personal_data', label: 'Requests sensitive personal or banking data early', weight: 30, regex: /(bank details|passport copy|national insurance number|driving licence copy|send your id)/i },
];

function safeHost(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function containsCareerSignal(host: string): boolean {
  return ['indeed.', 'reed.', 'adzuna.', 'jooble.', 'gumtree.', 'linkedin.', 'greenhouse.', 'lever.', 'workday.', 'smartrecruiters.']
    .some((needle) => host.includes(needle));
}

export function assessJobScamRisk(input: ScamJobInput): ScamAssessment {
  const title = input.title?.trim() ?? '';
  const company = input.company?.trim() ?? '';
  const description = input.description?.trim() ?? '';
  const applyUrl = input.applyUrl?.trim() ?? '';
  const text = `${title}\n${company}\n${description}`;
  const lowerText = text.toLowerCase();
  const signals: ScamSignal[] = [];

  for (const pattern of suspiciousPatterns) {
    const match = lowerText.match(pattern.regex);
    if (match) {
      signals.push({ code: pattern.code, label: pattern.label, weight: pattern.weight, evidence: match[0] });
    }
  }

  if (!company || /^(confidential|private employer|private company|n\/a|unknown)$/i.test(company)) {
    signals.push({ code: 'missing_company', label: 'Company identity is missing or generic', weight: 16, evidence: company || 'missing company' });
  }

  if (description.length > 0 && description.length < 80) {
    signals.push({ code: 'thin_description', label: 'Job description is unusually thin', weight: 14, evidence: `${description.length} characters` });
  }

  const host = safeHost(applyUrl);
  if (!host) {
    signals.push({ code: 'invalid_apply_url', label: 'Apply URL is missing or invalid', weight: 18, evidence: applyUrl || 'missing url' });
  } else if (!containsCareerSignal(host)) {
    const normalizedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedHost = host.replace(/[^a-z0-9]/g, '');
    if (normalizedCompany && !normalizedHost.includes(normalizedCompany.slice(0, Math.min(normalizedCompany.length, 6)))) {
      signals.push({ code: 'domain_mismatch', label: 'Apply domain does not clearly match the employer', weight: 16, evidence: host });
    }
  }

  if (/@(gmail|yahoo|hotmail|outlook)\./i.test(description) || /@(gmail|yahoo|hotmail|outlook)\./i.test(applyUrl)) {
    signals.push({ code: 'generic_email', label: 'Uses a generic email domain for hiring', weight: 14 });
  }

  const salaryMax = input.salaryMax ?? 0;
  const salaryMin = input.salaryMin ?? 0;
  if (salaryMax >= 200000 || salaryMin >= 150000) {
    signals.push({ code: 'salary_outlier', label: 'Salary looks unusually high for a general listing', weight: 12, evidence: `${salaryMin}-${salaryMax}` });
  }

  const uniqueCodes = new Set<string>();
  const dedupedSignals = signals.filter((signal) => {
    if (uniqueCodes.has(signal.code)) return false;
    uniqueCodes.add(signal.code);
    return true;
  });

  const riskScore = Math.max(0, Math.min(100, dedupedSignals.reduce((sum, signal) => sum + signal.weight, 0)));
  const confidenceBase = 35 + Math.min(description.length / 12, 30) + (host ? 20 : 0) + (company ? 10 : 0);
  const confidenceScore = Math.max(20, Math.min(100, Math.round(confidenceBase)));
  const level: ScamAssessment['level'] = riskScore >= 55 ? 'high' : riskScore >= 28 ? 'medium' : 'low';

  return {
    riskScore,
    confidenceScore,
    level,
    safeForAutomation: level === 'low',
    signals: dedupedSignals,
    reasons: dedupedSignals.map((signal) => signal.label),
  };
}
