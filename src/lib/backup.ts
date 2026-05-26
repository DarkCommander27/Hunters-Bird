import type { AppSettings, BackupPayload, PhotoAsset, SerializedPhotoAsset, Sighting } from '../types';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export async function serializePhotoAsset(photo: PhotoAsset): Promise<SerializedPhotoAsset> {
  const buffer = await photo.blob.arrayBuffer();
  return {
    id: photo.id,
    mimeType: photo.mimeType,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt,
    dataUrl: `data:${photo.mimeType};base64,${arrayBufferToBase64(buffer)}`,
  };
}

export function deserializePhotoAsset(photo: SerializedPhotoAsset): PhotoAsset {
  const [, meta, base64] = photo.dataUrl.match(/^data:(.*?);base64,(.*)$/) ?? [];
  if (!meta || !base64) {
    throw new Error('Backup photo is not a valid data URL.');
  }

  return {
    id: photo.id,
    mimeType: photo.mimeType || meta,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt,
    blob: new Blob([base64ToArrayBuffer(base64)], { type: photo.mimeType || meta }),
  };
}

export async function createBackupPayload({
  sightings,
  photos,
  settings,
}: {
  sightings: Sighting[];
  photos: PhotoAsset[];
  settings?: AppSettings;
}): Promise<BackupPayload> {
  return {
    version: 1,
    exportedAt: Date.now(),
    sightings,
    photos: await Promise.all(photos.map(serializePhotoAsset)),
    settings,
  };
}

function isSightingArray(value: unknown): value is Sighting[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'object' && entry !== null && 'id' in entry);
}

export function parseBackupPayload(text: string): BackupPayload {
  const parsed: unknown = JSON.parse(text);

  if (isSightingArray(parsed)) {
    return {
      version: 1,
      exportedAt: Date.now(),
      sightings: parsed,
      photos: [],
    };
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('sightings' in parsed) ||
    !('photos' in parsed)
  ) {
    throw new Error('Backup file format is not supported.');
  }

  const payload = parsed as Partial<BackupPayload>;
  if (payload.version !== 1 || !Array.isArray(payload.sightings) || !Array.isArray(payload.photos)) {
    throw new Error('Backup file format is not supported.');
  }

  return {
    version: 1,
    exportedAt: typeof payload.exportedAt === 'number' ? payload.exportedAt : Date.now(),
    sightings: payload.sightings,
    photos: payload.photos,
    settings: payload.settings,
  };
}