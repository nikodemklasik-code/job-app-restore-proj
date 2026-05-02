/**
 * Job Radar Engine - Deep employer & job post analysis
 * Orchestrates multi-source scanning, scoring, and report generation
 */

import { randomUUID } from 'crypto';
import type {
    JobRadarSource,
    JobRadarSignal,
    JobRadarScore,
    JobRadarFinding,
    JobRadarBenchmark,
} from '../../db/schemas/job-radar.js';

export interface JobRadarScanInput {
    userId: string;
    jobId?: string;
    jobTitle: string;
    company: string;
    location?: string;
    description?: string;
    salaryMin?: number;
    salaryMax?: number;
    applyUrl?: string;
    scanTrigger: 'saved_job' | 'manual_search' | 'url_input';
}

export interface JobRadarScanProgress {
    stage: 'init' | 'sources' | 'parsing' | 'scoring' | 'report' | 'done';
    stageState: 'pending' | 'processing' | 'done' | 'partial' | 'failed';
    message: string;
    completedSteps: number;
    totalSteps: number;
    sourcesCollected: number;
    signalsExtracted: number;
}

export interface JobRadarReportSummary {
    scanId: string;
    status: 'processing' | 'partial_report' | 'ready' | 'sources_blocked' | 'scan_failed';

    // Scores (0-100)
    employerScore: number;
    offerScore: number;
    marketPayScore: number;
    benefitsScore: number;
    cultureFitScore: number;
    riskScore: number;

    // Overall recommendation
    recommendation: 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk';
    confidenceOverall: 'low' | 'medium' | 'high';

    // Key insights
    keyFindings: string[];
    redFlags: string[];
    positiveSignals: string[];

    // Benchmarks
    salaryBenchmark?: {
        p25: number;
        median: number;
        p75: number;
        currency: string;
        yourPosition: 'below' | 'at' | 'above';
    };

    // Freshness
    freshnessStatus: 'fresh' | 'acceptable' | 'stale';
    freshnessHours: number;

    // Sources
    sourcesCount: number;
    sourcesQuality: 'low' | 'medium' | 'high';
}

/**
 * Generate entity fingerprint for deduplication
 */
export function generateEntityFingerprint(input: JobRadarScanInput): string {
    const normalized = [
        input.company.toLowerCase().trim().replace(/\s+/g, '-'),
        input.jobTitle.toLowerCase().trim().replace(/\s+/g, '-'),
        input.location?.toLowerCase().trim().replace(/\s+/g, '-') ?? 'remote',
    ].join('::');
    return normalized;
}

/**
 * Generate source fingerprint for caching
 */
export function generateSourceFingerprint(sources: string[]): string {
    return sources.sort().join('|');
}

/**
 * Initialize a new Job Radar scan
 */
export async function initializeJobRadarScan(
    input: JobRadarScanInput,
): Promise<{ scanId: string; idempotencyKey: string }> {
    const scanId = randomUUID();
    const idempotencyKey = randomUUID();
    const entityFingerprint = generateEntityFingerprint(input);

    const progress: JobRadarScanProgress = {
        stage: 'init',
        stageState: 'processing',
        message: 'Initializing deep scan...',
        completedSteps: 0,
        totalSteps: 5,
        sourcesCollected: 0,
        signalsExtracted: 0,
    };

    // Note: Actual DB insert happens in the router
    return { scanId, idempotencyKey };
}

/**
 * Collect sources for employer & job post
 */
