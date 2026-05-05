/**
 * jobProtection.ts
 * Analyses a job listing for scam/risk signals and employer trust indicators.
 * Pure function — no DB or network calls.
 */

export type ScamAnalysis = {
  riskScore: number;        // 0–100
  level: 'low' | 'medium' | 'high';
  reasons: string[];
};

export type BenefitSignal = {
  type: string;
  label: string;
  source: 'detected_in_listing';
};

export type UkSignal = {
  type: string;
  label: string;
  present: boolean;
};

export type EmployerSignals = {
  trustScore: number;                        // 0–100
  trustLevel: 'verified' | 'likely_legit' | 'review' | 'risky';
  riskScore: number;                         // 0–100
  riskLevel: 'low' | 'medium' | 'high';
  salaryTransparency: 'full' | 'range' | 'none';
  descriptionQuality: 'detailed' | 'average' | 'thin';
  requirementsClarity: 'clear' | 'vague' | 'none';
  workModeClarity: 'explicit' | 'implicit' | 'none';
  benefits: BenefitSignal[];
  ukSignals: UkSignal[];
  trustReasons: string[];
  riskReasons: string[];
};

type JobInput = {
  title: string;
  company?: string | null;
  description?: string | null;
  applyUrl?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
};

// ── Scam patterns ─────────────────────────────────────────────────────────────

const HIGH_RISK_PATTERNS = [
  /earn\s+\$?\d{3,}[k+]?\s*(per|a)\s*(day|week)/i,
  /work\s*from\s*home\s*(and\s*)?earn/i,
  /no\s*(experience|qualifications?)\s*required/i,
  /wire\s*transfer|western\s*union|gift\s*card/i,
  /uncapped\s*earnings?/i,
  /\$\d{4,}\s*(per|a)\s*(day|week)/i,
  /mystery\s*shopper/i,
  /data\s*entry\s*(from\s*home)?\s*\$\d+/i,
];

const MEDIUM_RISK_PATTERNS = [
  /urgent(ly)?\s*(hiring|needed|required)/i,
  /make\s*\$\d{3,}\s*(fast|quick|easily)/i,
  /be\s*your\s*own\s*boss/i,
  /unlimited\s*(income|earning|potential)/i,
  /100%\s*commission\s*only/i,
  /no\s*interview\s*required/i,
];

// ── Benefit keywords ──────────────────────────────────────────────────────────

const BENEFIT_PATTERNS: Array<{ regex: RegExp; type: string; label: string }> = [
  { regex: /private\s*(health|medical|dental|optical)/i, type: 'health', label: 'Private healthcare' },
  { regex: /pension|401k/i, type: 'pension', label: 'Pension / 401k' },
  { regex: /remote\s*work|work\s*from\s*home|wfh/i, type: 'remote', label: 'Remote working' },
  { regex: /hybrid/i, type: 'hybrid', label: 'Hybrid working' },
  { regex: /flexible\s*(hours?|working|schedule)/i, type: 'flex', label: 'Flexible hours' },
  { regex: /cycle\s*to\s*work|bike\s*scheme/i, type: 'cycle', label: 'Cycle to work' },
  { regex: /share\s*option|eso[ps]?|equity/i, type: 'equity', label: 'Share options / equity' },
  { regex: /annual\s*(leave|holiday)|paid\s*time\s*off|pto/i, type: 'leave', label: 'Annual leave' },
  { regex: /bonus/i, type: 'bonus', label: 'Bonus scheme' },
  { regex: /training\s*(budget|allowance)|learning\s*budget|l&d/i, type: 'learning', label: 'L&D budget' },
  { regex: /gym\s*(membership|subsidy)|wellness/i, type: 'wellness', label: 'Wellness / gym' },
  { regex: /parental\s*leave|maternity|paternity/i, type: 'parental', label: 'Enhanced parental leave' },
];

// ── UK-specific signals ───────────────────────────────────────────────────────

const UK_SIGNAL_PATTERNS: Array<{ type: string; label: string; regex: RegExp }> = [
  { type: 'right_to_work', label: 'Right to Work check', regex: /right\s*to\s*work/i },
  { type: 'dbs', label: 'DBS check', regex: /\bdbs\b|disclosure\s*and\s*barring/i },
  { type: 'ir35', label: 'IR35 mentioned', regex: /\bir35\b/i },
  { type: 'sc_clearance', label: 'Security clearance required', regex: /sc\s*cleared|security\s*clearance|nsc/i },
  { type: 'visa_sponsorship', label: 'Visa sponsorship available', regex: /visa\s*sponsor/i },
  { type: 'equality_statement', label: 'Equal opportunities stated', regex: /equal\s*opportunit/i },
];

// ── Core functions ────────────────────────────────────────────────────────────

