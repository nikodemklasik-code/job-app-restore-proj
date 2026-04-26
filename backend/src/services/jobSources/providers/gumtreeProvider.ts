import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

// Rotate user agents
const FETCH_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function pickFetchUA(): string {
  return FETCH_USER_AGENTS[Math.floor(Math.random() * FETCH_USER_AGENTS.length)];
}

/** Extract salary from Gumtree format */
function parseSalary(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const nums = raw.replace(/[£,]/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return { min: null, max: null };
  const values = nums.map(Number).filter((n) => n >= 1000);
  if (values.length === 0) return { min: null, max: null };
  const isHourly = /hour|hr/i.test(raw);
  const isDaily = /day|daily/i.test(raw);
  const factor = isHourly ? 2080 : isDaily ? 260 : 1;
  return {
    min: Math.round(values[0] * factor),
    max: values.length > 1 ? Math.round(values[values.length - 1] * factor) : null,
  };
}

/** Extract work mode from description */
function parseWorkMode(description: string): string | null {
  const text = description.toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/hybrid/.test(text)) return 'hybrid';
  if (/on.?site|in.?office|on.?premises/.test(text)) return 'on-site';
  return null;
}

/** Extract requirements from description */
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

export class GumtreeProvider implements JobSourceProvider {
  name = 'gumtree';
  label = 'Gumtree';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: true };
  }

  async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
    const cookies = context?.sessionCookies?.['gumtree'];
    if (!cookies?.trim()) return [];

    const url = `https://www.gumtree.com/search?search_category=jobs&q=${encodeURIComponent(input.query)}&search_location=${encodeURIComponent(input.location || 'United Kingdom')}&distance=60`;

    const ua = pickFetchUA();
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.gumtree.com/',
        'Cookie': cookies,
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
      },
    });

    if (res.status === 403) {
      throw new Error('Gumtree session expired or blocked (403) — please re-authenticate');
    }
    if (!res.ok) throw new Error(`Gumtree ${res.status}`);

    const html = await res.text();

    // Detect login wall
    if (
      html.includes('id="signin-form"') ||
      html.includes('gumtree.com/login') ||
      html.toLowerCase().includes('sign in to gumtree')
    ) {
      throw new Error('Gumtree session expired — please re-authenticate');
    }

    return parseGumtreeHtml(html, input.limit);
  }
}

function parseGumtreeHtml(html: string, limit: number): SourceJob[] {
  const results: SourceJob[] = [];

  // Strategy 1: __NEXT_DATA__ JSON (most reliable)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const props = (data.props as Record<string, unknown> | undefined);
      const pageProps = (props?.pageProps as Record<string, unknown> | undefined);

      const listings =
        (pageProps?.listings as Array<Record<string, unknown>> | undefined) ??
        ((pageProps?.searchResults as Record<string, unknown> | undefined)?.listings as Array<Record<string, unknown>> | undefined) ??
        ((pageProps?.data as Record<string, unknown> | undefined)?.listings as Array<Record<string, unknown>> | undefined) ??
        (pageProps?.ads as Array<Record<string, unknown>> | undefined) ??
        [];

      for (const ad of listings.slice(0, limit)) {
        const id = String(ad.id ?? ad.adId ?? randomUUID());
        const description = String(ad.description ?? '');
        const salaryRaw = String(ad.price ?? ad.salary ?? '');
        const { min: salaryMin, max: salaryMax } = parseSalary(salaryRaw);

        results.push({
          externalId: id,
          source: 'gumtree',
          title: String(ad.title ?? ad.name ?? ''),
          company: String(ad.sellerName ?? ad.advertiserName ?? 'Employer'),
          location: String(
            (ad.location as Record<string, unknown> | undefined)?.displayName ?? ad.location ?? 'UK',
          ),
          description,
          applyUrl: `https://www.gumtree.com${String(ad.url ?? `/jobs/.../${id}`)}`,
          salaryMin,
          salaryMax,
          workMode: parseWorkMode(description),
          requirements: extractRequirements(description),
          postedAt: new Date().toISOString(),
        });
      }
      if (results.length > 0) return results;
    } catch { /* fall through */ }
  }

  // Strategy 2: Regex fallback for Gumtree listing cards
  const listingPattern =
    /data-q="listing-(\d+)"[\s\S]*?data-q="listing-title"[^>]*>([^<]+)<\/a>[\s\S]*?data-q="listing-price"[^>]*>([^<]*)<[\s\S]*?data-q="listing-location"[^>]*>([^<]+)</g;
  let match;
  while ((match = listingPattern.exec(html)) !== null && results.length < limit) {
    results.push({
      externalId: match[1],
      source: 'gumtree',
      title: match[2].trim(),
      company: 'Employer',
      location: match[4].trim(),
      description: '',
      applyUrl: `https://www.gumtree.com/jobs/.../${match[1]}`,
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    });
  }

  return results;
}