export async function collectJobRadarSources(
    scanId: string,
    input: JobRadarScanInput,
): Promise<JobRadarSource[]> {
    const sources: Partial<JobRadarSource>[] = [];

    // 1. Official website (if we can derive from company name)
    const websiteUrl = await deriveCompanyWebsite(input.company);
    if (websiteUrl) {
        sources.push({
            id: randomUUID(),
            scanId,
            sourceType: 'official_website',
            sourceQualityTier: 5,
            sourceUrl: websiteUrl,
            normalizedUrl: normalizeUrl(websiteUrl),
            title: `${input.company} - Official Website`,
            collectedAt: new Date(),
            parseStatus: 'pending',
            metadata: { company: input.company },
        });
    }

    // 2. LinkedIn company page
    const linkedinUrl = `https://www.linkedin.com/company/${slugify(input.company)}`;
    sources.push({
        id: randomUUID(),
        scanId,
        sourceType: 'linkedin',
        sourceQualityTier: 4,
        sourceUrl: linkedinUrl,
        normalizedUrl: normalizeUrl(linkedinUrl),
        title: `${input.company} - LinkedIn`,
        collectedAt: new Date(),
        parseStatus: 'pending',
        metadata: { company: input.company },
    });

    // 3. Glassdoor (if available)
    const glassdoorUrl = `https://www.glassdoor.co.uk/Overview/Working-at-${slugify(input.company)}.htm`;
    sources.push({
        id: randomUUID(),
        scanId,
        sourceType: 'review_site',
        sourceQualityTier: 4,
        sourceUrl: glassdoorUrl,
        normalizedUrl: normalizeUrl(glassdoorUrl),
        title: `${input.company} - Glassdoor`,
        collectedAt: new Date(),
        parseStatus: 'pending',
        metadata: { company: input.company, platform: 'glassdoor' },
    });

    // 4. Companies House (UK registry)
    if (input.location?.toLowerCase().includes('uk') || input.location?.toLowerCase().includes('united kingdom')) {
        sources.push({
            id: randomUUID(),
            scanId,
            sourceType: 'registry',
            sourceQualityTier: 5,
            sourceUrl: `https://find-and-update.company-information.service.gov.uk/search?q=${encodeURIComponent(input.company)}`,
            normalizedUrl: 'companies-house-uk',
            title: `${input.company} - Companies House`,
            collectedAt: new Date(),
            parseStatus: 'pending',
            metadata: { company: input.company, registry: 'companies_house_uk' },
        });
    }

    // 5. Job board (original posting)
    if (input.applyUrl) {
        sources.push({
            id: randomUUID(),
            scanId,
            sourceType: 'job_board',
            sourceQualityTier: 3,
            sourceUrl: input.applyUrl,
            normalizedUrl: normalizeUrl(input.applyUrl),
            title: `${input.jobTitle} at ${input.company}`,
            collectedAt: new Date(),
            parseStatus: 'pending',
            metadata: { jobTitle: input.jobTitle, company: input.company },
        });
    }

    return sources as JobRadarSource[];
}

/**
 * Extract signals from collected sources
 */
