import southeastSpecies from './species/southeast.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const SOUTHEAST_PACK: RegionPackDefinition = {
  id: 'southeast',
  name: 'Southeast',
  description: 'Birds of the coastal plains and piedmont of the Southeast.',
  states: ['Florida', 'Mississippi', 'Louisiana', 'Arkansas'],
  version: '1.0.0',
};

export const SOUTHEAST_SPECIES = southeastSpecies as BirdSpecies[];