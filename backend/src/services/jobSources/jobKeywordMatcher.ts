import type { SourceJob } from './types.js';

type RoleRule = {
  canonical: string;
  aliases: string[];
  positive: string[];
  negative: string[];
};

const ROLE_RULES: RoleRule[] = [
  {
    canonical: 'waiter',
    aliases: ['waiter', 'waitress', 'server'],
    positive: [
      'waiter',
      'waitress',
      'server',
      'front of house',
      'foh',
      'bar staff',
      'bartender',
      'restaurant',
      'hospitality',
      'cafe',
      'café',
      'food service',
      'waiting staff',
      'kitchen porter',
      'team member',
    ],
    negative: [
      'software',
      'developer',
      'engineer',
      'nurse',
      'driver',
      'warehouse',
      'accountant',
      'teacher',
      'electrician',
    ],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(' ')) return haystack.includes(normalizedTerm);
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedTerm)}(\\s|$)`).test(haystack);
}

function selectRule(query: string): RoleRule | null {
  const normalizedQuery = normalize(query);
  return ROLE_RULES.find((rule) =>
    rule.aliases.some((alias) => includesTerm(normalizedQuery, alias)),
  ) ?? null;
}

function textForJob(job: SourceJob): string {
  return normalize([
    job.title,
    job.company,
    job.location,
    job.description,
    job.workMode ?? '',
    ...(job.requirements ?? []),
  ].join(' '));
}

export function keywordScoreJob(job: SourceJob, query: string): SourceJob {
  const rule = selectRule(query);
  if (!rule) return job;

  const text = textForJob(job);
  const positiveMatches = rule.positive.filter((term) => includesTerm(text, term));
  const negativeMatches = rule.negative.filter((term) => includesTerm(text, term));

  if (positiveMatches.length === 0 && negativeMatches.length === 0) {
    return { ...job, fitScore: job.fitScore ?? 50 };
  }

  const base = 45;
  const positiveScore = Math.min(45, positiveMatches.length * 12);
  const negativePenalty = Math.min(35, negativeMatches.length * 15);
  const score = Math.max(0, Math.min(100, base + positiveScore - negativePenalty));

  return {
    ...job,
    fitScore: Math.max(job.fitScore ?? 0, score),
  };
}

export function keywordScoreJobs(jobs: SourceJob[], query: string): SourceJob[] {
  return jobs.map((job) => keywordScoreJob(job, query));
}

export function expandQueryByKeywordRules(query: string): string[] {
  const rule = selectRule(query);
  if (!rule) return [query];
  return Array.from(new Set([query, ...rule.aliases, ...rule.positive.slice(0, 8)])).filter(Boolean);
}