export async function extractJobRadarSignals(
    scanId: string,
    sources: JobRadarSource[],
    input: JobRadarScanInput,
): Promise<JobRadarSignal[]> {
    const signals: Partial<JobRadarSignal>[] = [];

    // Mock signals for MVP - in production, parse actual source content

    // Employer signals
    signals.push({
        id: randomUUID(),
        scanId,
        signalScope: 'employer',
        category: 'company_size',
        signalKey: 'employee_count',
        signalValueNumber: '250',
        confidence: 'medium',
        sourceQualityTier: 4,
        isMissingData: false,
        isConflicted: false,
    });

    signals.push({
        id: randomUUID(),
        scanId,
        signalScope: 'employer',
        category: 'company_age',
        signalKey: 'founded_year',
        signalValueText: '2015',
        confidence: 'high',
        sourceQualityTier: 5,
        isMissingData: false,
        isConflicted: false,
    });

    signals.push({
        id: randomUUID(),
        scanId,
        signalScope: 'employer',
        category: 'reputation',
        signalKey: 'glassdoor_rating',
        signalValueNumber: '3.8',
        confidence: 'medium',
        sourceQualityTier: 4,
        isMissingData: false,
        isConflicted: false,
    });

    // Job offer signals
    if (input.salaryMin && input.salaryMax) {
        signals.push({
            id: randomUUID(),
            scanId,
            signalScope: 'offer',
            category: 'compensation',
            signalKey: 'salary_range',
            signalValueJson: { min: input.salaryMin, max: input.salaryMax, currency: 'GBP' },
            confidence: 'high',
            sourceQualityTier: 5,
            isMissingData: false,
            isConflicted: false,
        });
    }

    signals.push({
        id: randomUUID(),
        scanId,
        signalScope: 'offer',
        category: 'benefits',
        signalKey: 'remote_work',
        signalValueText: input.location?.toLowerCase().includes('remote') ? 'yes' : 'hybrid',
        confidence: 'high',
        sourceQualityTier: 5,
        isMissingData: false,
        isConflicted: false,
    });

    // Risk signals
    const descLower = (input.description ?? '').toLowerCase();
    if (descLower.includes('commission') && descLower.includes('unlimited')) {
        signals.push({
            id: randomUUID(),
            scanId,
            signalScope: 'risk',
            category: 'red_flag',
            signalKey: 'commission_based',
            signalValueText: 'Unlimited commission mentioned',
            confidence: 'high',
            sourceQualityTier: 5,
            isMissingData: false,
            isConflicted: false,
        });
    }

    return signals as JobRadarSignal[];
}

/**
 * Calculate Job Radar scores
 */
