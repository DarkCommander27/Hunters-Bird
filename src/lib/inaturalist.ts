import { db } from '../db/database';
import type { BirdSpecies, INaturalistTaxonCacheEntry, INaturalistTaxonSummary } from '../types';

const INAT_API_BASE = 'https://api.inaturalist.org/v1';
const inaturalistRequestCache = new Map<string, Promise<INaturalistTaxonSummary | null>>();
const inaturalistMemoryCacheByKey = new Map<string, INaturalistTaxonCacheEntry>();
const inaturalistMemoryCacheById = new Map<number, INaturalistTaxonCacheEntry>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeTaxonName(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function cacheKeyForSpecies(species: BirdSpecies): string {
  return `${normalizeTaxonName(species.scientificName)}|${normalizeTaxonName(species.commonName)}`;
}

export function toINaturalistTaxonSummary(result: Record<string, unknown>): INaturalistTaxonSummary | null {
  const id = typeof result.id === 'number' ? result.id : undefined;
  const name = typeof result.name === 'string' ? result.name : undefined;
  if (!id || !name) return null;

  const defaultPhoto = isRecord(result.default_photo) ? result.default_photo : undefined;
  return {
    taxonId: id,
    taxonUrl: `https://www.inaturalist.org/taxa/${id}`,
    scientificName: name,
    preferredCommonName: typeof result.preferred_common_name === 'string' ? result.preferred_common_name : undefined,
    observationsCount: typeof result.observations_count === 'number' ? result.observations_count : 0,
    wikipediaUrl: typeof result.wikipedia_url === 'string' ? result.wikipedia_url : undefined,
    photoMediumUrl: defaultPhoto && typeof defaultPhoto.medium_url === 'string' ? defaultPhoto.medium_url : undefined,
    photoSquareUrl: defaultPhoto && typeof defaultPhoto.square_url === 'string' ? defaultPhoto.square_url : undefined,
    photoAttribution: defaultPhoto && typeof defaultPhoto.attribution === 'string' ? defaultPhoto.attribution : undefined,
    matchedTerm: typeof result.matched_term === 'string' ? result.matched_term : undefined,
  };
}

function isMatchingTaxon(species: BirdSpecies, taxon: INaturalistTaxonSummary): boolean {
  const targetNames = [species.commonName, species.scientificName, ...species.aliases].map(normalizeTaxonName);
  const taxonNames = [taxon.preferredCommonName ?? '', taxon.scientificName, taxon.matchedTerm ?? ''].map(normalizeTaxonName);
  return targetNames.some((target) => target && taxonNames.includes(target));
}

function hasIndexedDbSupport(): boolean {
  return typeof indexedDB !== 'undefined';
}

async function fetchTaxonPhotoBlob(url: string): Promise<{ blob: Blob; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok || typeof response.blob !== 'function') return null;

    const blob = await response.blob();
    return {
      blob,
      mimeType: blob.type || response.headers.get('content-type') || 'image/jpeg',
    };
  } catch {
    return null;
  }
}

async function saveTaxonCacheEntry(species: BirdSpecies, summary: INaturalistTaxonSummary): Promise<INaturalistTaxonCacheEntry> {
  const cacheKey = cacheKeyForSpecies(species);
  const existing = hasIndexedDbSupport()
    ? await db.inaturalistTaxa.get(summary.taxonId)
    : inaturalistMemoryCacheById.get(summary.taxonId);
  let photoBlob = existing?.photoBlob;
  let photoMimeType = existing?.photoMimeType;
  let photoSource = existing?.photoSource;

  const preferredPhotoUrl = summary.photoMediumUrl ?? summary.photoSquareUrl;
  const preferredPhotoSource = summary.photoMediumUrl
    ? 'medium'
    : summary.photoSquareUrl
      ? 'square'
      : undefined;
  const shouldRefreshPhoto = Boolean(preferredPhotoUrl) && (
    !photoBlob || (preferredPhotoSource !== undefined && photoSource !== preferredPhotoSource)
  );

  if (shouldRefreshPhoto && preferredPhotoUrl) {
    const downloadedPhoto = await fetchTaxonPhotoBlob(preferredPhotoUrl);
    if (downloadedPhoto) {
      photoBlob = downloadedPhoto.blob;
      photoMimeType = downloadedPhoto.mimeType;
      photoSource = preferredPhotoSource;
    }
  }

  const entry: INaturalistTaxonCacheEntry = {
    ...summary,
    cacheKey,
    cachedAt: Date.now(),
    photoBlob,
    photoMimeType,
    photoSource,
  };

  if (hasIndexedDbSupport()) {
    await db.inaturalistTaxa.put(entry);
  } else {
    inaturalistMemoryCacheByKey.set(cacheKey, entry);
    inaturalistMemoryCacheById.set(entry.taxonId, entry);
  }

  return entry;
}

