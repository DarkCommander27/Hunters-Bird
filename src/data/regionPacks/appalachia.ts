import appalachiaSpecies from './species/appalachia.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const APPALACHIA_PACK: RegionPackDefinition = {
  id: 'appalachia',
  name: 'Appalachia',
  description:
    'Birds of the Appalachian Mountains and surrounding highlands — forests, ridges, rivers, and meadows.',
  states: [
    'West Virginia',
    'Virginia',
    'Kentucky',
    'Tennessee',
    'North Carolina',
    'South Carolina',
    'Georgia',
    'Alabama',
    'Maryland',
    'Ohio',
    'Pennsylvania',
  ],
  version: '1.0.0',
  isDefault: true,
};

export const APPALACHIA_SPECIES = appalachiaSpecies as BirdSpecies[];