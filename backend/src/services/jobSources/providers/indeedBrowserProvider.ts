import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

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

    const params = new URLSearchParams({
      q: input.query,
      l: input.location || 'United Kingdom',
      limit: String(Math.min(input.limit, 25)),
      fromage: '14',
      sort: 'date',
    });

    const res = await fetch(`https://www.indeed.co.uk/jobs?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cookie': cookies,
      },
    });
    if (!res.ok) throw new Error(`Indeed ${res.status}`);

    const html = await res.text();
    return parseIndeedHtml(html);
  }
}

function parseIndeedHtml(html: string): SourceJob[] {
  const results: SourceJob[] = [];

  // Strategy 1: Extract window.mosaic.providerData["mosaic-provider-jobcards"] JSON
  const mosaicMatch = html.match(
    /window\.mosaic\.providerData\s*=\s*\{[^}]*"mosaic-provider-jobcards"\s*:\s*\{[^}]*"results"\s*:\s*(\[[\s\S]*?\])\s*,\s*"trackingKey"/,
  );
  if (mosaicMatch) {
    try {
      const jobs = JSON.parse(mosaicMatch[1]) as Array<Record<string, unknown>>;
      for (const job of jobs) {
        const jobKey = String(job.jobkey ?? job.jobKey ?? '');
        results.push({
          externalId: jobKey || randomUUID(),
          source: 'indeed-browser',
          title: String(job.title ?? job.displayTitle ?? ''),
          company: String((job.company as Record<string, unknown>)?.name ?? job.company ?? ''),
          location:
            String(
              (job.jobLocationCity ?? '') + ', ' + (job.jobLocationState ?? ''),
            ).replace(/^, |, $/, '') || 'UK',
          description: String(job.snippet ?? job.jobDescription ?? ''),
          applyUrl: jobKey ? `https://www.indeed.co.uk/viewjob?jk=${jobKey}` : '',
          salaryMin: null,
          salaryMax: null,
          workMode: String(job.jobType ?? job.remoteWorkModel ?? '') || null,
          requirements: [],
          postedAt: new Date().toISOString(),
        });
      }
      if (results.length > 0) return results;
    } catch { /* fall through */ }
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
        results.push({
          externalId: jobKey,
          source: 'indeed-browser',
          title: String(job.title ?? ''),
          company: String(job.company ?? ''),
          location: String(job.location ?? 'UK'),
          description: String(job.snippet ?? job.description ?? ''),
          applyUrl: `https://www.indeed.co.uk/viewjob?jk=${jobKey}`,
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
