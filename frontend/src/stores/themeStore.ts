import { create } from 'zustand';

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

export function applyThemeToDocument(theme: ThemeId, focusMode: boolean = false): void {
  const root = document.documentElement;
  
  // Czyszczenie poprzednich klas
  for (const c of THEME_CLASSES) root.classList.remove(c);
  root.classList.remove('dark');
  root.classList.remove('theme-focus'); // Kluczowa naprawa!

  // Aplikowanie głównego motywu
  switch (theme) {
    case 'dark':
      root.classList.add('dark');
      break;
    case 'light':
      // 'light' polega na braku klas ciemnych
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

  // Nałożenie trybu skupienia jako nadrzędnej warstwy, jeśli aktywny
  if (focusMode) {
    root.classList.add('theme-focus');
  }
}

function resolveSaved(raw: string | null): ThemeId {
  if (raw && (THEME_IDS as readonly string[]).includes(raw as any)) return raw as ThemeId;
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
    const saved = resolveSaved(localStorage.getItem('theme'));
    const savedFocusMode = localStorage.getItem('focusMode') === '1';
    set({ theme: saved, focusMode: savedFocusMode });
    applyThemeToDocument(saved, savedFocusMode);
  },
}));
