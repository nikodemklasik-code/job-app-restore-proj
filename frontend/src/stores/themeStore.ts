import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  focusMode: boolean;
  setTheme: (theme: Theme) => void;
  setFocusMode: (enabled: boolean) => void;
  initTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove('dark');
  if (theme === 'dark') root.classList.add('dark');
};

const resolveSaved = (raw: string | null): Theme => {
  if (raw === 'dark') return 'dark';
  return 'dark'; // default to dark
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
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
