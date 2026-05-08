/**
 * Shared parser for extracting structured data from job descriptions.
 * Handles salary (with hourly/daily/weekly/monthly rates), benefits,
 * requirements, qualifications, responsibilities, contract type, etc.
 */

export interface ParsedJobData {
    salaryMin: number | null;
    salaryMax: number | null;
    salaryPeriod: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
    salaryOriginalMin: number | null;
    salaryOriginalMax: number | null;
    salaryCurrency: string | null;
    salaryText: string | null;
    workMode: string | null;
    contractType: string | null;
    workingHours: string | null;
    experienceLevel: string | null;
    benefits: string[];
    requirements: string[];
    qualifications: string[];
    responsibilities: string[];
    employerEmail: string | null;
    startDate: string | null;
}

/** Convert any period salary to annual equivalent. */
function toAnnual(amount: number, period: 'hour' | 'day' | 'week' | 'month' | 'year'): number {
    switch (period) {
        case 'hour':
            return Math.round(amount * 40 * 52); // 40h/week × 52 weeks
        case 'day':
            return Math.round(amount * 5 * 52); // 5 days/week × 52 weeks
        case 'week':
            return Math.round(amount * 52);
        case 'month':
            return Math.round(amount * 12);
        case 'year':
        default:
            return Math.round(amount);
    }
}

/** Parse a numeric value with k/K suffix (e.g. "45k" -> 45000). */
function parseAmount(raw: string): number | null {
    const cleaned = raw.replace(/,/g, '').trim();
    const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([kK])?$/);
    if (!match) return null;
    const n = parseFloat(match[1]);
    if (isNaN(n)) return null;
    return match[2] ? Math.round(n * 1000) : Math.round(n);
}

/** Extract salary with period (hourly, daily, weekly, monthly, yearly). */
export function parseSalary(text: string): {
    min: number | null;
    max: number | null;
    period: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
    originalMin: number | null;
    originalMax: number | null;
    currency: string | null;
    rawText: string | null;
} {
    if (!text) return { min: null, max: null, period: null, originalMin: null, originalMax: null, currency: null, rawText: null };

    // Detect currency
    let currency: string | null = null;
    if (/£|GBP/i.test(text)) currency = 'GBP';
    else if (/\$|USD/i.test(text)) currency = 'USD';
    else if (/€|EUR/i.test(text)) currency = 'EUR';
    else if (/PLN|zł/i.test(text)) currency = 'PLN';

    // Salary patterns (range or single value) with period
    // Pattern: £12.50 - £15.00 per hour | £30,000 - £40,000 per annum | £15/hour
    const rangePatterns: Array<{ regex: RegExp; period: 'hour' | 'day' | 'week' | 'month' | 'year' }> = [
        // Range: £X - £Y per hour/hr/hourly
        { regex: /[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:hour|hr|hourly|\/h(?:our)?)/i, period: 'hour' },
        // Single: £X per hour or £X/hour
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:hour|hr|hourly|\/h(?:our)?)/i, period: 'hour' },
        // Range: £X - £Y per day
        { regex: /[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:day|daily|\/day)/i, period: 'day' },
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:day|daily|\/day)/i, period: 'day' },
        // Range per week
        { regex: /[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:week|weekly|\/week|pw)/i, period: 'week' },
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?)\s*(?:per\s+)?(?:week|weekly|\/week|pw)/i, period: 'week' },
        // Range per month
        { regex: /[£$€]?\s*(\d+(?:[,.]?\d+)?k?)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?k?)\s*(?:per\s+)?(?:month|monthly|\/month|pcm)/i, period: 'month' },
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?k?)\s*(?:per\s+)?(?:month|monthly|\/month|pcm)/i, period: 'month' },
        // Range per year/annum
        { regex: /[£$€]?\s*(\d+(?:[,.]?\d+)?k?)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?k?)\s*(?:per\s+)?(?:year|annum|yearly|annual|p\.?a\.?|pa)/i, period: 'year' },
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?k?)\s*(?:per\s+)?(?:year|annum|yearly|annual|p\.?a\.?|pa)/i, period: 'year' },
        // Plain range with k suffix (assume annual)
        { regex: /[£$€]\s*(\d+(?:[,.]?\d+)?k)\s*(?:-|–|to)\s*[£$€]?\s*(\d+(?:[,.]?\d+)?k)/i, period: 'year' },
        // Plain range £X - £Y with thousands (assume annual if large)
        { regex: /[£$€]\s*(\d{2,3}(?:,\d{3})+)\s*(?:-|–|to)\s*[£$€]?\s*(\d{2,3}(?:,\d{3})+)/, period: 'year' },
    ];

    for (const { regex, period } of rangePatterns) {
        const match = text.match(regex);
        if (!match) continue;

        const rawText = match[0].trim();
        const originalMin = parseAmount(match[1]);
        const originalMax = match[2] ? parseAmount(match[2]) : originalMin;

        if (originalMin == null) continue;

        return {
            min: toAnnual(originalMin, period),
            max: originalMax != null ? toAnnual(originalMax, period) : toAnnual(originalMin, period),
            period,
            originalMin,
            originalMax,
            currency,
            rawText,
        };
    }

    return { min: null, max: null, period: null, originalMin: null, originalMax: null, currency, rawText: null };
}

