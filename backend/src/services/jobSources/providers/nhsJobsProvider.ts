import type { DiscoveryInput, JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

function clean(value: unknown): string {
  return String(value ?? '')
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
  return clean(out).replaceAll('  ', ' ');
}

function maybeAnnualSalary(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = clean(value);
  const match = text.match(/[0-9,]+/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

function normaliseLocation(value: unknown, fallback: string): string {
  const text = clean(value);
  return text || fallback || 'United Kingdom';
}

function fromRecord(raw: Record<string, unknown>, index: number, input: DiscoveryInput): SourceJob | null {
  const title = clean(raw.title ?? raw.jobTitle ?? raw.name ?? raw.vacancyTitle);
  const id = clean(raw.id ?? raw.vacancyReference ?? raw.reference ?? raw.jobId ?? raw.vacancyId) || `nhs-jobs-${index}`;
  const description = stripTags(clean(raw.description ?? raw.summary ?? raw.jobDescription ?? raw.teaser));
  const url = clean(raw.url ?? raw.applyUrl ?? raw.link ?? raw.vacancyUrl);
  const applyUrl = url.startsWith('http') ? url : `https://www.jobs.nhs.uk/candidate/jobadvert/${id}`;
  if (!title) return null;

  return {
    externalId: id,
    source: 'nhs-jobs',
    title,
    company: clean(raw.employer ?? raw.organisation ?? raw.organization ?? raw.company) || 'NHS',
    location: normaliseLocation(raw.location ?? raw.town ?? raw.region, input.location),
    description,
    applyUrl,
    salaryMin: maybeAnnualSalary(raw.salaryMin ?? raw.salary_min ?? raw.salaryFrom),
    salaryMax: maybeAnnualSalary(raw.salaryMax ?? raw.salary_max ?? raw.salaryTo),
    salaryText: clean(raw.salary ?? raw.salaryText) || null,
    workMode: description.toLowerCase().includes('remote') ? 'remote' : description.toLowerCase().includes('hybrid') ? 'hybrid' : null,
    contractType: clean(raw.contractType ?? raw.contract_type) || null,
    workingHours: clean(raw.workingHours ?? raw.hours) || null,
    requirements: [],
    postedAt: clean(raw.datePosted ?? raw.postedDate ?? raw.publicationDate) || new Date().toISOString(),
  };
}

function collectRecords(value: unknown, out: Record<string, unknown>[]): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, out);
    return;
  }
  if (typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const hasJobShape = Boolean(record.title || record.jobTitle || record.vacancyTitle) && Boolean(record.id || record.reference || record.vacancyReference || record.url || record.link);
  if (hasJobShape) out.push(record);
  for (const key of ['jobs', 'vacancies', 'results', 'data', 'items']) collectRecords(record[key], out);
}

function parseHtmlCards(html: string, input: DiscoveryInput): SourceJob[] {
  const cards = html.split('nhsuk-list-panel').slice(1).slice(0, input.limit);
  return cards.map((card, index) => {
    const hrefStart = card.indexOf('href="');
    if (hrefStart < 0) return null;
    const hrefRest = card.slice(hrefStart + 6);
    const href = hrefRest.slice(0, hrefRest.indexOf('"'));
    const title = stripTags(card.slice(0, Math.min(card.length, 600))).split('  ').find((part) => part.trim().length > 8) ?? '';
    if (!title) return null;
    const applyUrl = href.startsWith('http') ? href : `https://www.jobs.nhs.uk${href}`;
    return {
      externalId: applyUrl,
      source: 'nhs-jobs',
      title: title.trim(),
      company: 'NHS',
      location: input.location || 'United Kingdom',
      description: stripTags(card).slice(0, 2000),
      applyUrl,
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    } satisfies SourceJob;
  }).filter((job): job is SourceJob => job !== null);
}

export class NHSJobsProvider implements JobSourceProvider {
  name = 'nhs-jobs';
  label = 'NHS Jobs';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    return { ready: true, reason: 'NHS Jobs public search enabled' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const urls = [
      new URL('https://www.jobs.nhs.uk/candidate/search/results'),
      new URL('https://www.jobs.nhs.uk/xi/search_vacancy'),
    ];
    urls[0].searchParams.set('keyword', input.query);
    urls[0].searchParams.set('location', input.location || 'United Kingdom');
    urls[1].searchParams.set('action', 'search');
    urls[1].searchParams.set('keywords', input.query);
    urls[1].searchParams.set('format', 'json');

    const settled = await Promise.allSettled(urls.map(async (url) => {
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json, text/html, */*' } });
      if (!response.ok) throw new Error(`NHS Jobs ${response.status}`);
      const text = await response.text();
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const records: Record<string, unknown>[] = [];
        collectRecords(JSON.parse(text), records);
        return records.map((record, index) => fromRecord(record, index, input)).filter((job): job is SourceJob => job !== null);
      }
      return parseHtmlCards(text, input);
    }));

    const jobs = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = `${job.externalId}|${job.source}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, input.limit);
  }
}
