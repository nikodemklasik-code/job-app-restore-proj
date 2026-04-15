import { create } from 'zustand';

<<<<<<< HEAD
export type Theme = 'light' | 'dark';
=======
type Theme = 'light' | 'dark' | 'system' | 'neurodiversity' | 'high-contrast' | 'focus' | 'sky' | 'navy';
>>>>>>> live-hardening

interface ThemeStore {
  theme: Theme;
  focusMode: boolean;
  setTheme: (theme: Theme) => void;
  setFocusMode: (enabled: boolean) => void;
  initTheme: () => void;
}

<<<<<<< HEAD
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

  setTheme: (_theme) => {
    // Light mode not yet ready — force dark
    const resolved: Theme = 'dark';
    set({ theme: resolved });
    applyTheme(resolved);
    localStorage.setItem('theme', resolved);
=======
const THEME_CLASSES: Theme[] = ['light', 'dark', 'system', 'neurodiversity', 'high-contrast', 'focus', 'sky', 'navy'];

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
  } else if (theme !== 'light') {
    root.classList.add(`theme-${theme}`);
  }
  // 'light' — no classes needed, default CSS vars apply
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  focusMode: false,

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    localStorage.setItem('theme', theme);
>>>>>>> live-hardening
  },

  setFocusMode: (enabled) => {
    set({ focusMode: enabled });
    localStorage.setItem('focusMode', enabled ? '1' : '0');
  },

  initTheme: () => {
<<<<<<< HEAD
    const saved = resolveSaved(localStorage.getItem('theme'));
=======
    const saved = (localStorage.getItem('theme') as Theme | null) ?? 'system';
>>>>>>> live-hardening
    const savedFocusMode = localStorage.getItem('focusMode') === '1';
    set({ theme: saved, focusMode: savedFocusMode });
    applyTheme(saved);
  },
}));
