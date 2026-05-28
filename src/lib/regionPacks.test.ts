import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { getRegionPackSpecies } from '../data/seed';
import {
  DEFAULT_REGION_PACK_ID,
  DEFAULT_SETTINGS,
  installRegionPack,
  resetRegionPackData,
  syncRegionPackCatalog,
  uninstallRegionPack,
} from './regionPacks';

async function resetDatabaseState() {
  await db.delete();
  await db.open();
  await syncRegionPackCatalog();
  await db.settings.put(DEFAULT_SETTINGS);
  await installRegionPack(DEFAULT_REGION_PACK_ID);
}

describe('region pack helpers', () => {
  beforeEach(async () => {
    await resetDatabaseState();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('installs species data for a downloaded pack', async () => {
    const installed = await installRegionPack('northeast');
    const storedPack = await db.regionPacks.get('northeast');
    const species = await db.birdSpecies.where('regions').equals('northeast').toArray();
    const expectedSpeciesCount = getRegionPackSpecies('northeast').length;

    expect(installed.downloadedAt).toEqual(expect.any(Number));
    expect(storedPack?.downloadedAt).toEqual(expect.any(Number));
    expect(species).toHaveLength(expectedSpeciesCount);
  });

  it('removes a pack and its species without disturbing the default pack', async () => {
    await installRegionPack('northeast');
    await uninstallRegionPack('northeast');

    const removedPack = await db.regionPacks.get('northeast');
    const removedSpecies = await db.birdSpecies.where('regions').equals('northeast').toArray();
    const defaultSpecies = await db.birdSpecies.where('regions').equals(DEFAULT_REGION_PACK_ID).toArray();

    expect(removedPack?.downloadedAt).toBeUndefined();
    expect(removedSpecies).toHaveLength(0);
    expect(defaultSpecies.length).toBeGreaterThan(0);
  });

  it('resets downloaded packs back to the default region', async () => {
    await installRegionPack('northeast');
    await installRegionPack('southeast');

    await resetRegionPackData();

    const downloadedPacks = (await db.regionPacks.toArray()).filter((pack) => !!pack.downloadedAt);
    const northeastSpecies = await db.birdSpecies.where('regions').equals('northeast').toArray();
    const defaultSpecies = await db.birdSpecies.where('regions').equals(DEFAULT_REGION_PACK_ID).toArray();

    expect(downloadedPacks.map((pack) => pack.id)).toEqual([DEFAULT_REGION_PACK_ID]);
    expect(northeastSpecies).toHaveLength(0);
    expect(defaultSpecies.length).toBeGreaterThan(0);
  });
});