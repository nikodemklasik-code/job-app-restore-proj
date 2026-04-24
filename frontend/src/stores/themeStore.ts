import { create } from 'zustand';

export const THEME_IDS = [
  'soft-dark',
  'soft-light',
  'calm-blue',
  'sage',
  'warm-sand',
  'accessible-contrast',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_CHOICES: { id: ThemeId; label: string; hint: string }[] = [
  { id: 'soft-dark', label: 'Soft Dark', hint: 'Deep slate without pure black; calmer for bright-light sensitivity.' },
  { id: 'soft-light', label: 'Soft Light', hint: 'Warm off-white surfaces with gentle contrast for everyday use.' },
  { id: 'calm-blue', label: 'Calm Blue', hint: 'Cool blue-grey palette for focus, structure and reduced visual noise.' },
  { id: 'sage', label: 'Sage', hint: 'Muted green and stone tones for a softer, steadier workspace.' },
  { id: 'warm-sand', label: 'Warm Sand', hint: 'Warm beige palette for users who find cold UI tiring.' },
  { id: 'accessible-contrast', label: 'Accessible Contrast', hint: 'Clearer separation and stronger focus states without yellow-on-black glare.' },
];

const THEME_CLASSES = [
  'theme-soft-dark',
  'theme-soft-light',
  'theme-calm-blue',
  'theme-sage',
  'theme-warm-sand',
  'theme-accessible-contrast',
  'theme-visually-impaired',
  'theme-overstimulated',
  'theme-gray-safe',
  'theme-noir',
  'theme-elegant',
] as const;

function normalizeThemeId(raw: string | null): ThemeId {
  if (raw && (THEME_IDS as readonly string[]).includes(raw)) return raw as ThemeId;
  if (raw === 'light') return 'soft-light';
  if (raw === 'dark' || raw === 'navy') return 'soft-dark';
  if (raw === 'visually-impaired' || raw === 'high-contrast' || raw === 'noir') return 'accessible-contrast';
  if (raw === 'overstimulated' || raw === 'elegant' || raw === 'neurodiversity') return 'warm-sand';
  if (raw === 'gray-safe' || raw === 'sky') return 'calm-blue';
  return 'soft-dark';
}

export function applyThemeToDocument(theme: ThemeId, focusMode: boolean = false): void {
  const root = document.documentElement;
  for (const c of THEME_CLASSES) root.classList.remove(c);
  root.classList.remove('dark');
  root.classList.remove('theme-focus');

  if (theme === 'soft-dark') root.classList.add('dark', 'theme-soft-dark');
  if (theme === 'soft-light') root.classList.add('theme-soft-light');
  if (theme === 'calm-blue') root.classList.add('theme-calm-blue');
  if (theme === 'sage') root.classList.add('theme-sage');
  if (theme === 'warm-sand') root.classList.add('theme-warm-sand');
  if (theme === 'accessible-contrast') root.classList.add('dark', 'theme-accessible-contrast');
  if (focusMode) root.classList.add('theme-focus');
}

interface ThemeStore {
  theme: ThemeId;
  focusMode: boolean;
  setTheme: (theme: ThemeId) => void;
  setFocusMode: (enabled: boolean) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'soft-dark',
  focusMode: false,

  setTheme: (theme) => {
    set((state) => {
      applyThemeToDocument(theme, state.focusMode);
      localStorage.setItem('theme', theme);
      return { theme };
    });
  },

  setFocusMode: (enabled) => {
    set((state) => {
      applyThemeToDocument(state.theme, enabled);
      localStorage.setItem('focusMode', enabled ? '1' : '0');
      return { focusMode: enabled };
    });
  },

  initTheme: () => {
    const saved = normalizeThemeId(localStorage.getItem('theme'));
    const savedFocusMode = localStorage.getItem('focusMode') === '1';
    localStorage.setItem('theme', saved);
    set({ theme: saved, focusMode: savedFocusMode });
    applyThemeToDocument(saved, savedFocusMode);
  },
}));
