import midwestSpecies from './species/midwest.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const MIDWEST_PACK: RegionPackDefinition = {
  id: 'midwest',
  name: 'Midwest',
  description: 'Birds of the Great Lakes region and inland waterways.',
  states: ['Michigan', 'Wisconsin', 'Minnesota', 'Indiana', 'Illinois', 'Iowa', 'Missouri'],
  version: '1.0.0',
};

export const MIDWEST_SPECIES = midwestSpecies as BirdSpecies[];