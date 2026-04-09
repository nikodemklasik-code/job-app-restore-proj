import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

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
  const { theme, setTheme } = useThemeStore();

  const title = PAGE_TITLES[pathname] ?? 'Career Workspace';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div>
        <h1 className="font-display text-base font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-400">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Credits pill */}
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          1,250 credits
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {(['light', 'system', 'dark'] as const).map((t) => {
            const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg p-1.5 transition-colors ${
                  theme === t
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title={t}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
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
