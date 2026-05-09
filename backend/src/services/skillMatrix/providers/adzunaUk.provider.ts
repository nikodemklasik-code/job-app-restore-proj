/**
 * Adzuna UK Provider
 *
 * Integrates with the Adzuna UK API to fetch job listings.
 * Implements rate limiting, exponential backoff, salary normalization,
 * and category-to-taxonomy mapping.
 */

import type { IngestedJob } from '../jobIngestion.service.js';

// ── Configuration ────────────────────────────────────────────────────────────

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search';
const DEFAULT_RESULTS_PER_PAGE = 50;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

interface AdzunaConfig {
    appId: string;
    appKey: string;
    resultsPerPage?: number;
}

// ── Adzuna API Response Types ────────────────────────────────────────────────

interface AdzunaResult {
    id: string;
    title: string;
    description: string;
    salary_min?: number;
    salary_max?: number;
    location: {
        display_name: string;
        area?: string[];
    };
    company: {
        display_name: string;
    };
    category: {
        label: string;
        tag: string;
    };
    contract_type?: string;
    contract_time?: string;
    redirect_url: string;
    created: string;
}

interface AdzunaResponse {
    results: AdzunaResult[];
    count: number;
    mean: number;
}

// ── Category Mapping ─────────────────────────────────────────────────────────

/**
 * Map Adzuna category tags to internal skill taxonomy categories.
 */
const CATEGORY_TO_SKILLS: Record<string, string[]> = {
    'it-jobs': ['typescript', 'javascript', 'python', 'react', 'node.js', 'aws', 'docker'],
    'engineering-jobs': ['engineering', 'cad', 'project management', 'agile'],
    'accounting-finance-jobs': ['excel', 'financial analysis', 'accounting', 'sql'],
    'healthcare-nursing-jobs': ['patient care', 'clinical', 'nhs'],
    'teaching-jobs': ['teaching', 'curriculum', 'education'],
    'sales-jobs': ['sales', 'crm', 'negotiation', 'b2b'],
    'marketing-jobs': ['marketing', 'seo', 'analytics', 'content strategy'],
    'hr-jobs': ['recruitment', 'hr', 'people management'],
    'legal-jobs': ['legal', 'compliance', 'contract law'],
    'creative-design-jobs': ['design', 'figma', 'adobe', 'ux'],
};

/**
 * Extract likely required skills from an Adzuna category.
 */
export function mapCategoryToSkills(categoryTag: string): string[] {
    return CATEGORY_TO_SKILLS[categoryTag] ?? [];
}

// ── Salary Normalization ─────────────────────────────────────────────────────

/**
 * Normalize salary to annual GBP.
 * Adzuna UK typically provides annual figures, but some may be daily/hourly.
 */
export function normalizeSalaryToAnnualGBP(
    salaryMin: number | undefined,
    salaryMax: number | undefined,
    contractTime?: string,
): { min: number | null; max: number | null } {
    if (!salaryMin && !salaryMax) return { min: null, max: null };

    let min = salaryMin ?? null;
    let max = salaryMax ?? null;

    // Heuristic: if salary < 500, likely daily rate → multiply by 220 working days
    if (min && min < 500) {
        min = min * 220;
        max = max ? max * 220 : null;
    }
    // If salary < 100, likely hourly → multiply by 1760 (220 days × 8 hours)
    else if (min && min < 100) {
        min = min * 1760;
        max = max ? max * 1760 : null;
    }

    // Part-time adjustment
    if (contractTime === 'part_time') {
        // Adzuna may already pro-rate; leave as-is but flag
    }

    return {
        min: min ? Math.round(min) : null,
        max: max ? Math.round(max) : null,
    };
}

// ── API Client ───────────────────────────────────────────────────────────────

/**
 * Fetch jobs from Adzuna UK API with rate limiting and exponential backoff.
 */
export async function fetchAdzunaJobs(
    config: AdzunaConfig,
    params: {
        what?: string;
        where?: string;
        category?: string;
        page?: number;
        maxDaysOld?: number;
    } = {},
): Promise<IngestedJob[]> {
    const resultsPerPage = config.resultsPerPage ?? DEFAULT_RESULTS_PER_PAGE;
    const page = params.page ?? 1;

    const queryParams = new URLSearchParams({
        app_id: config.appId,
        app_key: config.appKey,
        results_per_page: String(resultsPerPage),
        content_type: 'application/json',
    });

    if (params.what) queryParams.set('what', params.what);
    if (params.where) queryParams.set('where', params.where);
    if (params.category) queryParams.set('category', params.category);
    if (params.maxDaysOld) queryParams.set('max_days_old', String(params.maxDaysOld));

    const url = `${ADZUNA_BASE_URL}/${page}?${queryParams.toString()}`;

    const response = await fetchWithBackoff(url);
    const data: AdzunaResponse = await response.json();

    return data.results.map((result) => mapAdzunaResult(result));
}

/**
 * Map an Adzuna API result to our internal IngestedJob format.
 */
function mapAdzunaResult(result: AdzunaResult): IngestedJob {
    const salary = normalizeSalaryToAnnualGBP(
        result.salary_min,
        result.salary_max,
        result.contract_time,
    );

    return {
        id: `adzuna_${result.id}`,
        title: result.title,
        description: result.description,
        salaryMin: salary.min,
        salaryMax: salary.max,
        location: result.location?.display_name ?? null,
        company: result.company?.display_name ?? '',
        category: result.category?.tag ?? null,
        contractType: result.contract_type ?? result.contract_time ?? null,
        sourceUrl: result.redirect_url,
        source: 'adzuna_uk',
        createdDate: new Date(result.created),
    };
}

/**
 * Fetch with exponential backoff on failure.
 */
async function fetchWithBackoff(url: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url);

            if (response.status === 429) {
                // Rate limited — wait and retry
                const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                await sleep(backoff);
                continue;
            }

            if (!response.ok) {
                throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
            }

            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            await sleep(backoff);
        }
    }

    throw lastError ?? new Error('Adzuna API request failed after retries');
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Scheduled Ingestion ──────────────────────────────────────────────────────

/**
 * Run a full ingestion cycle from Adzuna UK.
 * Default schedule: every 6 hours.
 */
export async function runAdzunaIngestionCycle(
    config: AdzunaConfig,
    searchCriteria: {
        what?: string;
        where?: string;
        categories?: string[];
        maxDaysOld?: number;
    } = {},
): Promise<{ totalFetched: number; pages: number }> {
    const categories = searchCriteria.categories ?? ['it-jobs'];
    let totalFetched = 0;
    let pages = 0;

    for (const category of categories) {
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 5) {
            // Cap at 5 pages per category per cycle
            try {
                const jobs = await fetchAdzunaJobs(config, {
                    what: searchCriteria.what,
                    where: searchCriteria.where ?? 'UK',
                    category,
                    page,
                    maxDaysOld: searchCriteria.maxDaysOld ?? 7,
                });

                totalFetched += jobs.length;
                pages++;

                // If fewer results than expected, no more pages
                hasMore = jobs.length >= (config.resultsPerPage ?? DEFAULT_RESULTS_PER_PAGE);
                page++;

                // Rate limit: wait 500ms between pages
                await sleep(500);
            } catch (error) {
                console.error(`[AdzunaUK] Error fetching page ${page} for ${category}:`, error);
                hasMore = false;
            }
        }
    }

    return { totalFetched, pages };
}
