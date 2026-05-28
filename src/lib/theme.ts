import type { AppSettings, AppTheme } from '../types';

export const APP_THEME_OPTIONS: Array<{
  id: AppTheme;
  label: string;
  description: string;
  badge: string;
}> = [
  {
    id: 'forest',
    label: 'Classic Field',
    description: 'The original rugged layout for trail notes, region packs, and life list logging.',
    badge: 'Default',
  },
  {
    id: 'pokedex',
    label: 'Pokedex',
    description: 'A retro red handheld-style shell for showing birds like a field index.',
    badge: 'Optional',
  },
];

export function applyThemeToDocument(settings: Pick<AppSettings, 'darkMode' | 'theme'>): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', settings.darkMode);
  root.classList.toggle('light', !settings.darkMode);
  root.classList.remove('theme-forest', 'theme-pokedex');
  root.classList.add(settings.theme === 'pokedex' ? 'theme-pokedex' : 'theme-forest');
}