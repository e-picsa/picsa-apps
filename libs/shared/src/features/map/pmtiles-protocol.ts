import * as maplibregl from 'maplibre-gl';
import { PMTiles, Protocol, RangeResponse, Source } from 'pmtiles';

/**
 * Fetch-backed PMTiles Source that handles Capacitor WebViewAssetLoader quirks:
 * - Returns 206 Partial Content but with body from `offset` to EOF (ignores requested end byte)
 * - Or returns 200 OK with full buffer when Range is ignored
 * Both cases are sliced locally to the exact requested byte range.
 */
export class AssetPmtilesSource implements Source {
  private fullArchivePromise: Promise<ArrayBuffer> | null = null;

  constructor(private readonly url: string) {}

  getKey(): string {
    return this.url;
  }

  async getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string): Promise<RangeResponse> {
    if (this.fullArchivePromise) {
      const buffer = await this.fullArchivePromise;
      return { data: buffer.slice(offset, offset + length) };
    }

    const headers = new Headers();
    headers.set('Range', `bytes=${offset}-${offset + length - 1}`);

    const response = await fetch(this.url, { headers, signal });
    if (response.status >= 400) {
      throw new Error(`PMTiles fetch failed (${response.status}) for ${this.url}`);
    }

    const responseEtag = response.headers.get('ETag') ?? undefined;
    const cacheControl = response.headers.get('Cache-Control') ?? undefined;
    const expires = response.headers.get('Expires') ?? undefined;

    if (response.status === 206) {
      const raw = await response.arrayBuffer();
      // Capacitor's WebViewAssetLoader returns 206 with bytes from offset to EOF,
      // ignoring the requested end byte. Slice to the exact requested length.
      const data = raw.byteLength === length ? raw : raw.slice(0, length);
      return {
        data,
        etag: responseEtag ?? etag,
        cacheControl,
        expires,
      };
    }

    // Server ignored Range header (HTTP 200); cache the full buffer once and slice locally.
    if (!this.fullArchivePromise) {
      this.fullArchivePromise = response.arrayBuffer();
    } else {
      await response.body?.cancel();
    }
    const buffer = await this.fullArchivePromise;
    return {
      data: buffer.slice(offset, offset + length),
      etag: responseEtag ?? etag,
      cacheControl,
      expires,
    };
  }
}

let pmtilesProtocol: Protocol | null = null;

/**
 * Register the MapLibre `pmtiles://` protocol handler once and pre-bind any
 * local asset archives with `AssetPmtilesSource` so Range-less static servers work.
 */
export function ensurePmtilesProtocol(pmtilesUrls: string[]): Protocol {
  if (!pmtilesProtocol) {
    pmtilesProtocol = new Protocol();
    if (typeof maplibregl.addProtocol === 'function') {
      maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
    }
  }

  for (const pmtilesUrl of pmtilesUrls) {
    const assetPath = pmtilesUrl.startsWith('pmtiles://') ? pmtilesUrl.slice('pmtiles://'.length) : pmtilesUrl;
    if (!pmtilesProtocol.get(assetPath)) {
      pmtilesProtocol.add(new PMTiles(new AssetPmtilesSource(assetPath)));
    }
  }

  return pmtilesProtocol;
}
