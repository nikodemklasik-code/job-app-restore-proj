/**
 * Employer Signal Detector
 *
 * Detects trust and risk signals across 9 verification categories (A–I)
 * from job listing text and employer data. Uses keyword pattern matching
 * and heuristic rules. All signals use signal language (observations, not judgments).
 */

import { buildTrustMetadata } from '../skillMatrix/trustMetadata.js';
import type { EmployerSignalSeverity, SignalCategory, TrustMetadata } from '../skillMatrix/types.js';

export interface DetectedSignal {
    category: SignalCategory;
    signalType: string;
    score: number; // -100 to +100
    severity: EmployerSignalSeverity;
    title: string;
    explanation: string;
    trustMetadata: TrustMetadata;
}

export interface JobListingInput {
    title: string;
    description: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    location?: string | null;
    company: string;
    contractType?: string | null;
    sourceUrl?: string | null;
}

/**
 * Run all 9 category detectors on a job listing.
 */
export function detectAllSignals(listing: JobListingInput): DetectedSignal[] {
    const text = `${listing.title} ${listing.description}`.toLowerCase();
    const signals: DetectedSignal[] = [];

    signals.push(...detectIdentityCredibility(listing, text));
    signals.push(...detectOfferTransparency(listing, text));
    signals.push(...detectCompensationBenefits(listing, text));
    signals.push(...detectBusinessStability(listing, text));
    signals.push(...detectCultureManagement(listing, text));
    signals.push(...detectRecruitmentProcess(listing, text));
    signals.push(...detectTechnologyMaturity(listing, text));
    signals.push(...detectUkLocalRisks(listing, text));
    signals.push(...detectScamFraud(listing, text));

    return signals;
}

// ── Category A: Identity & Credibility ───────────────────────────────────────