export function assessJobScamRisk(job: JobInput): ScamAnalysis {
  const text = `${job.title} ${job.company ?? ''} ${job.description ?? ''} ${job.applyUrl ?? ''}`;
  const reasons: string[] = [];
  let riskScore = 0;

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(text)) {
      riskScore += 30;
      reasons.push(`High-risk pattern detected in listing text`);
    }
  }

  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(text)) {
      riskScore += 15;
      reasons.push(`Suspicious phrasing detected`);
    }
  }

  // No salary info AND no description = suspicious
  if (!job.salaryMin && !job.salaryMax && (!job.description || job.description.length < 100)) {
    riskScore += 10;
    reasons.push('Very thin listing — no salary or description');
  }

  // Apply URL points to suspicious domain
  if (job.applyUrl) {
    if (/bit\.ly|tinyurl|goo\.gl/i.test(job.applyUrl)) {
      riskScore += 20;
      reasons.push('Apply URL uses a URL shortener');
    }
  }

  const capped = Math.min(riskScore, 100);
  const level: ScamAnalysis['level'] =
    capped >= 50 ? 'high' : capped >= 25 ? 'medium' : 'low';

  return { riskScore: capped, level, reasons: [...new Set(reasons)] };
}

export function assessEmployerSignals(job: JobInput): EmployerSignals {
  const desc = job.description ?? '';
  const trustReasons: string[] = [];
  const riskReasons: string[] = [];
  let trustScore = 50;

  // ── Salary transparency ───────────────────────────────────────────────────
  const salaryTransparency: EmployerSignals['salaryTransparency'] =
    job.salaryMin && job.salaryMax ? 'full'
    : job.salaryMin || job.salaryMax ? 'range'
    : 'none';

  if (salaryTransparency === 'full') { trustScore += 10; trustReasons.push('Full salary range disclosed'); }
  else if (salaryTransparency === 'none') { riskReasons.push('No salary information provided'); }

  // ── Description quality ───────────────────────────────────────────────────
  const descriptionQuality: EmployerSignals['descriptionQuality'] =
    desc.length > 800 ? 'detailed'
    : desc.length > 250 ? 'average'
    : 'thin';

  if (descriptionQuality === 'detailed') { trustScore += 10; trustReasons.push('Detailed job description'); }
  else if (descriptionQuality === 'thin') { riskReasons.push('Very short description'); }

  // ── Requirements clarity ──────────────────────────────────────────────────
  const hasRequirements = /require[sd]?:|responsibilities:|you (will|must|should)|minimum \d|essential:/i.test(desc);
  const requirementsClarity: EmployerSignals['requirementsClarity'] =
    hasRequirements ? 'clear'
    : desc.length > 200 ? 'vague'
    : 'none';

  if (requirementsClarity === 'clear') { trustScore += 5; trustReasons.push('Clear requirements listed'); }

  // ── Work mode clarity ─────────────────────────────────────────────────────
  const workModeClarity: EmployerSignals['workModeClarity'] =
    /\b(remote|hybrid|on.?site|in.?office|work from home|wfh)\b/i.test(desc) ? 'explicit'
    : desc.length > 200 ? 'implicit'
    : 'none';

  if (workModeClarity === 'explicit') { trustScore += 5; trustReasons.push('Work mode explicitly stated'); }

  // ── Benefits ──────────────────────────────────────────────────────────────
  const benefits: BenefitSignal[] = BENEFIT_PATTERNS
    .filter(({ regex }) => regex.test(desc))
    .map(({ type, label }) => ({ type, label, source: 'detected_in_listing' as const }));

  if (benefits.length > 3) { trustScore += 5; trustReasons.push(`${benefits.length} benefits mentioned`); }

  // ── UK signals ────────────────────────────────────────────────────────────
  const ukSignals: UkSignal[] = UK_SIGNAL_PATTERNS.map(({ type, label, regex }) => ({
    type, label, present: regex.test(desc),
  }));

  if (ukSignals.find((s) => s.type === 'equality_statement' && s.present)) {
    trustScore += 5;
    trustReasons.push('Equal opportunities statement present');
  }

  // ── Scam deductions ───────────────────────────────────────────────────────
  const scam = assessJobScamRisk(job);
  trustScore -= scam.riskScore * 0.4;
  if (scam.level !== 'low') riskReasons.push(...scam.reasons);

  const cappedTrust = Math.max(0, Math.min(100, Math.round(trustScore)));
  const trustLevel: EmployerSignals['trustLevel'] =
    cappedTrust >= 75 ? 'verified'
    : cappedTrust >= 55 ? 'likely_legit'
    : cappedTrust >= 35 ? 'review'
    : 'risky';

  return {
    trustScore: cappedTrust,
    trustLevel,
    riskScore: scam.riskScore,
    riskLevel: scam.level,
    salaryTransparency,
    descriptionQuality,
    requirementsClarity,
    workModeClarity,
    benefits,
    ukSignals,
    trustReasons,
    riskReasons,
  };
}
