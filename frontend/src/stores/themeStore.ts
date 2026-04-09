import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system' | 'neurodiversity' | 'high-contrast' | 'focus';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const THEME_CLASSES: Theme[] = ['light', 'dark', 'system', 'neurodiversity', 'high-contrast', 'focus'];

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Remove all theme classes first
  THEME_CLASSES.forEach((t) => {
    root.classList.remove(t === 'dark' ? 'dark' : `theme-${t}`);
  });
  root.classList.remove('dark');

  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  } else if (theme === 'neurodiversity' || theme === 'high-contrast' || theme === 'focus') {
    root.classList.add(`theme-${theme}`);
  }
  // 'light' — no classes needed, default CSS vars apply
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  },

  initTheme: () => {
    const saved = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    set({ theme: saved });
    applyTheme(saved);
  },
}));
