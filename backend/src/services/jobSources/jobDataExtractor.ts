/**
 * Universal Job Data Extractor
 *
 * Extracts ALL available information from a job description:
 * - Requirements / qualifications
 * - Responsibilities / duties
 * - Benefits / perks
 * - Skills / tools
 * - Employment type (full-time, part-time, contract, permanent, temporary)
 * - Experience level (entry, junior, mid, senior, lead)
 * - Work mode (remote, hybrid, on-site)
 * - Salary text (raw salary string from description)
 * - Education requirements
 * - Languages
 * - Application deadline
 * - Start date
 *
 * Handles both bullet-point lists AND prose paragraphs.
 * Uses section-aware parsing to capture content under headers like
 * "What you'll do", "Requirements", "Benefits", etc.
 */

export interface ExtractedJobData {
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    skills: string[];
    employmentType: string | null;    // full-time | part-time | contract | permanent | temporary
    experienceLevel: string | null;   // entry | junior | mid | senior | lead | director
    workMode: string | null;          // remote | hybrid | on-site
    salaryText: string | null;        // raw salary string e.g. "£30,000 - £35,000 per annum"
    educationRequirement: string | null;
    languages: string[];
    applicationDeadline: string | null;
    startDate: string | null;
}

function cleanLine(line: string): string {
    return line
        .replace(/^\s*[•·●▪️■□◦▶►-]\s*/, '')
        .replace(/^\s*\d+[.)]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function dedup(items: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items) {
        const key = item.toLowerCase().replace(/[^\w]/g, '');
        if (key.length < 8 || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

/**
 * Extract content under a section header like "Requirements:" or "What you'll do".
 * Returns everything until the next major header or double newline.
 */
function extractSection(text: string, headers: string[]): string {
    const headerPattern = headers.map((h) => h.replace(/\s+/g, '\\s+')).join('|');
    const regex = new RegExp(
        `(?:^|\\n)\\s*(?:${headerPattern})\\s*[:：]?\\s*\\n?([\\s\\S]{30,2500}?)(?=\\n\\s*(?:[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,3})\\s*[:：]|\\n\\n\\n|$)`,
        'gi',
    );
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
        matches.push(m[1]);
    }
    return matches.join('\n');
}

/** Split a block of text into list items (bullets OR sentences). */
function splitIntoItems(block: string): string[] {
    if (!block) return [];

    // Try bullets / newlines first
    const bulletLines = block
        .split(/\n+|[•·●▪️■□◦▶►]/)
        .map(cleanLine)
        .filter((l) => l.length >= 15 && l.length <= 250);

    if (bulletLines.length >= 2) return bulletLines;

    // Fallback: split by sentence boundaries
    return block
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map(cleanLine)
        .filter((l) => l.length >= 20 && l.length <= 250);
}

function detectEmploymentType(text: string): string | null {
    const lower = text.toLowerCase();
    if (/\bfull[\s-]?time\b/.test(lower)) return 'full-time';
    if (/\bpart[\s-]?time\b/.test(lower)) return 'part-time';
    if (/\bfreelanc(e|er|ing)\b/.test(lower)) return 'freelance';
    if (/\b(fixed[\s-]?term|temporary|temp\s+(role|position))\b/.test(lower)) return 'temporary';
    if (/\bcontract(or)?\b/.test(lower) && !/contract\s+(of|with|for)/i.test(lower)) return 'contract';
    if (/\bpermanent\b/.test(lower)) return 'permanent';
    if (/\bapprenticeship\b/.test(lower)) return 'apprenticeship';
    if (/\binternship\b|\bintern\b/.test(lower)) return 'internship';
    return null;
}

function detectExperienceLevel(title: string, description: string): string | null {
    const combined = `${title} ${description}`.toLowerCase();
    if (/\b(director|head\s+of|chief|vp|vice\s+president)\b/.test(combined)) return 'director';
    if (/\b(senior|sr\.?|lead|principal|staff)\b/.test(combined)) return 'senior';
    if (/\b(mid[\s-]?level|intermediate|experienced)\b/.test(combined)) return 'mid';
    if (/\b(junior|jr\.?|associate)\b/.test(combined)) return 'junior';
    if (/\b(entry[\s-]?level|graduate|trainee|apprentice|no\s+experience)\b/.test(combined)) return 'entry';
    return null;
}

function detectWorkMode(text: string): string | null {
    const lower = text.toLowerCase();
    if (/\b(100%\s+remote|fully\s+remote|work\s+from\s+home|remote[\s-]?first|remote\s+(only|role|position))\b/.test(lower)) return 'remote';
    if (/\bhybrid\b/.test(lower)) return 'hybrid';
    if (/\b(on[\s-]?site|in[\s-]?office|in[\s-]?person|office[\s-]?based)\b/.test(lower)) return 'on-site';
    if (/\bremote\b/.test(lower)) return 'remote';
    return null;
}

function detectSalaryText(text: string): string | null {
    // £ with optional range and period
    const patterns = [
        /£\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?-\s?£?\s?\d{1,3}(?:,\d{3})*)?(?:\s+per\s+(?:annum|year|month|hour|day|week))?/i,
        /\$\s?\d{1,3}(?:,\d{3})*(?:\s?-\s?\$?\s?\d{1,3}(?:,\d{3})*)?(?:\s+per\s+(?:annum|year|month|hour))?/i,
        /€\s?\d{1,3}(?:,\d{3})*(?:\s?-\s?€?\s?\d{1,3}(?:,\d{3})*)?/,
        /\b\d{1,3}(?:,\d{3})+\s?-\s?\d{1,3}(?:,\d{3})+\s+(?:GBP|USD|EUR|PLN)\b/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[0].trim();
    }
    return null;
}

function detectEducation(text: string): string | null {
    const patterns = [
        /\b(phd|doctorate|masters?\s+degree|bachelor'?s?\s+degree|undergraduate\s+degree|a[\s-]?level|gcse|nvq\s+level\s*\d|diploma|btec|hnd|hnc)\b[^.!?\n]{0,120}/i,
        /\b(degree|qualification)\s+in\s+[a-z][a-z\s/&-]{3,60}/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[0].trim().replace(/\s+/g, ' ');
    }
    return null;
}

function detectLanguages(text: string): string[] {
    const languages: string[] = [];
    const langs = ['english', 'polish', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian', 'chinese', 'japanese', 'arabic', 'hindi'];
    const lower = text.toLowerCase();
    for (const lang of langs) {
        const pattern = new RegExp(`\\b${lang}\\b(?:\\s+(?:fluent|fluency|native|speaker|required|essential))?`, 'i');
        if (pattern.test(lower)) {
            languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
        }
    }
    return languages;
}

function extractSkillsList(text: string): string[] {
    const skillPatterns = [
        // Technical
        /\b(javascript|typescript|python|java|c#|c\+\+|ruby|go|rust|php|swift|kotlin|scala)\b/gi,
        /\b(react|angular|vue|next\.?js|nuxt|svelte|ember)\b/gi,
        /\b(node\.?js|express|django|flask|spring|rails|laravel|\.net)\b/gi,
        /\b(aws|azure|gcp|google\s+cloud|docker|kubernetes|terraform|ansible)\b/gi,
        /\b(mysql|postgres(?:ql)?|mongodb|redis|elasticsearch|dynamodb|oracle|sql\s+server)\b/gi,
        /\b(git|github|gitlab|bitbucket|jira|confluence|jenkins|ci\/cd)\b/gi,
        // Business / Office
        /\b(excel|word|powerpoint|outlook|ms\s+office|office\s+365|google\s+workspace)\b/gi,
        /\b(salesforce|hubspot|zoho|sap|oracle|dynamics)\b/gi,
        /\b(power\s+bi|tableau|looker|qlik)\b/gi,
        // Trade / Manual
        /\b(painting|decorating|plastering|tiling|joinery|carpentry|plumbing|welding|electrical)\b/gi,
        // Finance / Collections
        /\b(collections|debt\s+recovery|negotiation|customer\s+service|kyc|aml)\b/gi,
    ];
    const found = new Set<string>();
    for (const p of skillPatterns) {
        const matches = text.match(p);
        if (matches) matches.forEach((m) => found.add(m.toLowerCase().trim()));
    }
    return [...found].slice(0, 25);
}

function detectDate(text: string, keywords: string[]): string | null {
    const keywordPattern = keywords.join('|');
    const regex = new RegExp(
        `(?:${keywordPattern})\\s*[:：]?\\s*([^.\\n]{5,80})`,
        'i',
    );
    const m = text.match(regex);
    return m ? m[1].trim() : null;
}

/**
 * Main extractor function.
 */
export function extractJobData(title: string, description: string): ExtractedJobData {
    if (!description || description.trim().length < 20) {
        return {
            requirements: [],
            responsibilities: [],
            benefits: [],
            skills: extractSkillsList(title),
            employmentType: detectEmploymentType(title),
            experienceLevel: detectExperienceLevel(title, ''),
            workMode: null,
            salaryText: null,
            educationRequirement: null,
            languages: [],
            applicationDeadline: null,
            startDate: null,
        };
    }

    // Extract section-based content
    const requirementsBlock = extractSection(description, [
        'requirements?',
        'qualifications?',
        'skills?\\s+(?:needed|required|you\\s+(?:need|have))',
        'what\\s+you.?(?:ll|ve)\\s+need',
        'what\\s+we.?re\\s+looking\\s+for',
        'essential(?:\\s+skills)?',
        'you\\s+(?:must|should|will)\\s+have',
        'the\\s+ideal\\s+candidate',
        'about\\s+you',
        'the\\s+person',
    ]);

    const responsibilitiesBlock = extractSection(description, [
        'responsibilities',
        'duties',
        'what\\s+you.?(?:ll|d)\\s+do',
        'the\\s+role',
        'role\\s+(?:overview|summary)',
        'job\\s+description',
        'main\\s+(?:tasks|duties|accountabilities)',
        'key\\s+(?:tasks|duties|accountabilities|responsibilities)',
        'day[\\s-]?to[\\s-]?day',
    ]);

    const benefitsBlock = extractSection(description, [
        'benefits',
        'what\\s+(?:we\\s+offer|you.?ll\\s+get|you.?ll\\s+receive)',
        'perks',
        'rewards?',
        'package',
        'we\\s+offer',
        'on\\s+offer',
        'in\\s+return',
    ]);

    // Fallback: if no structured sections, extract from full description
    let requirements = dedup(splitIntoItems(requirementsBlock));
    if (requirements.length === 0) {
        requirements = dedup(
            splitIntoItems(description).filter((line) =>
                /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding|degree|qualification|required|must\s+have|essential|desirable|expertise|competent|demonstrated)/i.test(line),
            ),
        );
    }

    let responsibilities = dedup(splitIntoItems(responsibilitiesBlock));
    if (responsibilities.length === 0) {
        responsibilities = dedup(
            splitIntoItems(description).filter((line) =>
                /\b(manage|lead|deliver|develop|implement|coordinate|support|ensure|handle|work\s+with|collaborate|maintain|drive|oversee|conduct|perform|execute|build|create|design|analyze|review)\b/i.test(line),
            ),
        );
    }

    let benefits = dedup(splitIntoItems(benefitsBlock));
    if (benefits.length === 0) {
        benefits = dedup(
            splitIntoItems(description).filter((line) =>
                /\b(holiday|annual\s+leave|pension|bonus|healthcare|insurance|training|development|gym|flexible|wellbeing|discount|voucher|cycle|share\s+option|equity|stock)\b/i.test(line),
            ),
        );
    }

    return {
        requirements: requirements.slice(0, 12),
        responsibilities: responsibilities.slice(0, 12),
        benefits: benefits.slice(0, 10),
        skills: extractSkillsList(`${title} ${description}`),
        employmentType: detectEmploymentType(description) || detectEmploymentType(title),
        experienceLevel: detectExperienceLevel(title, description),
        workMode: detectWorkMode(description),
        salaryText: detectSalaryText(description),
        educationRequirement: detectEducation(description),
        languages: detectLanguages(description),
        applicationDeadline: detectDate(description, ['deadline', 'closing\\s+date', 'apply\\s+by']),
        startDate: detectDate(description, ['start\\s+date', 'starting', 'commencing']),
    };
}
