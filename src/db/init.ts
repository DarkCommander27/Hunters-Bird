import { db } from './database';
import { DEFAULT_SETTINGS, DEFAULT_REGION_PACK_ID, installRegionPack, syncRegionPackCatalog } from '../lib/regionPacks';

/** Run once on first launch to populate initial data. */
export async function initializeDatabase(): Promise<void> {
  // Settings singleton
  const existing = await db.settings.get('singleton');
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  await syncRegionPackCatalog();

  const defaultSpeciesCount = await db.birdSpecies.where('regions').equals(DEFAULT_REGION_PACK_ID).count();
  const defaultPack = await db.regionPacks.get(DEFAULT_REGION_PACK_ID);
  if (!defaultPack?.downloadedAt || defaultSpeciesCount === 0) {
    await installRegionPack(DEFAULT_REGION_PACK_ID);
  }
}
