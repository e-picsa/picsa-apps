import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Screenshot } from '@capawesome/capacitor-screenshot';

export interface ICapturedScreenshot {
  base64: string;
  type: string;
}

/**
 * Result of attempting to attach an image from the gallery.
 * `cancelled` covers dismiss/timeout/no-file; `error` carries a message to show the user.
 */
export type AttachFromGalleryResult =
  | { status: 'ok'; screenshot: ICapturedScreenshot }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

const MAX_BYTES = 5 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class ScreenshotService {
  /** Capture the current screen. Returns null on any failure. */
  async capture(): Promise<ICapturedScreenshot | null> {
    const doCapture = async () => {
      if (Capacitor.isNativePlatform()) {
        // give the WebView time to repaint after hiding overlays
        await new Promise((resolve) => setTimeout(resolve, 150));
        const { uri } = await Screenshot.take();
        try {
          const { data } = await Filesystem.readFile({ path: uri });
          const base64 = data as string;
          return { base64, type: detectImageMimeType(base64) };
        } catch {
          return null;
        }
      }
      const dataUri = await renderPageToPng();
      return parseDataUri(dataUri);
    };
    try {
      return await withOverlaysHidden(doCapture);
    } catch {
      return null;
    }
  }

  /**
   * Pick an image from the device gallery / file system.
   * On native: uses Camera.getPhoto. On web: uses a hidden file input.
   * @param inputEl Optional file input element for web platform.
   */
  async attachFromGallery(inputEl?: HTMLInputElement): Promise<AttachFromGalleryResult> {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const photo = await Camera.getPhoto({
            source: CameraSource.Photos,
            resultType: CameraResultType.DataUrl,
            quality: 80,
          });
          if (!photo.dataUrl) return { status: 'cancelled' };
          const parsed = parseDataUri(photo.dataUrl);
          return parsed
            ? { status: 'ok', screenshot: parsed }
            : { status: 'error', message: "That image couldn't be read. Please try another one." };
        } catch {
          // Camera.getPhoto rejects when the user dismisses the picker
          return { status: 'cancelled' };
        }
      }
      // Web: use hidden file input
      if (!inputEl) return { status: 'cancelled' };
      return new Promise<AttachFromGalleryResult>((resolve) => {
        inputEl.value = '';
        let settled = false;
        const settle = (result: AttachFromGalleryResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(result);
        };
        const timer = setTimeout(() => settle({ status: 'cancelled' }), 60_000);
        const onChange = () => {
          inputEl.removeEventListener('change', onChange);
          inputEl.removeEventListener('cancel', onCancel);
          const file = inputEl.files?.[0];
          if (!file) {
            settle({ status: 'cancelled' });
            return;
          }
          if (!file.type.startsWith('image/')) {
            settle({ status: 'error', message: 'Please choose an image file (PNG, JPG or WebP).' });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            // reset so picking the same file again re-triggers `change`
            inputEl.value = '';
            const parsed = parseDataUri(reader.result as string);
            settle(
              parsed
                ? { status: 'ok', screenshot: parsed }
                : { status: 'error', message: "That image couldn't be read. Please try another one." },
            );
          };
          reader.onerror = () =>
            settle({ status: 'error', message: "That image couldn't be read. Please try another one." });
          reader.readAsDataURL(file);
        };
        const onCancel = () => {
          inputEl.removeEventListener('change', onChange);
          inputEl.removeEventListener('cancel', onCancel);
          settle({ status: 'cancelled' });
        };
        inputEl.addEventListener('change', onChange);
        inputEl.addEventListener('cancel', onCancel);
        inputEl.click();
      });
    } catch {
      return { status: 'error', message: "We couldn't attach that image. Please try again." };
    }
  }

  /** Compress a base64 image to stay under maxBytes. Pure helper, exported for testing. */
  async downscaleBase64(base64: string, mime: string, maxBytes: number = MAX_BYTES): Promise<ICapturedScreenshot> {
    if (base64.length * 0.75 <= maxBytes) {
      return { base64, type: mime };
    }
    const dataUri = base64.startsWith('data:') ? base64 : `data:${mime};base64,${base64}`;
    return downscaleDataUri(dataUri, maxBytes);
  }
}

/** Detect image MIME type from base64 magic bytes. Falls back to 'image/png'. */
function detectImageMimeType(base64: string): string {
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

/** Downscale a data URI so the base64 payload fits under maxBytes (max width 1920, jpeg 0.9→0.3). */
export async function downscaleDataUri(dataUri: string, maxBytes: number): Promise<ICapturedScreenshot> {
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
  // Use jpeg for smaller size, fall back to source mime for transparency
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Rasterize the current page to a PNG data URI via an SVG foreignObject.
 * The foreignObject delegates rendering to the real browser engine, so modern
 * CSS (Tailwind v4 `color()`/oklch) works — unlike html2canvas / the capacitor
 * screenshot plugin's web implementation, which parse CSS themselves.
 */
export async function renderPageToPng(): Promise<string> {
  const width = Math.max(document.body.scrollWidth, window.innerWidth);
  const height = Math.max(document.body.scrollHeight, window.innerHeight);
  const clone = document.body.cloneNode(true) as HTMLElement;
  copyComputedStyles(document.body, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Copy each element's resolved computed style onto its clone so the standalone clone renders faithfully. */
function copyComputedStyles(source: Element, target: Element) {
  const computed = getComputedStyle(source);
  let css = '';
  for (const prop of Array.from(computed)) {
    css += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  target.setAttribute('style', css);
  for (let i = 0; i < source.children.length; i++) {
    copyComputedStyles(source.children[i], target.children[i]);
  }
}

/**
 * Run `captureFn` with the CDK overlay container and feedback FAB hidden so they
 * don't appear in the captured image. Both are fixed-position, so hiding causes no
 * layout shift. Restores previous inline `display` values in a `finally` block.
 */
async function withOverlaysHidden<T>(captureFn: () => Promise<T>): Promise<T> {
  const targets = Array.from(document.querySelectorAll('.cdk-overlay-container, picsa-feedback-fab')) as HTMLElement[];
  const prevDisplay = targets.map((el) => el.style.display);
  targets.forEach((el) => (el.style.display = 'none'));
  try {
    await waitForRepaint();
    return await captureFn();
  } finally {
    targets.forEach((el, i) => (el.style.display = prevDisplay[i]));
  }
}

/** Wait for the browser to repaint (double requestAnimationFrame). */
function waitForRepaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