function detectIdentityCredibility(listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(listing, 'identity_credibility');

    if (listing.company && listing.company.length > 2) {
        signals.push({
            category: 'identity_credibility',
            signalType: 'company_named',
            score: 20,
            severity: 'positive',
            title: 'Company name provided',
            explanation: `The listing identifies the employer as "${listing.company}".`,
            trustMetadata: meta(),
        });
    } else {
        signals.push({
            category: 'identity_credibility',
            signalType: 'company_anonymous',
            score: -30,
            severity: 'warning',
            title: 'Employer identity unclear',
            explanation: 'The listing does not clearly identify the hiring company.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category B: Offer Transparency ───────────────────────────────────────────

function detectOfferTransparency(listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(listing, 'offer_transparency');

    // Salary disclosed
    if (listing.salaryMin || listing.salaryMax) {
        signals.push({
            category: 'offer_transparency',
            signalType: 'salary_disclosed',
            score: 25,
            severity: 'positive',
            title: 'Salary range disclosed',
            explanation: 'The listing includes salary information, indicating compensation transparency.',
            trustMetadata: meta(),
        });
    } else {
        signals.push({
            category: 'offer_transparency',
            signalType: 'salary_hidden',
            score: -15,
            severity: 'neutral',
            title: 'Salary not disclosed',
            explanation: 'No salary information is provided in the listing.',
            trustMetadata: meta(),
        });
    }

    // Responsibilities detailed
    if (text.length > 500) {
        signals.push({
            category: 'offer_transparency',
            signalType: 'responsibilities_detailed',
            score: 15,
            severity: 'positive',
            title: 'Detailed role description',
            explanation: 'The listing provides a detailed description of responsibilities and expectations.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category C: Compensation & Benefits ──────────────────────────────────────

function detectCompensationBenefits(listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(listing, 'compensation_benefits');

    const benefitKeywords = ['pension', 'health insurance', 'private medical', 'dental', 'equity', 'share options', 'bonus', 'learning budget', 'training budget', 'remote', 'flexible'];
    const found = benefitKeywords.filter((kw) => text.includes(kw));

    if (found.length >= 3) {
        signals.push({
            category: 'compensation_benefits',
            signalType: 'benefits_comprehensive',
            score: 20,
            severity: 'positive',
            title: 'Multiple benefits mentioned',
            explanation: `The listing mentions several benefits: ${found.join(', ')}.`,
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category D: Business Stability ───────────────────────────────────────────

function detectBusinessStability(_listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(_listing, 'business_stability');

    if (text.includes('series') || text.includes('funded') || text.includes('backed by')) {
        signals.push({
            category: 'business_stability',
            signalType: 'funding_mentioned',
            score: 10,
            severity: 'positive',
            title: 'Funding or backing mentioned',
            explanation: 'The listing references funding or investor backing.',
            trustMetadata: meta(),
        });
    }

    if (text.includes('restructur') || text.includes('redundanc') || text.includes('layoff')) {
        signals.push({
            category: 'business_stability',
            signalType: 'instability_signal',
            score: -25,
            severity: 'warning',
            title: 'Possible instability signal',
            explanation: 'The listing or company context contains language that may indicate organizational changes.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category E: Culture & Management ─────────────────────────────────────────

function detectCultureManagement(_listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(_listing, 'culture_management');

    const positiveKeywords = ['work-life balance', 'flexible working', 'mental health', 'diversity', 'inclusion', 'wellbeing', 'autonomy'];
    const found = positiveKeywords.filter((kw) => text.includes(kw));

    if (found.length >= 2) {
        signals.push({
            category: 'culture_management',
            signalType: 'culture_positive',
            score: 15,
            severity: 'positive',
            title: 'Positive culture indicators',
            explanation: `The listing mentions culture-positive terms: ${found.join(', ')}.`,
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category F: Recruitment Process ──────────────────────────────────────────

function detectRecruitmentProcess(_listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(_listing, 'recruitment_process');

    if (text.includes('interview process') || text.includes('hiring process') || text.includes('stages')) {
        signals.push({
            category: 'recruitment_process',
            signalType: 'process_described',
            score: 15,
            severity: 'positive',
            title: 'Recruitment process outlined',
            explanation: 'The listing describes the interview or hiring process.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category G: Technology Maturity ──────────────────────────────────────────

function detectTechnologyMaturity(_listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(_listing, 'technology_maturity');

    const modernTech = ['ci/cd', 'kubernetes', 'docker', 'terraform', 'aws', 'gcp', 'azure', 'microservices', 'typescript', 'react', 'graphql'];
    const found = modernTech.filter((kw) => text.includes(kw));

    if (found.length >= 3) {
        signals.push({
            category: 'technology_maturity',
            signalType: 'modern_stack',
            score: 15,
            severity: 'positive',
            title: 'Modern technology stack',
            explanation: `The listing references modern technologies: ${found.join(', ')}.`,
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category H: UK Local Risks ───────────────────────────────────────────────

function detectUkLocalRisks(listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(listing, 'uk_local_risks');

    // Visa sponsorship
    if (text.includes('visa sponsor') || text.includes('sponsorship available') || text.includes('tier 2')) {
        signals.push({
            category: 'uk_local_risks',
            signalType: 'visa_sponsorship',
            score: 10,
            severity: 'positive',
            title: 'Visa sponsorship indicated',
            explanation: 'The listing suggests visa sponsorship may be available.',
            trustMetadata: meta(),
        });
    }

    // IR35
    if (text.includes('ir35') || text.includes('inside ir35') || text.includes('outside ir35')) {
        const isOutside = text.includes('outside ir35');
        signals.push({
            category: 'uk_local_risks',
            signalType: 'ir35_status',
            score: isOutside ? 10 : 0,
            severity: 'neutral',
            title: `IR35 status: ${isOutside ? 'outside' : 'inside/mentioned'}`,
            explanation: `The listing references IR35 status${isOutside ? ' as outside IR35' : ''}.`,
            trustMetadata: meta(),
        });
    }

    // Security clearance
    const clearanceLevels = ['sc clearance', 'dv clearance', 'ctc', 'bpss'];
    const clearanceFound = clearanceLevels.filter((c) => text.includes(c));
    if (clearanceFound.length > 0) {
        signals.push({
            category: 'uk_local_risks',
            signalType: 'security_clearance',
            score: 0,
            severity: 'neutral',
            title: 'Security clearance required',
            explanation: `The listing requires security clearance: ${clearanceFound.join(', ').toUpperCase()}.`,
            trustMetadata: meta(),
        });
    }

    // Agency detection
    if (text.includes('on behalf of') || text.includes('our client') || text.includes('recruitment agency')) {
        signals.push({
            category: 'uk_local_risks',
            signalType: 'agency_posting',
            score: -5,
            severity: 'neutral',
            title: 'Agency posting detected',
            explanation: 'This listing appears to be posted by a recruitment agency rather than the employer directly.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Category I: Scam & Fraud ─────────────────────────────────────────────────

function detectScamFraud(listing: JobListingInput, text: string): DetectedSignal[] {
    const signals: DetectedSignal[] = [];
    const meta = () => buildMeta(listing, 'scam_fraud');

    // Upfront payment
    if (text.includes('pay upfront') || text.includes('registration fee') || text.includes('training fee') || text.includes('deposit required')) {
        signals.push({
            category: 'scam_fraud',
            signalType: 'upfront_payment',
            score: -80,
            severity: 'critical',
            title: 'Possible upfront payment request',
            explanation: 'The listing contains language suggesting a fee or payment may be required from the applicant. Legitimate employers do not charge applicants.',
            trustMetadata: meta(),
        });
    }

    // Too good to be true salary
    if (listing.salaryMax && listing.salaryMax > 200000) {
        signals.push({
            category: 'scam_fraud',
            signalType: 'salary_suspicious',
            score: -40,
            severity: 'warning',
            title: 'Unusually high salary',
            explanation: 'The advertised salary appears significantly above market norms. This may warrant additional verification.',
            trustMetadata: meta(),
        });
    }

    // Personal data overreach
    if (text.includes('bank details') || text.includes('passport number') || text.includes('national insurance number')) {
        signals.push({
            category: 'scam_fraud',
            signalType: 'data_overreach',
            score: -60,
            severity: 'critical',
            title: 'Personal data requested early',
            explanation: 'The listing requests sensitive personal information (bank details, passport, NI number) at the application stage. This is unusual for legitimate postings.',
            trustMetadata: meta(),
        });
    }

    // Vague responsibilities
    if (text.length < 200 && !listing.salaryMin) {
        signals.push({
            category: 'scam_fraud',
            signalType: 'vague_listing',
            score: -20,
            severity: 'warning',
            title: 'Limited listing detail',
            explanation: 'The listing provides minimal information about the role, responsibilities, or compensation.',
            trustMetadata: meta(),
        });
    }

    return signals;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildMeta(listing: JobListingInput, category: string): TrustMetadata {
    return buildTrustMetadata({
        sourceName: 'Signal Detector',
        sourceUrl: listing.sourceUrl ?? null,
        sourceType: 'job_listing',
        observedAt: new Date(),
        confidence: 0.7,
        explanationType: 'heuristic',
        riskLanguage: true,
        userVisibleReason: `Detected from job listing analysis (${category})`,
    });
}
