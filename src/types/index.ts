// ─── Core Data Types ──────────────────────────────────────────────────────────

export interface RegionPack {
  id: string;
  name: string;
  description: string;
  states: string[];
  speciesCount: number;
  version: string;
  downloadedAt?: number; // timestamp; undefined = not downloaded
  isDefault?: boolean;
}

export interface BirdSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  order: string;
  family: string;
  habitats: string[];
  regions: string[]; // region pack ids
  states: string[];
  seasonality: ('spring' | 'summer' | 'fall' | 'winter' | 'year-round')[];
  aliases: string[];
  description?: string;
  thumbnailUrl?: string;
}

export interface PhotoAsset {
  id: string;
  blob: Blob;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface INaturalistTaxonSummary {
  taxonId: number;
  taxonUrl: string;
  scientificName: string;
  preferredCommonName?: string;
  observationsCount: number;
  wikipediaUrl?: string;
  photoMediumUrl?: string;
  photoSquareUrl?: string;
  photoAttribution?: string;
  matchedTerm?: string;
}

export interface INaturalistTaxonCacheEntry extends INaturalistTaxonSummary {
  cacheKey: string;
  cachedAt: number;
  photoBlob?: Blob;
  photoMimeType?: string;
  photoSource?: 'medium' | 'square';
}

export interface Sighting {
  id: string;
  speciesId?: string;             // undefined = unknown/unidentified
  speciesNameSnapshot?: string;   // snapshot of name at save time
  photoId?: string;
  createdAt: number;
  latitude?: number;
  longitude?: number;
  regionPackId?: string;
  habitatsSnapshot: string[];
  notes: string;
  weather?: string;
  birdCount: number;
  identificationConfidence?: number; // 0–1
  identificationSource?: 'ai' | 'manual' | 'unknown';
  identificationRationale?: string[];
  identificationTaxon?: INaturalistTaxonSummary;
  identificationAlternatives?: Array<{
    speciesId: string;
    speciesName: string;
    confidence: number;
    rationale: string[];
  }>;
  confirmedByUser: boolean;
  status: 'confirmed' | 'unknown' | 'pending';
}

export interface AppSettings {
  id: 'singleton';
  gpsEnabled: boolean;
  darkMode: boolean;
  activeRegionPackId?: string;
  downloadedPackIds: string[];
}

export interface AiIdentificationProvider {
  id: string;
  label: string;
  mode: 'demo-local' | 'remote';
  enabled: boolean;
  description: string;
}

export interface SerializedPhotoAsset {
  id: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: number;
  dataUrl: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  sightings: Sighting[];
  photos: SerializedPhotoAsset[];
  settings?: AppSettings;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export type NavSection =
  | 'home'
  | 'regions'
  | 'bird-guide'
  | 'add-sighting'
  | 'sightings'
  | 'life-list'
  | 'settings';
