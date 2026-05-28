import { db } from '../db/database';
import { AVAILABLE_REGION_PACKS, getRegionPackDefinition, getRegionPackSpecies } from '../data/seed';
import type { AppSettings, RegionPack } from '../types';

export const DEFAULT_REGION_PACK_ID = 'appalachia';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  gpsEnabled: true,
  darkMode: true,
  activeRegionPackId: DEFAULT_REGION_PACK_ID,
  downloadedPackIds: [DEFAULT_REGION_PACK_ID],
};

function requireRegionPack(packId: string): RegionPack {
  const pack = getRegionPackDefinition(packId);
  if (!pack) {
    throw new Error(`Unknown region pack: ${packId}`);
  }

  return pack;
}

export function hasRegionPackPayload(packId: string): boolean {
  return getRegionPackSpecies(packId).length > 0;
}

export function getDownloadedFallbackRegionPackId(downloadedPackIds: string[]): string | undefined {
  if (downloadedPackIds.includes(DEFAULT_REGION_PACK_ID)) {
    return DEFAULT_REGION_PACK_ID;
  }

  return downloadedPackIds[0];
}

export async function syncRegionPackCatalog(): Promise<void> {
  const storedPacks = await db.regionPacks.toArray();

  await db.transaction('rw', db.regionPacks, async () => {
    await Promise.all(AVAILABLE_REGION_PACKS.map(async (pack) => {
      const stored = storedPacks.find((candidate) => candidate.id === pack.id);
      await db.regionPacks.put(stored?.downloadedAt ? { ...pack, downloadedAt: stored.downloadedAt } : pack);
    }));
  });
}

export async function installRegionPack(packId: string): Promise<RegionPack> {
  const pack = requireRegionPack(packId);
  const species = getRegionPackSpecies(packId);

  if (species.length === 0) {
    throw new Error(`${pack.name} does not have species data yet.`);
  }

  const record = { ...pack, downloadedAt: Date.now() };

  await db.transaction('rw', db.regionPacks, db.birdSpecies, async () => {
    await db.regionPacks.put(record);
    await db.birdSpecies.bulkPut(species);
  });

  return record;
}

export async function uninstallRegionPack(packId: string): Promise<void> {
  if (packId === DEFAULT_REGION_PACK_ID) {
    throw new Error('The default region pack cannot be removed.');
  }

  const pack = requireRegionPack(packId);
  const removableSpecies = getRegionPackSpecies(packId);

  await db.transaction('rw', db.regionPacks, db.birdSpecies, async () => {
    const remainingDownloadedPackIds = (await db.regionPacks.toArray())
      .filter((candidate) => candidate.id !== packId && !!candidate.downloadedAt)
      .map((candidate) => candidate.id);

    const removableIds = removableSpecies
      .filter((species) => !species.regions.some((regionId) => remainingDownloadedPackIds.includes(regionId)))
      .map((species) => species.id);

    if (removableIds.length > 0) {
      await db.birdSpecies.bulkDelete(removableIds);
    }

    await db.regionPacks.put(pack);
  });
}

export async function resetRegionPackData(): Promise<void> {
  const defaultPack = requireRegionPack(DEFAULT_REGION_PACK_ID);
  const defaultSpecies = getRegionPackSpecies(DEFAULT_REGION_PACK_ID);

  await db.transaction('rw', db.regionPacks, db.birdSpecies, async () => {
    await db.regionPacks.clear();
    await db.regionPacks.bulkPut(AVAILABLE_REGION_PACKS);
    await db.regionPacks.put({ ...defaultPack, downloadedAt: Date.now() });
    await db.birdSpecies.clear();
    await db.birdSpecies.bulkPut(defaultSpecies);
  });
}