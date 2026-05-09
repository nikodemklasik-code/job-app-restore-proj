/**
 * AI-Powered Employer Deep-Dive Summary (Paid Feature)
 *
 * Synthesizes all employer signals into a readable narrative.
 * Uses signal language — never "AI verified", always "Based on available signals".
 */

import { buildTrustMetadata } from '../skillMatrix/trustMetadata.js';
import type { EmployerSignalRecord, SignalCategory, TrustMetadata } from '../skillMatrix/types.js';

export interface EmployerDeepDiveInput {
    employerName: string;
    signals: EmployerSignalRecord[];
    sourceCount: number;
    trustScore: number;
    riskScore: number;
}

export interface EmployerDeepDiveResult {
    narrative: string;
    keyStrengths: string[];
    notableRisks: string[];
    dataGaps: string[];
    overallAssessment: string;
    confidenceStatement: string;
    trustMetadata: TrustMetadata;
}

const CATEGORY_LABELS: Record<SignalCategory, string> = {
    identity_credibility: 'Identity & Credibility',
    offer_transparency: 'Offer Transparency',
    compensation_benefits: 'Compensation & Benefits',
    business_stability: 'Business Stability',
    culture_management: 'Culture & Management',
    recruitment_process: 'Recruitment Process',
    technology_maturity: 'Technology Maturity',
    uk_local_risks: 'UK-Specific Factors',
    scam_fraud: 'Safety Signals',
};

const ALL_CATEGORIES: SignalCategory[] = [
    'identity_credibility', 'offer_transparency', 'compensation_benefits',
    'business_stability', 'culture_management', 'recruitment_process',
    'technology_maturity', 'uk_local_risks', 'scam_fraud',
];

/**
 * Generate employer deep-dive narrative summary.
 */
export function generateEmployerDeepDive(input: EmployerDeepDiveInput): EmployerDeepDiveResult {
    const { employerName, signals, sourceCount, trustScore, riskScore } = input;

    // Group signals by category
    const byCategory = new Map<SignalCategory, EmployerSignalRecord[]>();
    for (const signal of signals) {
        const cat = signal.category;
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(signal);
    }

    // Identify strengths (top 3 positive signals)
    const positiveSignals = signals.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    const keyStrengths = positiveSignals.slice(0, 3).map((s) => s.title);

    // Identify risks (top 3 negative signals)
    const negativeSignals = signals.filter((s) => s.score < 0).sort((a, b) => a.score - b.score);
    const notableRisks = negativeSignals.slice(0, 3).map((s) => s.title);

    // Identify data gaps (categories with no signals)
    const dataGaps = ALL_CATEGORIES
        .filter((cat) => !byCategory.has(cat) || byCategory.get(cat)!.length === 0)
        .map((cat) => `Insufficient data for ${CATEGORY_LABELS[cat]} assessment`);

    // Coverage percentage
    const coveredCategories = ALL_CATEGORIES.filter((cat) => byCategory.has(cat) && byCategory.get(cat)!.length > 0);
    const coveragePercent = Math.round((coveredCategories.length / ALL_CATEGORIES.length) * 100);

    // Generate narrative
    const narrative = buildNarrative(employerName, trustScore, riskScore, keyStrengths, notableRisks, dataGaps, sourceCount);

    // Overall assessment using signal language
    let overallAssessment: string;
    if (trustScore >= 70 && riskScore < 30) {
        overallAssessment = `Based on available public and listing signals, ${employerName} shows predominantly positive indicators across verified categories.`;
    } else if (riskScore >= 50) {
        overallAssessment = `Available signals for ${employerName} include elevated risk indicators. Additional verification is recommended before investing significant time.`;
    } else {
        overallAssessment = `Signals for ${employerName} are mixed or limited. The available data does not strongly indicate either high trust or high risk.`;
    }

    const confidenceStatement = `Data coverage: ${coveragePercent}% of verification categories have signals (${coveredCategories.length}/${ALL_CATEGORIES.length}). Based on ${sourceCount} data source${sourceCount !== 1 ? 's' : ''}.`;

    return {
        narrative,
        keyStrengths,
        notableRisks,
        dataGaps,
        overallAssessment,
        confidenceStatement,
        trustMetadata: buildTrustMetadata({
            sourceName: 'Employer Deep-Dive Engine',
            sourceType: 'scoring_engine',
            observedAt: new Date(),
            confidence: Math.min(0.9, 0.4 + coveragePercent / 200),
            explanationType: 'deterministic',
            riskLanguage: true,
            userVisibleReason: `Synthesized from ${signals.length} signals across ${coveredCategories.length} verification categories`,
        }),
    };
}

function buildNarrative(
    name: string,
    trust: number,
    risk: number,
    strengths: string[],
    risks: string[],
    gaps: string[],
    sources: number,
): string {
    const parts: string[] = [];

    parts.push(`Based on available public and listing signals, here is a summary for ${name}.`);

    if (strengths.length > 0) {
        parts.push(`\nKey positive indicators: ${strengths.join('; ')}.`);
    }

    if (risks.length > 0) {
        parts.push(`\nNotable risk signals: ${risks.join('; ')}.`);
    }

    if (gaps.length > 0) {
        parts.push(`\nData limitations: ${gaps.slice(0, 3).join('; ')}.`);
    }

    parts.push(`\nThis assessment is based on ${sources} verified source${sources !== 1 ? 's' : ''}. Trust score: ${trust}/100, Risk score: ${risk}/100.`);

    return parts.join('');
}