/** Detect contract type. */
export function parseContractType(text: string): string | null {
    const t = text.toLowerCase();
    if (/\bapprentice(ship)?\b/i.test(t)) return 'apprenticeship';
    if (/\binternship|\bintern\b/i.test(t)) return 'internship';
    if (/\b(fixed[-\s]?term|temp(orary)?|contract)\b/i.test(t)) return 'contract';
    if (/\bpart[-\s]?time\b/i.test(t)) return 'part-time';
    if (/\bfull[-\s]?time\b/i.test(t)) return 'full-time';
    if (/\bpermanent\b/i.test(t)) return 'permanent';
    return null;
}

/** Detect work mode. */
export function parseWorkMode(text: string): string | null {
    const t = text.toLowerCase();
    if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(t)) return 'remote';
    if (/\bhybrid\b/.test(t)) return 'hybrid';
    if (/on[-\s]?site|in[-\s]?office|on[-\s]?premises/.test(t)) return 'on-site';
    return null;
}

/** Detect experience level. */
export function parseExperienceLevel(text: string): string | null {
    const t = text.toLowerCase();
    if (/\b(director|head of|vp|vice president|chief|cxo|ceo|cto|cfo)\b/i.test(t)) return 'executive';
    if (/\b(principal|staff|lead)\b/i.test(t)) return 'lead';
    if (/\bsenior\b/i.test(t)) return 'senior';
    if (/\b(junior|graduate|entry[-\s]?level|trainee|apprentice)\b/i.test(t)) return 'entry';
    if (/\bmid[-\s]?level|\bintermediate\b/i.test(t)) return 'mid';
    return null;
}

/** Extract working hours (e.g. "37.5 hours per week", "Mon-Fri 9-5"). */
export function parseWorkingHours(text: string): string | null {
    const patterns = [
        /\b(\d+(?:\.\d+)?\s*hours?\s+per\s+week)/i,
        /\b(\d+\s*hrs?\/week)/i,
        /\b(Mon(?:day)?\s*[-–to]+\s*(?:Fri|Sun)(?:day)?\s*[,\s]*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
        /\b(shift\s+work|rotating\s+shifts?|night\s+shifts?)\b/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[1].trim();
    }
    return null;
}

/** Extract benefits section. */
export function parseBenefits(text: string): string[] {
    if (!text) return [];

    const benefits = new Set<string>();
    const patterns = [
        /\b(pension|401k|retirement plan)\b/gi,
        /\b(private\s+healthcare|private\s+medical|health\s+insurance)\b/gi,
        /\b(dental|vision)\s+(?:plan|insurance|cover)/gi,
        /\b(\d+\s+days?\s+(?:holiday|annual\s+leave|vacation|pto))\b/gi,
        /\b(bonus\s+scheme|annual\s+bonus|performance\s+bonus|sign[-\s]?on\s+bonus)\b/gi,
        /\b(life\s+insurance|critical\s+illness)\b/gi,
        /\b(gym\s+membership|wellbeing|mental\s+health\s+support)\b/gi,
        /\b(cycle[-\s]?to[-\s]?work|childcare\s+vouchers|season\s+ticket\s+loan)\b/gi,
        /\b(flexible\s+(?:working|hours)|flexi[-\s]?time)\b/gi,
        /\b(training\s+(?:budget|allowance)|learning\s+and\s+development|cpd)\b/gi,
        /\b(share\s+options|equity|stock\s+options|rsu)\b/gi,
        /\b(company\s+car|car\s+allowance|travel\s+expenses)\b/gi,
        /\b(free\s+parking|onsite\s+parking)\b/gi,
        /\b(meals?\s+(?:provided|included)|free\s+lunch|breakfast)\b/gi,
    ];

    for (const p of patterns) {
        const matches = text.match(p);
        if (matches) matches.forEach((m) => benefits.add(m.trim().toLowerCase()));
    }

    // Dedicated "Benefits" section
    const section = text.match(/\b(?:benefits?|what\s+we\s+offer|perks?)\s*[:：]([\s\S]{20,500}?)(?=\n\n|\n[A-Z][a-z]+\s*:|$)/i);
    if (section) {
        const items = section[1]
            .split(/[\n•·\-\*]|\d+\.\s/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 5 && s.length <= 120);
        items.forEach((i) => benefits.add(i.toLowerCase()));
    }

    return Array.from(benefits).slice(0, 12);
}

/** Extract requirements - bullet points, labelled sections, and keyword-containing sentences. */
export function parseRequirements(description: string): string[] {
    if (!description) return [];

    const results = new Set<string>();

    // Bullet points with keywords
    const bullets = description
        .split(/[\n•·\-\*]|\d+\.\s/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 15 && line.length <= 200)
        .filter((line) =>
            /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding|degree|qualification|required|must have|essential|desirable|competent|demonstrated)/i.test(line),
        );
    bullets.forEach((b) => results.add(b));

    // "Requirements" / "What you'll need" / "Qualifications" sections
    const sectionRegex = /(?:requirements?|qualifications?|what\s+(?:you'll\s+need|we(?:'re)?\s+looking\s+for)|skills?\s+(?:needed|required)|essential|you\s+(?:must|should)\s+have)\s*[:：]?\s*([\s\S]{50,800}?)(?=\n\n|\n[A-Z][a-z]+\s*:|$)/gi;
    let match;
    while ((match = sectionRegex.exec(description)) !== null) {
        const section = match[1];
        const items = section
            .split(/[\n•·\-\*]|\d+\.\s/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 20 && s.length <= 200);
        items.forEach((i) => results.add(i));
    }

    return Array.from(results).slice(0, 12);
}

