import { create } from 'zustand';

/** All colour themes; CSS tokens live in `index.css` (`.theme-*` + `dark`). */
export const THEME_IDS = [
  'dark',
  'light',
  'visually-impaired',
  'overstimulated',
  'gray-safe',
  'noir',
  'elegant',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/** @deprecated use ThemeId */
export type Theme = ThemeId;

export const THEME_CHOICES: { id: ThemeId; label: string; hint: string }[] = [
  { id: 'dark', label: 'Dark', hint: 'Deep navy with blue accents — default look.' },
  { id: 'light', label: 'Light', hint: 'Light surfaces for daytime use.' },
  {
    id: 'visually-impaired',
    label: 'High Contrast',
    hint: 'Yellow on black, larger controls — maximum contrast.',
  },
  {
    id: 'overstimulated',
    label: 'Calm',
    hint: 'Warm stone palette; softer motion in the theme layer.',
  },
  {
    id: 'gray-safe',
    label: 'Gray Safe',
    hint: 'Cool neutrals, low saturation, strong borders — gentle on eyes and colour perception.',
  },
  { id: 'noir', label: 'Noir', hint: 'Cinematic black & white, sharp geometry.' },
  { id: 'elegant', label: 'Elegant', hint: 'Cream, charcoal, muted gold accents.' },
];

const THEME_CLASSES = [
  'theme-visually-impaired',
  'theme-overstimulated',
  'theme-gray-safe',
  'theme-noir',
  'theme-elegant',
] as const;

/** Applies theme classes on `<html>`. Call on init and whenever the user switches theme. */
export function applyThemeToDocument(theme: ThemeId): void {
  const root = document.documentElement;
  for (const c of THEME_CLASSES) root.classList.remove(c);
  root.classList.remove('dark');

  switch (theme) {
    case 'dark':
      root.classList.add('dark');
      break;
    case 'light':
      break;
    case 'visually-impaired':
      root.classList.add('theme-visually-impaired');
      break;
    case 'overstimulated':
      root.classList.add('theme-overstimulated');
      break;
    case 'gray-safe':
      root.classList.add('theme-gray-safe');
      break;
    case 'noir':
      root.classList.add('dark', 'theme-noir');
      break;
    case 'elegant':
      root.classList.add('theme-elegant');
      break;
  }
}

function resolveSaved(raw: string | null): ThemeId {
  if (raw && (THEME_IDS as readonly string[]).includes(raw)) return raw as ThemeId;
  return 'dark';
}

interface ThemeStore {
  theme: ThemeId;
  focusMode: boolean;
  setTheme: (theme: ThemeId) => void;
  setFocusMode: (enabled: boolean) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  focusMode: false,

  setTheme: (theme) => {
    set({ theme });
    applyThemeToDocument(theme);
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
    applyThemeToDocument(saved);
  },
}));
