import Dexie, { type Table } from 'dexie';
import type { RegionPack, BirdSpecies, PhotoAsset, Sighting, AppSettings, INaturalistTaxonCacheEntry } from '../types';

export class HuntersBirdDB extends Dexie {
  regionPacks!: Table<RegionPack, string>;
  birdSpecies!: Table<BirdSpecies, string>;
  photos!: Table<PhotoAsset, string>;
  sightings!: Table<Sighting, string>;
  settings!: Table<AppSettings, string>;
  inaturalistTaxa!: Table<INaturalistTaxonCacheEntry, number>;

  constructor() {
    super('HuntersBirdDB');
    this.version(1).stores({
      regionPacks: 'id, name',
      birdSpecies: 'id, commonName, scientificName, family, order, *regions, *habitats',
      photos: 'id, createdAt',
      sightings: 'id, createdAt, speciesId, regionPackId, status',
      settings: 'id',
    });

    this.version(2).stores({
      regionPacks: 'id, name',
      birdSpecies: 'id, commonName, scientificName, family, order, *regions, *habitats',
      photos: 'id, createdAt',
      sightings: 'id, createdAt, speciesId, regionPackId, status',
      settings: 'id',
      inaturalistTaxa: 'taxonId, cacheKey, scientificName, preferredCommonName, cachedAt',
    });
  }
}

export const db = new HuntersBirdDB();
