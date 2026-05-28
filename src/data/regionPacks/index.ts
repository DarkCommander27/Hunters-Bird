import type { BirdSpecies, RegionPack } from '../../types';
import { APPALACHIA_PACK, APPALACHIA_SPECIES } from './appalachia';
import { GREAT_PLAINS_PACK, GREAT_PLAINS_SPECIES } from './greatPlains';
import { MIDWEST_PACK, MIDWEST_SPECIES } from './midwest';
import { NORTHEAST_PACK, NORTHEAST_SPECIES } from './northeast';
import { PACIFIC_COAST_PACK, PACIFIC_COAST_SPECIES } from './pacificCoast';
import { ROCKY_MOUNTAINS_PACK, ROCKY_MOUNTAINS_SPECIES } from './rockyMountains';
import { SOUTHEAST_PACK, SOUTHEAST_SPECIES } from './southeast';
import { SOUTHWEST_PACK, SOUTHWEST_SPECIES } from './southwest';
import type { RegionPackDefinition } from './types';

export { APPALACHIA_SPECIES } from './appalachia';
export { GREAT_PLAINS_SPECIES } from './greatPlains';
export { MIDWEST_SPECIES } from './midwest';
export { NORTHEAST_SPECIES } from './northeast';
export { PACIFIC_COAST_SPECIES } from './pacificCoast';
export { ROCKY_MOUNTAINS_SPECIES } from './rockyMountains';
export { SOUTHEAST_SPECIES } from './southeast';
export { SOUTHWEST_SPECIES } from './southwest';
export type { RegionPackDefinition } from './types';

export const REGION_PACK_DEFINITIONS: RegionPackDefinition[] = [
  APPALACHIA_PACK,
  NORTHEAST_PACK,
  SOUTHEAST_PACK,
  MIDWEST_PACK,
  GREAT_PLAINS_PACK,
  SOUTHWEST_PACK,
  ROCKY_MOUNTAINS_PACK,
  PACIFIC_COAST_PACK,
];

export const REGION_PACK_SPECIES: Record<string, BirdSpecies[]> = {
  appalachia: APPALACHIA_SPECIES,
  northeast: NORTHEAST_SPECIES,
  southeast: SOUTHEAST_SPECIES,
  midwest: MIDWEST_SPECIES,
  'great-plains': GREAT_PLAINS_SPECIES,
  southwest: SOUTHWEST_SPECIES,
  'rocky-mountains': ROCKY_MOUNTAINS_SPECIES,
  'pacific-coast': PACIFIC_COAST_SPECIES,
};

export const AVAILABLE_REGION_PACKS: RegionPack[] = REGION_PACK_DEFINITIONS.map((pack) => ({
  ...pack,
  speciesCount: REGION_PACK_SPECIES[pack.id]?.length ?? 0,
}));

export function getRegionPackDefinition(packId: string): RegionPack | undefined {
  return AVAILABLE_REGION_PACKS.find((pack) => pack.id === packId);
}

export function getRegionPackSpecies(packId: string): BirdSpecies[] {
  return REGION_PACK_SPECIES[packId] ?? [];
}