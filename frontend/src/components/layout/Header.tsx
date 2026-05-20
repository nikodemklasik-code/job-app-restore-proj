import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  AlertTriangle,
  Coins,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Glasses,
  Leaf,
  Sparkles,
  Contrast,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useThemeStore, THEME_CHOICES, type ThemeId } from '@/stores/themeStore';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/lib/api';
import { pageTitleForPath } from '@/lib/navigationCopy';

const THEME_ICONS: Record<ThemeId, typeof Moon> = {
  'soft-dark': Moon,
  'soft-light': Sun,
  'calm-blue': Contrast,
  sage: Leaf,
  'warm-sand': Sparkles,
  'accessible-contrast': Glasses,
};

const NEUTRAL_HEADER_THEMES: ThemeId[] = ['soft-light', 'calm-blue', 'sage', 'warm-sand'];

export default function Header() {
  const { pathname, search } = useLocation();
  const { user } = useUser();
  const { theme, setTheme, focusMode, setFocusMode } = useThemeStore();
  const creditsQuery = api.billing.getAccountState.useQuery(
    { userId: user?.id ?? '' },
    { enabled: !!user?.id, staleTime: 30_000, retry: 1 },
  );
  const spendableTotal = creditsQuery.data?.spendableTotal ?? null;
  const allowanceRemaining = creditsQuery.data?.allowance.remaining ?? null;
  const paidCredits = creditsQuery.data?.credits ?? null;
  const lowBalance = typeof spendableTotal === 'number' && spendableTotal > 0 && spendableTotal <= 10;
  const zeroBalance = spendableTotal === 0;

  const title = pageTitleForPath(pathname, search);
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '';

  const activeTheme = useMemo(() => THEME_CHOICES.find((t) => t.id === theme), [theme]);
  const ThemeIcon = THEME_ICONS[theme];
  const neutralHeader = NEUTRAL_HEADER_THEMES.includes(theme);

  return (
    <header
      className={clsx(
        'flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur-md',
        neutralHeader
          ? 'border-slate-300/80 bg-white/95 shadow-[inset_0_-1px_0_0_hsl(220_10%_88%/0.65)]'
          : 'border-slate-100 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80',
      )}
    >
      <div className="flex items-center gap-3">
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

        <div className="min-w-0 flex-1 pr-2">
          <h1 className="font-display text-balance break-words text-base font-semibold leading-snug text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs text-slate-400">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user?.id && (
          <div className="flex items-center gap-2">
            <div
              title={creditsQuery.isError ? creditsQuery.error.message : spendableTotal === null ? 'Loading credits' : `${allowanceRemaining ?? 0} allowance + ${paidCredits ?? 0} paid credits`}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                creditsQuery.isError || zeroBalance
                  ? 'bg-red-500/15 text-red-200 ring-1 ring-red-400/30'
                  : lowBalance
                    ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
                    : neutralHeader
                      ? 'bg-slate-200/90 text-slate-800 ring-1 ring-slate-300/70'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
              )}
            >
              {creditsQuery.isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : creditsQuery.isError || zeroBalance || lowBalance ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Coins className="h-3.5 w-3.5" />
              )}
              {creditsQuery.isLoading
                ? 'Loading credits'
                : creditsQuery.isError
                  ? 'Credits unavailable'
                  : spendableTotal === 0
                    ? '0 credits'
                    : `${(spendableTotal ?? 0).toLocaleString()} credits`}
            </div>
            {lowBalance || zeroBalance ? (
              <div className="hidden items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 lg:flex">
                <AlertTriangle className="h-3.5 w-3.5" />
                {zeroBalance ? 'No credits' : 'Low balance'}
              </div>
            ) : null}
          </div>
        )}

        <div className="w-[10.75rem] shrink-0 sm:w-[11.25rem]">
          <Select value={theme} onValueChange={(v) => setTheme(v as ThemeId)}>
            <SelectTrigger
              aria-label="Colour theme"
              className={clsx(
                '!h-9 min-h-0 rounded-xl px-2.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition-[box-shadow,transform] hover:shadow-md',
                neutralHeader
                  ? 'border-slate-300/90 bg-gradient-to-b from-white to-slate-100/90 text-slate-800 ring-1 ring-slate-400/25 hover:ring-slate-400/40'
                  : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 text-slate-800 ring-1 ring-slate-900/5 hover:ring-slate-900/10 dark:border-slate-600/90 dark:from-slate-800 dark:to-slate-900/95 dark:text-slate-100 dark:ring-white/10 dark:hover:ring-white/15',
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span
                  className={clsx(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    neutralHeader
                      ? 'bg-slate-200/90 text-slate-700'
                      : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300',
                  )}
                >
                  <ThemeIcon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="truncate">{activeTheme?.label ?? 'Theme'}</span>
              </span>
            </SelectTrigger>
            <SelectContent className="z-[100] overflow-hidden rounded-xl border-slate-200/95 py-1 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-600 dark:ring-white/10">
              {THEME_CHOICES.map((t) => {
                const Icon = THEME_ICONS[t.id];
                return (
                  <SelectItem key={t.id} value={t.id} className="!items-start gap-0 px-2.5 py-2 text-left">
                    <span className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5 text-left">
                        <span className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">
                          {t.label}
                        </span>
                        <span className="line-clamp-2 text-[11px] font-normal leading-snug text-slate-500 dark:text-slate-400">
                          {t.hint}
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {displayName ? (
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
            {displayName}
          </span>
        ) : null}

        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={displayName || 'User'}
            className={clsx(
              'h-8 w-8 rounded-full border-2',
              neutralHeader ? 'border-slate-300' : 'border-indigo-100 dark:border-indigo-900',
            )}
          />
        ) : (
          <div
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
              neutralHeader ? 'bg-slate-600' : 'bg-indigo-600',
            )}
          >
            {(displayName[0] ?? user?.firstName?.[0] ?? 'U').toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
