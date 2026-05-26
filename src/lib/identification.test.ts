import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APPALACHIA_SPECIES } from '../data/seed';
import { demoBirdIdentifier } from './identification';
import { getCachedINaturalistTaxonEntry, resetINaturalistCacheForTests } from './inaturalist';

describe('demoBirdIdentifier', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_results: 0, results: [] }),
    }));
  });

  afterEach(async () => {
    resetINaturalistCacheForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('picks a strong regional match from notes and habitat clues', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('Louisiana+Waterthrush') || url.includes('Louisiana%20Waterthrush')) {
        return {
          ok: true,
          json: async () => ({
            total_results: 1,
            results: [{
              id: 8545,
              name: 'Parkesia motacilla',
              preferred_common_name: 'Louisiana Waterthrush',
              observations_count: 12345,
              wikipedia_url: 'https://en.wikipedia.org/wiki/Louisiana_waterthrush',
              matched_term: 'Louisiana Waterthrush',
              default_photo: {
                medium_url: 'https://example.com/waterthrush-medium.jpg',
                square_url: 'https://example.com/waterthrush-square.jpg',
                attribution: '(c) Example Photographer',
              },
            }],
          }),
        };
      }

      if (url.includes('Belted+Kingfisher') || url.includes('Belted%20Kingfisher')) {
        return {
          ok: true,
          json: async () => ({
            total_results: 1,
            results: [{
              id: 2548,
              name: 'Megaceryle alcyon',
              preferred_common_name: 'Belted Kingfisher',
              observations_count: 83101,
              matched_term: 'Belted Kingfisher',
            }],
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ total_results: 0, results: [] }),
      };
    }));

    const result = await demoBirdIdentifier.identify({
      notes: 'Heard it near a rushing stream while it bobbed along the rocks.',
      habitats: ['River/Stream', 'Forest'],
      regionPackId: 'appalachia',
      species: APPALACHIA_SPECIES,
    });

    expect(result?.species.commonName).toBe('Louisiana Waterthrush');
    expect(result?.confidence).toBeGreaterThan(0.5);
    expect(result?.alternatives.some((candidate) => candidate.species.commonName === 'Belted Kingfisher')).toBe(true);
    expect(result?.inaturalistTaxon?.taxonId).toBe(8545);
    expect(await getCachedINaturalistTaxonEntry(8545)).toMatchObject({
      taxonId: 8545,
      preferredCommonName: 'Louisiana Waterthrush',
    });
  });

  it('returns no match when there is not enough evidence', async () => {
    const result = await demoBirdIdentifier.identify({
      notes: 'Bird seen briefly.',
      habitats: [],
      regionPackId: 'appalachia',
      species: APPALACHIA_SPECIES,
    });

    expect(result).toBeNull();
  });
});