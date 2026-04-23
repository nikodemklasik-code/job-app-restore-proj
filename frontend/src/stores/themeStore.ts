import { create } from 'zustand';

/** Wszystkie dostępne motywy kolorystyczne */
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

/** @deprecated Używaj `ThemeId` */
export type Theme = ThemeId;

/** Gotowe opcje do wyboru w UI */
export const THEME_CHOICES: { id: ThemeId; label: string; hint: string }[] = [
  { id: 'dark', label: 'Dark', hint: 'Głęboki granat z niebieskimi akcentami — domyślny wygląd.' },
  { id: 'light', label: 'Light', hint: 'Jasny motyw na dzień.' },
  {
    id: 'visually-impaired',
    label: 'High Contrast',
    hint: 'Żółty na czarnym, duże elementy — maksymalny kontrast.',
  },
  {
    id: 'overstimulated',
    label: 'Calm',
    hint: 'Ciepła paleta kamieni; delikatniejsze animacje.',
  },
  {
    id: 'gray-safe',
    label: 'Gray Safe',
    hint: 'Chłodne neutrale, niska saturacja, wyraźne obramowania.',
  },
  { id: 'noir', label: 'Noir', hint: 'Filmowy czarno-biały, ostre geometryczne kształty.' },
  { id: 'elegant', label: 'Elegant', hint: 'Krem, grafit, stonowane złoto.' },
];

const THEME_CLASSES = [
  'theme-visually-impaired',
  'theme-overstimulated',
  'theme-gray-safe',
  'theme-noir',
  'theme-elegant',
] as const;

/** Nakłada klasy motywu na `<html>` */
export function applyThemeToDocument(theme: ThemeId): void {
  const root = document.documentElement;

  // Usuwamy wszystkie dodatkowe klasy tematyczne
  THEME_CLASSES.forEach((c) => root.classList.remove(c));
  root.classList.remove('dark');

  switch (theme) {
    case 'dark':
      root.classList.add('dark');
      break;
    case 'light':
      // light = brak dark + brak theme-*
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
  if (raw && (THEME_IDS as readonly string[]).includes(raw)) {
    return raw as ThemeId;
  }
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
