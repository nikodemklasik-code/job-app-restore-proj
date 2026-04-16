/**
 * Canonical English **Title Case** for shell chrome (header title + sidebar labels).
 * One source of truth — keep in sync with `router.tsx` paths.
 */
export const SHELL_PAGE_TITLE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/applications/board': 'Applications Board',
  '/review': 'Applications Review',
  '/assistant': 'Assistant',
  '/interview': 'Interview',
  '/warmup': 'Daily Warmup',
  '/coach': 'Coach',
  '/negotiation': 'Negotiation',
  '/profile': 'Profile',
  '/style-studio': 'Style Studio',
  '/settings': 'Settings',
  '/security': 'Security & Passkeys',
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
};

export function pageTitleForPath(pathname: string): string {
  if (SHELL_PAGE_TITLE[pathname]) return SHELL_PAGE_TITLE[pathname];
  if (pathname.startsWith('/job-radar/scan/')) return 'Job Radar Scan';
  if (pathname.startsWith('/job-radar/report/')) return 'Job Radar Report';
  if (pathname.startsWith('/job-radar/admin/')) return 'Job Radar Admin';
  return 'Career Workspace';
}
