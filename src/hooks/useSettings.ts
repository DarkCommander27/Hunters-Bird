import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../lib/regionPacks';

const DEFAULTS: AppSettings = DEFAULT_SETTINGS;

export function normalizeAppSettings(settings?: Partial<AppSettings> | null): AppSettings {
  return {
    ...DEFAULTS,
    ...settings,
    id: 'singleton',
  };
}

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get('singleton'), [], DEFAULTS);
  return normalizeAppSettings(settings);
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
  const current = normalizeAppSettings(await db.settings.get('singleton'));
  await db.settings.put(normalizeAppSettings({ ...current, ...patch }));
}
