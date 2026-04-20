/**
 * English labels for shell chrome (header title; sidebar uses the same strings where listed).
 * One source of truth — keep in sync with `router.tsx` paths.
 */
export const SHELL_PAGE_TITLE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/applications/board': 'Applications Board',
  /** Short label — avoids “Applications Rew…” truncation in narrow shell chrome. */
  '/review': 'Review queue',
  '/assistant': 'Assistant',
  '/interview': 'Interview',
  '/warmup': 'Daily Warmup',
  '/coach': 'Coach',
  '/negotiation': 'Negotiation',
  '/profile': 'Profile',
  '/style-studio': 'Style Studio',
  '/settings': 'Settings',
  '/settings/community': 'Community Centre',
  '/security': 'Security, passkeys & 2FA',
  '/billing': 'Billing',
  '/skills': 'Skill Lab',
  '/radar': 'Job Radar',
  '/job-radar': 'Job Radar',
  '/salary': 'Salary Calculator',
  '/legal': 'Legal Hub',
  '/reports': 'Reports',
  '/auto-apply': 'Auto Apply',
  '/documents': 'Documents Upload',
  '/faq': 'FAQ',
  '/ai-analysis': 'AI Analysis',
  '/case-practice': 'Case Practice',
};

export function pageTitleForPath(pathname: string, search = ''): string {
  const pathOnly = pathname.split('?')[0] ?? pathname;
  const q = search.startsWith('?') ? search : search ? `?${search}` : '';
  const hasTab = (s: string) => new URLSearchParams(s.startsWith('?') ? s : `?${s}`).get('tab');
  if (pathOnly === '/settings' && hasTab(q) === 'privacy') return 'Community Centre';
  if (SHELL_PAGE_TITLE[pathOnly]) return SHELL_PAGE_TITLE[pathOnly];
  if (pathOnly.startsWith('/job-radar/scan/')) return 'Job Radar Scan';
  if (pathOnly.startsWith('/job-radar/report/')) return 'Job Radar Report';
  if (pathOnly.startsWith('/job-radar/admin/')) return 'Job Radar Admin';
  return 'Career Workspace';
}
