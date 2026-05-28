import type { RegionPack } from '../../types';

export type RegionPackDefinition = Omit<RegionPack, 'speciesCount' | 'downloadedAt'>;