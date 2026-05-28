import { describe, expect, it } from 'vitest';
import { createBackupPayload, deserializePhotoAsset, parseBackupPayload } from './backup';
import type { AppSettings, PhotoAsset, Sighting } from '../types';

describe('backup helpers', () => {
  it('round-trips photo assets through backup serialization', async () => {
    const original: PhotoAsset = {
      id: 'photo-1',
      blob: new Blob(['bird-photo'], { type: 'text/plain' }),
      mimeType: 'text/plain',
      createdAt: 123,
    };

    const payload = await createBackupPayload({
      sightings: [],
      photos: [original],
    });
    const restored = deserializePhotoAsset(payload.photos[0]);

    expect(await restored.blob.text()).toBe('bird-photo');
    expect(restored.mimeType).toBe('text/plain');
  });

  it('parses the new structured backup format', async () => {
    const sightings: Sighting[] = [{
      id: 's-1',
      createdAt: 1,
      habitatsSnapshot: ['Forest'],
      notes: 'note',
      birdCount: 1,
      confirmedByUser: true,
      status: 'confirmed',
    }];
    const settings: AppSettings = {
      id: 'singleton',
      gpsEnabled: true,
      darkMode: true,
      theme: 'forest',
      activeRegionPackId: 'appalachia',
      downloadedPackIds: ['appalachia'],
    };

    const payload = await createBackupPayload({ sightings, photos: [], settings });
    const parsed = parseBackupPayload(JSON.stringify(payload));

    expect(parsed.sightings).toHaveLength(1);
    expect(parsed.settings?.activeRegionPackId).toBe('appalachia');
  });

  it('accepts the legacy sightings-only export format', () => {
    const parsed = parseBackupPayload(JSON.stringify([{
      id: 'legacy-1',
      createdAt: 1,
      habitatsSnapshot: [],
      notes: '',
      birdCount: 1,
      confirmedByUser: false,
      status: 'unknown',
    }]));

    expect(parsed.sightings).toHaveLength(1);
    expect(parsed.photos).toHaveLength(0);
  });
});