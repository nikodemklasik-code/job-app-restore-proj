import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

function clean(value: string): string {
  return value
    .split('<![CDATA[').join('')
    .split(']]>').join('')
    .split('&amp;').join('&')
    .split('&lt;').join('<')
    .split('&gt;').join('>')
    .split('&quot;').join('"')
    .split('&#39;').join("'")
    .replaceAll('\n', ' ')
    .replaceAll('\t', ' ')
    .trim();
}

function stripTags(value: string): string {
  let out = '';
  let inside = false;
  for (const char of value) {
    if (char === '<') { inside = true; out += ' '; continue; }
    if (char === '>') { inside = false; out += ' '; continue; }
    if (!inside) out += char;
  }
  return clean(out).split('  ').join(' ');
}

function readTag(xml: string, tagName: string): string {
  const lower = xml.toLowerCase();
  const open = lower.indexOf(`<${tagName.toLowerCase()}`);
  if (open < 0) return '';
  const contentStart = xml.indexOf('>', open);
  if (contentStart < 0) return '';
  const close = lower.indexOf(`</${tagName.toLowerCase()}>`, contentStart);
  if (close < 0) return '';
  return stripTags(xml.slice(contentStart + 1, close));
}

function splitItems(xml: string): string[] {
  const chunks: string[] = [];
  const parts = xml.split('<item');
  for (const part of parts.slice(1)) {
    const openEnd = part.indexOf('>');
    const close = part.toLowerCase().indexOf('</item>');
    if (openEnd >= 0 && close > openEnd) chunks.push(part.slice(openEnd + 1, close));
  }
  return chunks;
}

function inferLocation(text: string): string {
  const cities = ['London', 'Oxford', 'Cambridge', 'Edinburgh', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Glasgow', 'Liverpool', 'Cardiff', 'Belfast', 'York'];
  const lower = text.toLowerCase();
  return cities.find((city) => lower.includes(city.toLowerCase())) ?? 'United Kingdom';
}

function inferCompany(title: string, description: string): string {
  const marker = title.toLowerCase().indexOf(' at ');
  if (marker >= 0) {
    const company = title.slice(marker + 4).split('-')[0].split('–')[0].trim();
    if (company) return company;
  }
  const text = `${title} ${description}`;
  const university = text.split(' ').find((word) => word.toLowerCase().includes('university'));
  return university ? 'University / Academic Institution' : 'Academic Institution';
}

function toJob(item: string, index: number): SourceJob | null {
  const title = readTag(item, 'title');
  const link = readTag(item, 'link');
  if (!title || !link) return null;
  const description = readTag(item, 'description');
  const guid = readTag(item, 'guid') || link || `jobs-ac-uk-${index}`;
  const pubDate = readTag(item, 'pubDate');
  const fullText = `${title} ${description}`;

  return {
    externalId: guid,
    source: 'jobs-ac-uk',
    title,
    company: inferCompany(title, description),
    location: inferLocation(fullText),
    description,
    applyUrl: link,
    salaryMin: null,
    salaryMax: null,
    workMode: fullText.toLowerCase().includes('remote') ? 'remote' : fullText.toLowerCase().includes('hybrid') ? 'hybrid' : null,
    requirements: [],
    postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  };
}

export class JobsAcUkProvider implements JobSourceProvider {
  name = 'jobs-ac-uk';
  label = 'jobs.ac.uk';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: true, reason: 'Public jobs.ac.uk RSS feeds enabled' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const feeds = [
      'https://www.jobs.ac.uk/feeds/subject-areas/computer-sciences',
      'https://www.jobs.ac.uk/feeds/subject-areas/business-and-management-studies',
      'https://www.jobs.ac.uk/feeds/type-roles/professional-managerial-and-support-services',
    ];

    const results = await Promise.allSettled(feeds.map(async (url) => {
      const response = await fetch(url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' } });
      if (!response.ok) throw new Error(`jobs.ac.uk RSS ${response.status}`);
      return response.text();
    }));

    const jobs: SourceJob[] = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      splitItems(result.value).forEach((item, index) => {
        const job = toJob(item, index);
        if (job) jobs.push(job);
      });
    }

    const query = input.query.trim().toLowerCase();
    const matched = query ? jobs.filter((job) => `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(query)) : jobs;
    const selected = matched.length > 0 ? matched : jobs;
    const seen = new Set<string>();
    return selected.filter((job) => {
      const key = `${job.externalId}|${job.source}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, input.limit);
  }
}
