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
      'waiter', 'waitress', 'server', 'front of house', 'foh', 'bar staff',
      'bartender', 'restaurant', 'hospitality', 'cafe', 'café', 'food service',
      'waiting staff', 'kitchen porter', 'team member',
    ],
    negative: ['software', 'developer', 'engineer', 'nurse', 'driver', 'warehouse', 'accountant', 'teacher', 'electrician'],
  },
  {
    canonical: 'software engineer',
    aliases: ['software engineer', 'software developer', 'swe', 'dev'],
    positive: [
      'software engineer', 'software developer', 'backend', 'frontend', 'full stack',
      'full-stack', 'typescript', 'javascript', 'python', 'java', 'react', 'node',
      'api', 'microservices', 'cloud', 'aws', 'azure', 'gcp', 'devops', 'ci/cd',
      'agile', 'scrum', 'git', 'docker', 'kubernetes',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse', 'retail', 'sales assistant'],
  },
  {
    canonical: 'frontend developer',
    aliases: ['frontend developer', 'front end developer', 'front-end developer', 'ui developer'],
    positive: [
      'frontend', 'front end', 'front-end', 'react', 'vue', 'angular', 'typescript',
      'javascript', 'html', 'css', 'ui', 'ux', 'web developer', 'next.js', 'nuxt',
      'tailwind', 'figma', 'responsive design',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'backend developer',
    aliases: ['backend developer', 'back end developer', 'back-end developer'],
    positive: [
      'backend', 'back end', 'back-end', 'node', 'python', 'java', 'go', 'rust',
      'api', 'rest', 'graphql', 'database', 'sql', 'postgres', 'mongodb', 'redis',
      'microservices', 'docker', 'kubernetes', 'aws', 'azure',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'data analyst',
    aliases: ['data analyst', 'data analysis', 'business analyst', 'bi analyst'],
    positive: [
      'data analyst', 'business analyst', 'sql', 'excel', 'power bi', 'tableau',
      'python', 'r', 'data visualisation', 'data visualization', 'reporting',
      'dashboard', 'kpi', 'metrics', 'analytics', 'insight', 'data-driven',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse', 'software engineer'],
  },
  {
    canonical: 'product manager',
    aliases: ['product manager', 'product owner', 'pm', 'po'],
    positive: [
      'product manager', 'product owner', 'roadmap', 'backlog', 'stakeholder',
      'user story', 'agile', 'scrum', 'sprint', 'product strategy', 'go-to-market',
      'okr', 'kpi', 'discovery', 'delivery', 'cross-functional',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'project manager',
    aliases: ['project manager', 'programme manager', 'delivery manager'],
    positive: [
      'project manager', 'programme manager', 'delivery manager', 'pmp', 'prince2',
      'agile', 'waterfall', 'stakeholder management', 'risk management', 'budget',
      'milestone', 'gantt', 'project plan', 'governance',
    ],
    negative: ['waiter', 'driver', 'nurse', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'nurse',
    aliases: ['nurse', 'nursing', 'rn', 'registered nurse'],
    positive: [
      'nurse', 'nursing', 'registered nurse', 'rn', 'nmc', 'ward', 'clinical',
      'patient care', 'healthcare', 'nhs', 'hospital', 'community nurse',
      'mental health nurse', 'district nurse',
    ],
    negative: ['software', 'developer', 'engineer', 'waiter', 'driver', 'warehouse'],
  },
  {
    canonical: 'care worker',
    aliases: ['care worker', 'carer', 'support worker', 'care assistant'],
    positive: [
      'care worker', 'carer', 'support worker', 'care assistant', 'domiciliary',
      'residential care', 'elderly care', 'learning disabilities', 'mental health',
      'personal care', 'care home', 'community care',
    ],
    negative: ['software', 'developer', 'engineer', 'waiter', 'warehouse'],
  },
  {
    canonical: 'sales',
    aliases: ['sales', 'sales executive', 'account executive', 'business development'],
    positive: [
      'sales', 'account executive', 'business development', 'bdr', 'sdr', 'ae',
      'revenue', 'pipeline', 'crm', 'salesforce', 'hubspot', 'quota', 'target',
      'b2b', 'b2c', 'cold calling', 'lead generation', 'closing',
    ],
    negative: ['software engineer', 'nurse', 'driver', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'accountant',
    aliases: ['accountant', 'accounting', 'finance manager', 'financial analyst'],
    positive: [
      'accountant', 'accounting', 'finance', 'aca', 'acca', 'cima', 'cpa',
      'management accounts', 'financial reporting', 'audit', 'tax', 'payroll',
      'balance sheet', 'p&l', 'xero', 'sage', 'quickbooks',
    ],
    negative: ['software', 'developer', 'waiter', 'driver', 'warehouse'],
  },
  {
    canonical: 'driver',
    aliases: ['driver', 'delivery driver', 'hgv driver', 'van driver'],
    positive: [
      'driver', 'delivery driver', 'hgv', 'lgv', 'van driver', 'courier',
      'logistics', 'transport', 'driving licence', 'cat c', 'cat b',
      'last mile', 'route planning',
    ],
    negative: ['software', 'developer', 'nurse', 'accountant', 'teacher'],
  },
  {
    canonical: 'teacher',
    aliases: ['teacher', 'teaching', 'educator', 'lecturer'],
    positive: [
      'teacher', 'teaching', 'educator', 'lecturer', 'qts', 'pgce', 'school',
      'primary', 'secondary', 'sixth form', 'sen', 'classroom', 'curriculum',
      'ofsted', 'lesson plan',
    ],
    negative: ['software', 'developer', 'waiter', 'driver', 'warehouse'],
  },
  {
    canonical: 'marketing',
    aliases: ['marketing manager', 'marketing executive', 'digital marketing', 'content marketing'],
    positive: [
      'marketing', 'digital marketing', 'content', 'seo', 'sem', 'ppc', 'social media',
      'email marketing', 'campaign', 'brand', 'copywriting', 'google analytics',
      'hubspot', 'mailchimp', 'growth', 'acquisition',
    ],
    negative: ['software engineer', 'nurse', 'driver', 'cleaner', 'warehouse'],
  },
  {
    canonical: 'hr',
    aliases: ['hr manager', 'human resources', 'hr business partner', 'people manager'],
    positive: [
      'hr', 'human resources', 'hr business partner', 'hrbp', 'recruitment',
      'talent acquisition', 'employee relations', 'cipd', 'onboarding',
      'performance management', 'compensation', 'benefits', 'people ops',
    ],
    negative: ['software', 'developer', 'waiter', 'driver', 'warehouse'],
  },
  {
    canonical: 'customer service',
    aliases: ['customer service', 'customer support', 'customer success', 'helpdesk'],
    positive: [
      'customer service', 'customer support', 'customer success', 'helpdesk',
      'call centre', 'contact centre', 'inbound', 'outbound', 'zendesk',
      'freshdesk', 'ticketing', 'live chat', 'complaint handling',
    ],
    negative: ['software engineer', 'nurse', 'driver', 'warehouse'],
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
