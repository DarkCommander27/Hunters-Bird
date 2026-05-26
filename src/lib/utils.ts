/** Generate a random UUID (uses crypto.randomUUID when available). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Format a Unix timestamp as a human-readable date string. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a Unix timestamp as time string. */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a confidence score 0–1 as a percentage. */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/** Compress an image Blob to the target quality. */
export async function compressImage(blob: Blob, maxDimension = 2000, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((out) => resolve(out ?? blob), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(blob);
    img.src = url;
  });
}
