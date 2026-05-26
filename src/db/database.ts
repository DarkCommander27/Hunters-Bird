import Dexie, { type Table } from 'dexie';
import type { RegionPack, BirdSpecies, PhotoAsset, Sighting, AppSettings } from '../types';

export class HuntersBirdDB extends Dexie {
  regionPacks!: Table<RegionPack, string>;
  birdSpecies!: Table<BirdSpecies, string>;
  photos!: Table<PhotoAsset, string>;
  sightings!: Table<Sighting, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('HuntersBirdDB');
    this.version(1).stores({
      regionPacks: 'id, name',
      birdSpecies: 'id, commonName, scientificName, family, order, *regions, *habitats',
      photos: 'id, createdAt',
      sightings: 'id, createdAt, speciesId, regionPackId, status',
      settings: 'id',
    });
  }
}

export const db = new HuntersBirdDB();
