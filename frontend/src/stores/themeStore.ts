import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
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
