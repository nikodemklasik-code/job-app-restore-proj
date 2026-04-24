/**
 * English labels for shell chrome (header title; sidebar uses the same strings where listed).
 * One source of truth — keep in sync with canonical routes in `router.tsx` and `appScreens.ts`.
 */
export const SHELL_PAGE_TITLE: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/documents': 'Profile Documents',
  '/documents/upload': 'Document Intake',
  '/documents/style-studio': 'Style Studio',
  '/jobs': 'Jobs',
  '/applications': 'Applications',
  '/applications/board': 'Applications Board',
  '/applications-review': 'Applications Review',
  '/assistant': 'AI Assistant',
  '/warmup': 'Daily Warm-up',
  '/interview': 'Interview',
  '/coach': 'Coach',
  '/negotiation': 'Negotiation',
  '/case-study': 'Case Practice',
  '/skills': 'Skill Lab',
  '/job-radar': 'Job Radar',
  '/radar': 'Job Radar',
  '/reports': 'Reports',
  '/salary-calculator': 'Salary Calculator',
  '/salary': 'Salary Calculator',
  '/legal': 'Legal Hub',
  '/legal/search': 'Legal Search',
  '/community': 'Community Center',
  '/settings': 'Settings',
  '/settings/auto-apply': 'Auto Apply',
  '/security': 'Security, passkeys & 2FA',
  '/billing': 'Billing',
  '/faq': 'FAQ',
  '/ai-analysis': 'Reports',
  '/case-practice': 'Case Practice',
  '/style-studio': 'Style Studio',
  '/auto-apply': 'Auto Apply',
  '/review': 'Applications Review',
};

export function pageTitleForPath(pathname: string, search = ''): string {
  const pathOnly = pathname.split('?')[0] ?? pathname;
  const q = search.startsWith('?') ? search : search ? `?${search}` : '';
  const hasTab = (s: string) => new URLSearchParams(s.startsWith('?') ? s : `?${s}`).get('tab');

  if (pathOnly === '/documents') {
    const tab = hasTab(q);
    if (tab === 'build') return 'Style Studio';
    return 'Profile Documents';
  }

  if (pathOnly === '/settings' && hasTab(q) === 'auto-apply') return 'Auto Apply';
  if (SHELL_PAGE_TITLE[pathOnly]) return SHELL_PAGE_TITLE[pathOnly];
  if (pathOnly.startsWith('/job-radar/scan/')) return 'Job Radar Scan';
  if (pathOnly.startsWith('/job-radar/report/')) return 'Job Radar Report';
  if (pathOnly.startsWith('/job-radar/admin/')) return 'Job Radar Admin';
  return 'Career Workspace';
}
