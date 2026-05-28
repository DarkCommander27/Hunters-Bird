import pacificCoastSpecies from './species/pacific-coast.json';
import type { BirdSpecies } from '../../types';
import type { RegionPackDefinition } from './types';

export const PACIFIC_COAST_PACK: RegionPackDefinition = {
  id: 'pacific-coast',
  name: 'Pacific Coast',
  description: 'Coastal and rainforest birds of the Pacific Northwest and California.',
  states: ['Washington', 'Oregon', 'California'],
  version: '1.0.0',
};

export const PACIFIC_COAST_SPECIES = pacificCoastSpecies as BirdSpecies[];