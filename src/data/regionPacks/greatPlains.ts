import greatPlainsSpecies from './species/great-plains.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const GREAT_PLAINS_PACK: RegionPackDefinition = {
  id: 'great-plains',
  name: 'Great Plains',
  description: 'Grassland and prairie birds of the central United States.',
  states: ['Nebraska', 'Kansas', 'Oklahoma', 'South Dakota', 'North Dakota'],
  version: '1.0.0',
};

export const GREAT_PLAINS_SPECIES = greatPlainsSpecies as BirdSpecies[];