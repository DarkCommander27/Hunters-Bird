import { db } from './database';
import { AVAILABLE_REGION_PACKS, APPALACHIA_SPECIES } from '../data/seed';
import type { AppSettings } from '../types';

/** Run once on first launch to populate initial data. */
export async function initializeDatabase(): Promise<void> {
  // Settings singleton
  const existing = await db.settings.get('singleton');
  if (!existing) {
    const defaults: AppSettings = {
      id: 'singleton',
      gpsEnabled: true,
      darkMode: true,
      activeRegionPackId: 'appalachia',
      downloadedPackIds: ['appalachia'],
    };
    await db.settings.put(defaults);
  }

  // Seed region packs (upsert — safe to re-run)
  for (const pack of AVAILABLE_REGION_PACKS) {
    const stored = await db.regionPacks.get(pack.id);
    if (!stored) {
      // Mark Appalachia as pre-downloaded for the first run
      const record = pack.id === 'appalachia'
        ? { ...pack, downloadedAt: Date.now() }
        : pack;
      await db.regionPacks.put(record);
    }
  }

  // Seed Appalachia species
  for (const species of APPALACHIA_SPECIES) {
    const stored = await db.birdSpecies.get(species.id);
    if (!stored) {
      await db.birdSpecies.put(species);
    }
  }
}
