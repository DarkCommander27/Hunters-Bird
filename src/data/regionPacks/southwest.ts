import southwestSpecies from './species/southwest.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const SOUTHWEST_PACK: RegionPackDefinition = {
  id: 'southwest',
  name: 'Southwest',
  description: 'Desert and canyon birds of the American Southwest.',
  states: ['Texas', 'New Mexico', 'Arizona', 'Nevada', 'Utah'],
  version: '1.0.0',
};

export const SOUTHWEST_SPECIES = southwestSpecies as BirdSpecies[];