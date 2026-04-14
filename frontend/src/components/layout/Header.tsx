import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { api } from '@/lib/api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Profile & Goals',
  '/jobs':        'Job Listings',
  '/applications':'Applications',
  '/review':      'Applications Review',
  '/assistant':   'AI Assistant',
  '/interview':   'Interview',
  '/warmup':      'Daily Warmup',
  '/coach':       'Coach',
  '/negotiation': 'Negotiation',
  '/profile':     'Profile & CV',
  '/style-studio':'Style Studio',
  '/settings':    'Settings',
  '/security':    'Security',
  '/billing':     'Billing',
  '/skills':      'Skills Lab',
  '/radar':       'Job Radar',
  '/salary':      'Salary Calculator',
  '/legal':       'Legal Hub',
  '/reports':     'Reports',
  '/auto-apply':  'Auto Apply',
  '/documents':   'Document Lab',
  '/faq':         'FAQ',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useUser();
  const { theme, setTheme, focusMode, setFocusMode } = useThemeStore();
  const creditsQuery = api.billing.getCurrentPlan.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id, staleTime: 60_000 },
  );
  const credits = creditsQuery.data?.credits ?? null;

  const title = PAGE_TITLES[pathname] ?? 'Career Workspace';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {/* Focus mode sidebar toggle */}
        <button
          onClick={() => setFocusMode(!focusMode)}
          title={focusMode ? 'Show sidebar' : 'Focus mode — hide sidebar'}
          aria-label={focusMode ? 'Show sidebar' : 'Focus mode — hide sidebar'}
          aria-pressed={focusMode}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          {focusMode
            ? <PanelLeft className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>

        <div>
          <h1 className="font-display text-base font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-xs text-slate-400">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Credits pill */}
        {credits !== null && (
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            {credits.toLocaleString()} credits
          </div>
        )}

        {/* Theme toggle — light mode not yet ready, show dark only */}
        <div
          className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
          role="group"
          aria-label="Colour theme"
        >
          <button
            onClick={() => setTheme('light')}
            aria-label="Light theme (coming soon)"
            title="Light mode — coming soon"
            className="rounded-lg p-1.5 text-slate-300 opacity-40 cursor-not-allowed dark:text-slate-600"
            disabled
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            aria-label="Dark theme"
            aria-pressed={true}
            title="Dark"
            className="rounded-lg p-1.5 bg-slate-700 text-white shadow-sm transition-colors"
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
        </div>

        {displayName ? (
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
            {displayName}
          </span>
        ) : null}

        {/* Avatar */}
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={displayName || 'User'}
            className="h-8 w-8 rounded-full border-2 border-indigo-100 dark:border-indigo-900"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {(displayName[0] ?? user?.firstName?.[0] ?? 'U').toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
