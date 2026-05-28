import northeastSpecies from './species/northeast.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const NORTHEAST_PACK: RegionPackDefinition = {
  id: 'northeast',
  name: 'Northeast',
  description: 'Birds of New England and the mid-Atlantic states.',
  states: ['Maine', 'Vermont', 'New Hampshire', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'New Jersey', 'Delaware'],
  version: '1.0.0',
};

export const NORTHEAST_SPECIES = northeastSpecies as BirdSpecies[];