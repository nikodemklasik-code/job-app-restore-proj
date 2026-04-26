import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

// Rotate user agents to reduce bot detection on fetch requests
const FETCH_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function pickFetchUA(): string {
  return FETCH_USER_AGENTS[Math.floor(Math.random() * FETCH_USER_AGENTS.length)];
}

export class IndeedBrowserProvider implements JobSourceProvider {
  name = 'indeed-browser';
  label = 'Indeed';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    // Readiness is checked at discover time via context cookies
    return { ready: true };
  }

  async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
    const cookies = context?.sessionCookies?.['indeed'];
    if (!cookies?.trim()) return [];

    // Build query — include seniority hint if present in the query string
    const params = new URLSearchParams({
      q: input.query,
      l: input.location || 'United Kingdom',
      limit: String(Math.min(input.limit, 25)),
      fromage: '14',
      sort: 'date',
      radius: '25',
    });

    const ua = pickFetchUA();
    const res = await fetch(`https://www.indeed.co.uk/jobs?${params.toString()}`, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.indeed.co.uk/',
        'Cookie': cookies,
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'upgrade-insecure-requests': '1',
      },
    });

    if (res.status === 403) {
      throw new Error('Indeed session expired or blocked (403) — please re-authenticate');
    }
    if (!res.ok) throw new Error(`Indeed ${res.status}`);

    const html = await res.text();

    // Detect login wall / CAPTCHA
    if (
      html.includes('id="signin-form"') ||
      html.includes('secure.indeed.com/auth') ||
      html.includes('captcha') ||
      html.toLowerCase().includes('sign in to indeed')
    ) {
      throw new Error('Indeed session expired — please re-authenticate');
    }

    return parseIndeedHtml(html);
  }
}

/** Extract salary range from Indeed salary text like "£30,000 - £40,000 a year" */
function parseSalary(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const nums = raw.replace(/[£,]/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return { min: null, max: null };
  const values = nums.map(Number).filter((n) => n >= 1000);
  if (values.length === 0) return { min: null, max: null };
  // Normalise hourly/daily to annual
  const isHourly = /hour|hr/i.test(raw);
  const isDaily = /day|daily/i.test(raw);
  const factor = isHourly ? 2080 : isDaily ? 260 : 1;
  return {
    min: Math.round(values[0] * factor),
    max: values.length > 1 ? Math.round(values[values.length - 1] * factor) : null,
  };
}

/** Extract work mode from job data */
function parseWorkMode(raw: string | null | undefined, description: string): string | null {
  const text = ((raw ?? '') + ' ' + description).toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/hybrid/.test(text)) return 'hybrid';
  if (/on.?site|in.?office|on.?premises/.test(text)) return 'on-site';
  return raw?.trim() || null;
}

/** Extract bullet-point requirements from description */
function extractRequirements(description: string): string[] {
  if (!description) return [];
  return description
    .split(/[\n•\-\*]/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 15 && line.length <= 150)
    .filter((line) =>
      /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding|degree|qualification|required|must have)/i.test(line),
    )
    .slice(0, 8);
}

function parseIndeedHtml(html: string): SourceJob[] {
  const results: SourceJob[] = [];

  // Strategy 1: Extract mosaic.providerData JSON — most reliable
  // Indeed embeds job data as a large JSON blob in the page
  const mosaicPatterns = [
    // Standard pattern
    /"mosaic-provider-jobcards"[^{]*\{[^{]*"results"\s*:\s*(\[[\s\S]{100,}?\])\s*,\s*"(?:trackingKey|pageNumber)"/,
    // Alternative key path
    /"jobcards"[^{]*\{[^{]*"results"\s*:\s*(\[[\s\S]{100,}?\])\s*,\s*"trackingKey"/,
  ];

  for (const pattern of mosaicPatterns) {
    const mosaicMatch = html.match(pattern);
    if (mosaicMatch) {
      try {
        const jobs = JSON.parse(mosaicMatch[1]) as Array<Record<string, unknown>>;
        for (const job of jobs) {
          const jobKey = String(job.jobkey ?? job.jobKey ?? '');
          const salaryRaw = String(
            (job.extractedSalary as Record<string, unknown> | undefined)?.formattedRange ??
            (job.salarySnippet as Record<string, unknown> | undefined)?.text ??
            job.salary ?? '',
          );
          const { min: salaryMin, max: salaryMax } = parseSalary(salaryRaw);
          const description = String(job.snippet ?? job.jobDescription ?? '');
          const workModeRaw = String(job.jobType ?? job.remoteWorkModel ?? job.workplaceType ?? '');

          results.push({
            externalId: jobKey || randomUUID(),
            source: 'indeed-browser',
            title: String(job.title ?? job.displayTitle ?? ''),
            company: String((job.company as Record<string, unknown>)?.name ?? job.company ?? ''),
            location:
              String(
                (job.jobLocationCity ?? '') + (job.jobLocationState ? ', ' + job.jobLocationState : ''),
              ).replace(/^, |, $/, '') || 'UK',
            description,
            applyUrl: jobKey ? `https://www.indeed.co.uk/viewjob?jk=${jobKey}` : '',
            salaryMin,
            salaryMax,
            workMode: parseWorkMode(workModeRaw, description),
            requirements: extractRequirements(description),
            postedAt: new Date().toISOString(),
          });
        }
        if (results.length > 0) return results;
      } catch { /* fall through to next strategy */ }
    }
  }

  // Strategy 2: Extract __NEXT_DATA__ JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const props = (data.props as Record<string, unknown> | undefined);
      const pageProps = (props?.pageProps as Record<string, unknown> | undefined);
      const jobResults =
        (pageProps?.jobResults as Record<string, unknown> | undefined)?.results ??
        (pageProps?.results as unknown[]) ??
        [];
      for (const job of jobResults as Array<Record<string, unknown>>) {
        const jobKey = String(job.jobkey ?? job.id ?? randomUUID());
        const description = String(job.snippet ?? job.description ?? '');
        const salaryRaw = String(job.salary ?? '');
        const { min: salaryMin, max: salaryMax } = parseSalary(salaryRaw);
        results.push({
          externalId: jobKey,
          source: 'indeed-browser',
          title: String(job.title ?? ''),
          company: String(job.company ?? ''),
          location: String(job.location ?? 'UK'),
          description,
          applyUrl: `https://www.indeed.co.uk/viewjob?jk=${jobKey}`,
          salaryMin,
          salaryMax,
          workMode: parseWorkMode(null, description),
          requirements: extractRequirements(description),
          postedAt: new Date().toISOString(),
        });
      }
      if (results.length > 0) return results;
    } catch { /* fall through */ }
  }

  // Strategy 3: Regex fallback using data-jk attribute
  const cardPattern =
    /data-jk="([^"]+)"[\s\S]*?class="jobTitle"[^>]*><[^>]+>([^<]+)<\/span>[\s\S]*?class="companyName"[^>]*>([^<]+)<\/[^>]+>[\s\S]*?class="companyLocation"[^>]*>([^<]+)<\/div>/g;
  let match;
  while ((match = cardPattern.exec(html)) !== null) {
    results.push({
      externalId: match[1],
      source: 'indeed-browser',
      title: match[2].trim(),
      company: match[3].trim(),
      location: match[4].trim(),
      description: '',
      applyUrl: `https://www.indeed.co.uk/viewjob?jk=${match[1]}`,
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    });
  }

  return results;
}
