import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'visually-impaired' | 'overstimulated' | 'noir' | 'elegant';

interface ThemeStore {
  theme: Theme;
  focusMode: boolean;
  setTheme: (theme: Theme) => void;
  setFocusMode: (enabled: boolean) => void;
  initTheme: () => void;
}

const DARK_THEMES: Theme[] = ['dark', 'visually-impaired', 'noir'];

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Remove all theme and dark classes first
  root.classList.remove(
    'dark',
    'theme-visually-impaired',
    'theme-overstimulated',
    'theme-noir',
    'theme-elegant',
  );

  // Dark themes get the 'dark' class so Tailwind dark: utilities engage
  if (DARK_THEMES.includes(theme)) {
    root.classList.add('dark');
  }

  // Non-standard themes get their own override class
  if (theme !== 'light' && theme !== 'dark') {
    root.classList.add(`theme-${theme}`);
  }
  // 'light' → no classes, :root vars apply
  // 'dark'  → just 'dark' class, .dark vars apply (granatowy navy)
};

const VALID_THEMES: Theme[] = ['light', 'dark', 'visually-impaired', 'overstimulated', 'noir', 'elegant'];

/** Migrate legacy theme names from previous versions */
const resolveSaved = (raw: string | null): Theme => {
  if (!raw) return 'light';
  if ((VALID_THEMES as string[]).includes(raw)) return raw as Theme;
  // Legacy → new mapping
  const legacyMap: Record<string, Theme> = {
    system: 'light',
    navy: 'dark',
    'high-contrast': 'visually-impaired',
    neurodiversity: 'overstimulated',
    focus: 'overstimulated',
    sky: 'light',
  };
  return legacyMap[raw] ?? 'light';
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',
  focusMode: false,

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  },

  setFocusMode: (enabled) => {
    set({ focusMode: enabled });
    localStorage.setItem('focusMode', enabled ? '1' : '0');
  },

  initTheme: () => {
    const saved = resolveSaved(localStorage.getItem('theme'));
    const savedFocusMode = localStorage.getItem('focusMode') === '1';
    set({ theme: saved, focusMode: savedFocusMode });
    applyTheme(saved);
  },
}));
