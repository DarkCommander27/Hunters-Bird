import { describe, expect, it } from 'vitest';
import { APPALACHIA_SPECIES } from '../data/seed';
import { demoBirdIdentifier } from './identification';

describe('demoBirdIdentifier', () => {
  it('picks a strong regional match from notes and habitat clues', async () => {
    const result = await demoBirdIdentifier.identify({
      notes: 'Heard it near a rushing stream while it bobbed along the rocks.',
      habitats: ['River/Stream', 'Forest'],
      regionPackId: 'appalachia',
      species: APPALACHIA_SPECIES,
    });

    expect(result?.species.commonName).toBe('Louisiana Waterthrush');
    expect(result?.confidence).toBeGreaterThan(0.5);
    expect(result?.alternatives.some((candidate) => candidate.species.commonName === 'Belted Kingfisher')).toBe(true);
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