async function searchINaturalistTaxon(query: string, species: BirdSpecies): Promise<INaturalistTaxonSummary | null> {
  const params = new URLSearchParams({
    q: query,
    rank: 'species',
    iconic_taxa: 'Aves',
    per_page: '5',
  });

  const response = await fetch(`${INAT_API_BASE}/taxa?${params.toString()}`);
  if (!response.ok) return null;

  const payload: unknown = await response.json();
  const results = isRecord(payload) && Array.isArray(payload.results) ? payload.results : [];
  const mapped = results
    .filter(isRecord)
    .map(toINaturalistTaxonSummary)
    .filter((entry): entry is INaturalistTaxonSummary => Boolean(entry));

  return mapped.find((entry) => isMatchingTaxon(species, entry)) ?? mapped[0] ?? null;
}

export async function getCachedINaturalistTaxonEntry(taxonId: number): Promise<INaturalistTaxonCacheEntry | null> {
  if (!hasIndexedDbSupport()) {
    return inaturalistMemoryCacheById.get(taxonId) ?? null;
  }

  try {
    return await db.inaturalistTaxa.get(taxonId) ?? null;
  } catch {
    return null;
  }
}

async function getCachedTaxonForSpecies(species: BirdSpecies): Promise<INaturalistTaxonCacheEntry | null> {
  if (!hasIndexedDbSupport()) {
    return inaturalistMemoryCacheByKey.get(cacheKeyForSpecies(species)) ?? null;
  }

  try {
    return await db.inaturalistTaxa.where('cacheKey').equals(cacheKeyForSpecies(species)).first() ?? null;
  } catch {
    return null;
  }
}

export async function fetchINaturalistTaxon(species: BirdSpecies): Promise<INaturalistTaxonSummary | null> {
  if (typeof fetch === 'undefined') return null;

  const cachedEntry = await getCachedTaxonForSpecies(species);
  if (cachedEntry) {
    const needsPhotoUpgrade = Boolean(cachedEntry.photoMediumUrl) && cachedEntry.photoSource !== 'medium';
    return needsPhotoUpgrade
      ? await saveTaxonCacheEntry(species, cachedEntry)
      : cachedEntry;
  }

  const key = cacheKeyForSpecies(species);
  const cachedRequest = inaturalistRequestCache.get(key);
  if (cachedRequest) return cachedRequest;

  const request = (async () => {
    try {
      const summary = await searchINaturalistTaxon(species.scientificName, species)
        ?? await searchINaturalistTaxon(species.commonName, species);
      if (!summary) return null;

      return await saveTaxonCacheEntry(species, summary);
    } catch {
      return null;
    }
  })();

  inaturalistRequestCache.set(key, request);
  const result = await request;
  if (!result) {
    inaturalistRequestCache.delete(key);
  }

  return result;
}

export function buildCachedPhotoUrl(entry: Pick<INaturalistTaxonCacheEntry, 'photoBlob'> | null | undefined): string | null {
  if (!entry?.photoBlob || typeof URL.createObjectURL !== 'function') return null;
  return URL.createObjectURL(entry.photoBlob);
}

export function getINaturalistPhotoUrl(
  summary: Pick<INaturalistTaxonSummary, 'photoMediumUrl' | 'photoSquareUrl'> | null | undefined,
  entry: Pick<INaturalistTaxonCacheEntry, 'photoBlob'> | null | undefined,
): string | null {
  return buildCachedPhotoUrl(entry) ?? summary?.photoMediumUrl ?? summary?.photoSquareUrl ?? null;
}

export function resetINaturalistCacheForTests() {
  inaturalistRequestCache.clear();
  inaturalistMemoryCacheByKey.clear();
  inaturalistMemoryCacheById.clear();
}