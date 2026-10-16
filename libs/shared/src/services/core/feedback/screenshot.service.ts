import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Screenshot } from '@capawesome/capacitor-screenshot';
import html2canvas from 'html2canvas-pro';

import {
  detectImageMimeType,
  downscaleBase64,
  downscaleDataUri,
  ICapturedScreenshot,
  MAX_IMAGE_BYTES,
  parseDataUri,
} from './image.utils';

export type { ICapturedScreenshot };
export { detectImageMimeType, downscaleBase64, downscaleDataUri, parseDataUri };

/**
 * Result of attempting to attach an image from the gallery.
 * `cancelled` covers dismiss/timeout/no-file; `error` carries a message to show the user.
 */
export type AttachFromGalleryResult =
  | { status: 'ok'; screenshot: ICapturedScreenshot }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

const MAX_BYTES = MAX_IMAGE_BYTES;

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
    } catch (err: any) {
      if (err?.message === 'WEB_SCREENSHOT_SECURITY_ERROR') {
        throw err;
      }
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
    return downscaleBase64(base64, mime, maxBytes);
  }
}

/**
 * Rasterize the current page to a PNG data URI with html2canvas-pro.
 * html2canvas-pro snapshots computed styles, pseudo-elements, canvas content,
 * fonts, and external images instead of loading a raw foreignObject SVG as an
 * image, which blocks external subresources in Chromium.
 * External SVG images are pre-rasterized because html2canvas-pro drops their
 * fill colours and geometry in full-page captures.
 */
export async function renderPageToPng(): Promise<string> {
  const width = Math.max(document.body.scrollWidth, window.innerWidth);
  const height = Math.max(document.body.scrollHeight, window.innerHeight);
  await document.fonts?.ready;
  const restoreSvgTransforms = normalizeInlineSvgTransforms();
  const restoreSvgImages = await rasterizeSvgImages();
  try {
    const canvas = await html2canvas(document.body, {
      allowTaint: false,
      backgroundColor: null,
      height,
      logging: false,
      scale: 1,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      width,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    });
    try {
      return canvas.toDataURL('image/png');
    } catch (err: any) {
      if (err?.name === 'SecurityError') {
        throw new Error('WEB_SCREENSHOT_SECURITY_ERROR');
      }
      throw err;
    }
  } finally {
    restoreSvgImages();
    restoreSvgTransforms();
  }
}

/**
 * Replace external SVG `<img>` sources with PNG data URLs for the duration of the capture.
 * html2canvas-pro loses SVG fill colours and geometry in full-page captures (tile icons
 * collapse to black fragments), so the browser engine rasterizes each SVG first.
 * The swapped PNG source is awaited so `currentSrc` is settled before capture.
 * Returns a callback that restores the original sources.
 */
export async function rasterizeSvgImages(): Promise<() => void> {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('img')).filter((img) =>
    /\.svg(?:[?#]|$)/i.test(img.currentSrc || img.src),
  );
  const restores: Array<() => void> = [];
  await Promise.all(
    images.map(async (img) => {
      try {
        if (!img.complete && img.decode) {
          await img.decode().catch(() => undefined);
        }
        const width = img.clientWidth || img.naturalWidth;
        const height = img.clientHeight || img.naturalHeight;
        if (!width || !height) return;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const originalSrc = img.src;
        img.src = canvas.toDataURL('image/png');
        restores.push(() => (img.src = originalSrc));
        await waitForImageLoad(img);
      } catch {
        // Keep the original source when rasterization is not possible.
      }
    }),
  );
  return () => restores.forEach((restore) => restore());
}

/**
 * Resolve once an image's current source has finished loading (best-effort).
 * html2canvas reads `img.currentSrc || img.src`, so the swapped PNG source must
 * be settled before the capture starts.
 */
async function waitForImageLoad(img: HTMLImageElement): Promise<void> {
  if (typeof img.decode === 'function') {
    await img.decode().catch(() => undefined);
    return;
  }
  if (img.complete) return;
  await new Promise<void>((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * Neutralise computed transforms on inline SVGs for the capture.
 * html2canvas-pro inlines computed styles into the serialized SVG and does not strip
 * `transform`, so a translated SVG (e.g. Material select carets using
 * translate(-50%,-50%)) renders its content shifted out of its own viewport.
 * The translation is moved to margins, which the serializer does strip.
 * Returns a callback that restores the original styles.
 */
export function normalizeInlineSvgTransforms(): () => void {
  const restores: Array<() => void> = [];
  document.querySelectorAll('svg').forEach((svg) => {
    const computed = getComputedStyle(svg);
    if (!computed.transform || computed.transform === 'none') return;
    // Only isolated or out-of-flow SVGs are safe to offset with margins.
    const positioned = computed.position === 'absolute' || computed.position === 'fixed';
    if (!positioned && svg.parentElement?.childElementCount !== 1) return;
    let matrix: DOMMatrixReadOnly;
    try {
      matrix = new DOMMatrixReadOnly(computed.transform);
    } catch {
      return;
    }
    // Only pure translations can be compensated with margins.
    const isTranslation =
      Math.abs(matrix.a - 1) < 0.001 &&
      Math.abs(matrix.b) < 0.001 &&
      Math.abs(matrix.c) < 0.001 &&
      Math.abs(matrix.d - 1) < 0.001;
    if (!isTranslation) return;
    const previousTransform = svg.style.transform;
    const previousMargin = svg.style.margin;
    svg.style.transform = 'none';
    svg.style.margin = `${matrix.f}px 0 0 ${matrix.e}px`;
    restores.push(() => {
      svg.style.transform = previousTransform;
      svg.style.margin = previousMargin;
    });
  });
  return () => restores.forEach((restore) => restore());
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
