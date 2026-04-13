import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

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

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cookie': cookies,
      },
    });
    if (!res.ok) throw new Error(`Gumtree ${res.status}`);
    const html = await res.text();
    return parseGumtreeHtml(html, input.limit);
  }
}

function parseGumtreeHtml(html: string, limit: number): SourceJob[] {
  const results: SourceJob[] = [];

  // Strategy 1: __NEXT_DATA__ JSON
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
        results.push({
          externalId: id,
          source: 'gumtree',
          title: String(ad.title ?? ad.name ?? ''),
          company: String(ad.sellerName ?? ad.advertiserName ?? 'Employer'),
          location: String(
            (ad.location as Record<string, unknown> | undefined)?.displayName ?? ad.location ?? 'UK',
          ),
          description: String(ad.description ?? ''),
          applyUrl: `https://www.gumtree.com${String(ad.url ?? `/jobs/.../${id}`)}`,
          salaryMin: null,
          salaryMax: null,
          workMode: null,
          requirements: [],
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
