import rockyMountainsSpecies from './species/rocky-mountains.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const ROCKY_MOUNTAINS_PACK: RegionPackDefinition = {
  id: 'rocky-mountains',
  name: 'Rocky Mountains',
  description: 'High-altitude birds of the Rockies and intermountain west.',
  states: ['Colorado', 'Wyoming', 'Montana', 'Idaho'],
  version: '1.0.0',
};

export const ROCKY_MOUNTAINS_SPECIES = rockyMountainsSpecies as BirdSpecies[];