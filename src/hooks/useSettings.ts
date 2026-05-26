import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { AppSettings } from '../types';

const DEFAULTS: AppSettings = {
  id: 'singleton',
  gpsEnabled: true,
  darkMode: true,
  activeRegionPackId: 'appalachia',
  downloadedPackIds: ['appalachia'],
};

export function useSettings(): AppSettings {
  return useLiveQuery(() => db.settings.get('singleton'), [], DEFAULTS) ?? DEFAULTS;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
  const current = (await db.settings.get('singleton')) ?? DEFAULTS;
  await db.settings.put({ ...current, ...patch });
}