/** Extract qualifications (education requirements). */
export function parseQualifications(text: string): string[] {
    if (!text) return [];

    const results = new Set<string>();
    const patterns = [
        /\b(bachelor'?s?|ba|bsc|beng)\s+(?:degree\s+)?(?:in\s+)?[\w\s]{2,40}/gi,
        /\b(master'?s?|ma|msc|meng|mba)\s+(?:degree\s+)?(?:in\s+)?[\w\s]{2,40}/gi,
        /\b(phd|doctorate|doctoral)\s+(?:in\s+)?[\w\s]{2,40}/gi,
        /\b(a[-\s]?levels?|gcse|ncea|hnd|hnc|btec|nvq\s+\d+)\b[\s\w]{0,30}/gi,
        /\b(certified\s+[\w\s]{2,40}|certification\s+in\s+[\w\s]{2,40})\b/gi,
        /\b(cscs|cpcs|cisrs|ipaf|pasma)\b[\s\w]{0,30}/gi, // Trade certifications
        /\b(chartered|fellow)\s+[\w\s]{2,30}/gi,
    ];

    for (const p of patterns) {
        const matches = text.match(p);
        if (matches) matches.forEach((m) => results.add(m.trim()));
    }

    // Dedicated qualifications section
    const section = text.match(/\b(?:qualifications?|education|credentials)\s*[:：]([\s\S]{20,500}?)(?=\n\n|\n[A-Z][a-z]+\s*:|$)/i);
    if (section) {
        const items = section[1]
            .split(/[\n•·\-\*]|\d+\.\s/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 10 && s.length <= 150);
        items.forEach((i) => results.add(i));
    }

    return Array.from(results).slice(0, 10);
}

/** Extract responsibilities ("what you'll do"). */
export function parseResponsibilities(text: string): string[] {
    if (!text) return [];

    const results = new Set<string>();
    const section = text.match(/\b(?:responsibilities|duties|what\s+you'll\s+do|the\s+role|role\s+overview|day[-\s]to[-\s]day|key\s+tasks)\s*[:：]?\s*([\s\S]{50,1000}?)(?=\n\n|\n[A-Z][a-z]+\s*:|$)/i);
    if (section) {
        const items = section[1]
            .split(/[\n•·\-\*]|\d+\.\s/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 20 && s.length <= 200);
        items.forEach((i) => results.add(i));
    }

    return Array.from(results).slice(0, 10);
}

/** Extract employer contact email. */
export function parseEmployerEmail(text: string): string | null {
    if (!text) return null;
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (!match) return null;

    const email = match[0].toLowerCase();
    // Skip known "noreply" / system addresses
    if (/no[-_]?reply|donotreply|notifications?@|support@|example\.com/i.test(email)) return null;
    return email;
}

/** Extract start date. */
export function parseStartDate(text: string): string | null {
    if (!text) return null;
    const patterns = [
        /\bstart\s+date\s*[:：]?\s*([\w\s,]{3,30})/i,
        /\b(immediate\s+start|start\s+immediately|asap)\b/i,
        /\bstart\s+(?:in\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[0].trim();
    }
    return null;
}

/**
 * Full parser — runs all extractors. Use this to enrich SourceJob objects
 * after raw data is pulled from a provider API or scraped from HTML.
 */
export function parseJobDescription(description: string, existingSalaryText?: string): ParsedJobData {
    const salarySource = [existingSalaryText, description].filter(Boolean).join(' ');
    const salary = parseSalary(salarySource);

    return {
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryPeriod: salary.period,
        salaryOriginalMin: salary.originalMin,
        salaryOriginalMax: salary.originalMax,
        salaryCurrency: salary.currency,
        salaryText: salary.rawText,
        workMode: parseWorkMode(description),
        contractType: parseContractType(description),
        workingHours: parseWorkingHours(description),
        experienceLevel: parseExperienceLevel(description),
        benefits: parseBenefits(description),
        requirements: parseRequirements(description),
        qualifications: parseQualifications(description),
        responsibilities: parseResponsibilities(description),
        employerEmail: parseEmployerEmail(description),
        startDate: parseStartDate(description),
    };
}
