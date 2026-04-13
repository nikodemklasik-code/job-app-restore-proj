import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Sun, Anchor, Eye, Leaf, Film, Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { api } from '@/lib/api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs Discovery',
  '/applications': 'Applications Pipeline',
  '/review': 'Review Queue',
  '/assistant': 'AI Career Assistant',
  '/interview': 'Interview Ready',
  '/profile': 'Profile & CV',
  '/style-studio': 'Style Studio',
  '/settings': 'Settings',
  '/security': 'Security & Passkeys',
  '/billing': 'Billing & Credits',
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

  const standardThemes = [
    { id: 'light' as const,  Icon: Sun,    label: 'Jasny (Light)' },
    { id: 'dark' as const,   Icon: Anchor, label: 'Granatowy (Dark Navy)' },
  ];

  const specThemes = [
    { id: 'visually-impaired' as const, Icon: Eye,      label: 'Słabowidzący (High Contrast)' },
    { id: 'overstimulated' as const,    Icon: Leaf,     label: 'Przebodźcowany (Calm Stone)' },
    { id: 'noir' as const,              Icon: Film,     label: 'Noir (Cinematic)' },
    { id: 'elegant' as const,           Icon: Sparkles, label: 'Elegancki (Gold Cream)' },
  ];

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

        {/* Standard theme toggle */}
        <div
          className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
          role="group"
          aria-label="Colour theme"
        >
          {standardThemes.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              aria-label={label}
              aria-pressed={theme === id}
              className={`rounded-lg p-1.5 transition-colors ${
                theme === id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Spec theme toggle */}
        <div
          className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
          role="group"
          aria-label="Visual theme"
        >
          {specThemes.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              aria-label={label}
              aria-pressed={theme === id}
              className={`rounded-lg p-1.5 transition-colors ${
                theme === id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
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
