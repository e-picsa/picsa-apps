export interface ICapturedScreenshot {
  base64: string;
  type: string;
}

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB

/** Detect image MIME type from base64 magic bytes. Falls back to 'image/png'. */
export function detectImageMimeType(base64: string): string {
  try {
    const raw = atob(base64.substring(0, 12));
    // PNG magic: 89 50 4E 47
    if (
      raw.codePointAt(0) === 0x89 &&
      raw.codePointAt(1) === 0x50 &&
      raw.codePointAt(2) === 0x4e &&
      raw.codePointAt(3) === 0x47
    ) {
      return 'image/png';
    }
    // JPEG magic: FF D8 FF
    if (raw.codePointAt(0) === 0xff && raw.codePointAt(1) === 0xd8 && raw.codePointAt(2) === 0xff) {
      return 'image/jpeg';
    }
    // WEBP magic: RIFF....WEBP
    if (raw.startsWith('RIFF') && raw.substring(8, 12) === 'WEBP') {
      return 'image/webp';
    }
  } catch {
    // ignore decode errors
  }
  return 'image/png';
}

/** Parse a data URI into base64 payload + mime type. */
export function parseDataUri(dataUri: string): ICapturedScreenshot | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUri);
  if (!match) return null;
  return { base64: match[2], type: match[1] };
}

/** Convert a base64 string to a native Blob without external dependencies. */
export function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return new Blob([bytes], { type: mime });
}

/** Load an image element asynchronously. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Downscale a data URI so the base64 payload fits under maxBytes (max width 1920, jpeg 0.9→0.3). */
export async function downscaleDataUri(
  dataUri: string,
  maxBytes: number = MAX_IMAGE_BYTES,
): Promise<ICapturedScreenshot> {
  const img = await loadImage(dataUri);
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  const maxDim = 1920;
  if (width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);

  const outMime = 'image/jpeg';
  let quality = 0.9;
  let output = canvas.toDataURL(outMime, quality);
  while (output.length * 0.75 > maxBytes && quality > 0.3) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    output = canvas.toDataURL(outMime, quality);
  }
  const parsed = parseDataUri(output);
  if (!parsed) {
    throw new Error('Failed to encode downscaled image');
  }
  if (parsed.base64.length * 0.75 > maxBytes) {
    throw new Error('That image is too large. Please choose a smaller one.');
  }
  return parsed;
}

/** Compress a base64 image to stay under maxBytes. */
export async function downscaleBase64(
  base64: string,
  mime: string,
  maxBytes: number = MAX_IMAGE_BYTES,
): Promise<ICapturedScreenshot> {
  if (base64.length * 0.75 <= maxBytes) {
    return { base64, type: mime };
  }
  const dataUri = base64.startsWith('data:') ? base64 : `data:${mime};base64,${base64}`;
  return downscaleDataUri(dataUri, maxBytes);
}