export async function calculateJobRadarScores(
    scanId: string,
    signals: JobRadarSignal[],
    input: JobRadarScanInput,
): Promise<JobRadarScore> {
    // Extract signal values
    const employeeCount = signals.find(s => s.signalKey === 'employee_count')?.signalValueNumber ?? 0;
    const glassdoorRating = signals.find(s => s.signalKey === 'glassdoor_rating')?.signalValueNumber ?? 0;
    const hasRedFlags = signals.some(s => s.category === 'red_flag');

    // Score calculations (0-100)
    const employerScore = Math.min(100, Math.max(0,
        (Number(employeeCount) > 50 ? 70 : 50) +
        (Number(glassdoorRating) * 10)
    ));

    const offerScore = input.salaryMin && input.salaryMax
        ? Math.min(100, ((input.salaryMin + input.salaryMax) / 2) / 500) // Normalize to 0-100
        : 60;

    const marketPayScore = input.salaryMin && input.salaryMax
        ? Math.min(100, Math.max(0, 70 + (input.salaryMin > 30000 ? 20 : -10)))
        : 50;

    const benefitsScore = signals.filter(s => s.category === 'benefits').length * 20;

    const cultureFitScore = Number(glassdoorRating) * 20;

    const riskScore = hasRedFlags ? 75 : 20;

    // Overall recommendation
    const avgScore = (employerScore + offerScore + marketPayScore + benefitsScore + cultureFitScore) / 5;
    let recommendation: 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk';

    if (riskScore > 60) {
        recommendation = 'High Risk';
    } else if (avgScore >= 80) {
        recommendation = 'Strong Match';
    } else if (avgScore >= 60) {
        recommendation = 'Good Option';
    } else {
        recommendation = 'Mixed Signals';
    }

    const confidenceOverall: 'low' | 'medium' | 'high' =
        signals.length > 10 ? 'high' : signals.length > 5 ? 'medium' : 'low';

    return {
        id: randomUUID(),
        scanId,
        employerScore: Math.round(employerScore),
        offerScore: Math.round(offerScore),
        marketPayScore: Math.round(marketPayScore),
        benefitsScore: Math.round(benefitsScore),
        cultureFitScore: Math.round(cultureFitScore),
        riskScore: Math.round(riskScore),
        recommendation,
        confidenceOverall,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Generate findings (red flags, warnings, positive signals)
 */
export async function generateJobRadarFindings(
    scanId: string,
    signals: JobRadarSignal[],
    scores: JobRadarScore,
): Promise<JobRadarFinding[]> {
    const findings: Partial<JobRadarFinding>[] = [];

    // Red flags
    const redFlagSignals = signals.filter(s => s.category === 'red_flag');
    for (const signal of redFlagSignals) {
        findings.push({
            id: randomUUID(),
            scanId,
            findingType: 'red_flag',
            code: 'RED_FLAG_COMMISSION',
            title: 'Commission-Based Compensation',
            summary: signal.signalValueText ?? 'Job mentions unlimited commission or MLM-style compensation',
            severity: 'high',
            confidence: signal.confidence,
            sourceId: signal.sourceId,
            visibility: 'visible',
            createdAt: new Date(),
        });
    }

    // Positive signals
    if (scores.employerScore >= 70) {
        findings.push({
            id: randomUUID(),
            scanId,
            findingType: 'positive',
            code: 'STRONG_EMPLOYER',
            title: 'Established Employer',
            summary: 'Company has strong reputation and positive employee reviews',
            severity: 'info',
            confidence: 'medium',
            visibility: 'visible',
            createdAt: new Date(),
        });
    }

    // Warnings
    if (scores.marketPayScore < 50) {
        findings.push({
            id: randomUUID(),
            scanId,
            findingType: 'warning',
            code: 'BELOW_MARKET_PAY',
            title: 'Below Market Rate',
            summary: 'Salary appears to be below market average for this role and location',
            severity: 'medium',
            confidence: 'medium',
            visibility: 'visible',
            createdAt: new Date(),
        });
    }

    return findings as JobRadarFinding[];
}

/**
 * Generate salary benchmark
 */
export async function generateSalaryBenchmark(
    scanId: string,
    input: JobRadarScanInput,
): Promise<JobRadarBenchmark | null> {
    if (!input.salaryMin || !input.salaryMax) return null;

    // Mock benchmark data - in production, fetch from real market data
    const roleFamily = extractRoleFamily(input.jobTitle);
    const seniority = extractSeniority(input.jobTitle);

    const medianSalary = 45000;
    const p25 = medianSalary * 0.8;
    const p75 = medianSalary * 1.2;

    return {
        id: randomUUID(),
        scanId,
        roleFamily,
        seniority,
        location: input.location ?? 'United Kingdom',
        country: 'GB',
        currency: 'GBP',
        benchmarkRegion: 'UK',
        benchmarkPeriod: '2026-Q2',
        sampleSize: 150,
        sourceMix: { reed: 50, adzuna: 40, linkedin: 30, glassdoor: 30 },
        normalizationVersion: '1.0',
        salaryP25: String(p25),
        salaryMedian: String(medianSalary),
        salaryP75: String(p75),
        confidence: 'medium',
        createdAt: new Date(),
    };
}

// Helper functions

function deriveCompanyWebsite(company: string): Promise<string | null> {
    // Mock - in production, use search API or database
    const slug = slugify(company);
    return Promise.resolve(`https://www.${slug}.com`);
}

function normalizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    } catch {
        return url;
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function extractRoleFamily(jobTitle: string): string {
    const lower = jobTitle.toLowerCase();
    if (lower.includes('engineer') || lower.includes('developer')) return 'Software Engineering';
    if (lower.includes('designer')) return 'Design';
    if (lower.includes('manager')) return 'Management';
    if (lower.includes('analyst')) return 'Data & Analytics';
    if (lower.includes('sales')) return 'Sales';
    if (lower.includes('marketing')) return 'Marketing';
    return 'General';
}

function extractSeniority(jobTitle: string): string {
    const lower = jobTitle.toLowerCase();
    if (lower.includes('senior') || lower.includes('lead')) return 'Senior';
    if (lower.includes('junior') || lower.includes('graduate')) return 'Junior';
    if (lower.includes('principal') || lower.includes('staff')) return 'Principal';
    return 'Mid';
}
