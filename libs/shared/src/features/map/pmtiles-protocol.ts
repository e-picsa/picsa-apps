import * as maplibregl from 'maplibre-gl';
import { PMTiles, Protocol, RangeResponse, Source } from 'pmtiles';

const MAX_CACHED_ARCHIVE_BYTES = 10 * 1024 * 1024;

function parseContentRangeTotal(header: string | null): number | null {
  if (!header) return null;
  const match = /^bytes\s+\d+-\d+\/(\d+)$/i.exec(header.trim());
  return match ? Number(match[1]) : null;
}

/**
 * Fetch-backed PMTiles Source that handles Capacitor WebViewAssetLoader quirks:
 * - Returns 206 Partial Content with body from `offset` to EOF (ignores requested end byte)
 * - Or returns 200 OK with full buffer when Range is ignored
 * - Guards against truncated 206 responses across varying Android WebView/proxy implementations
 */
export class AssetPmtilesSource implements Source {
  private fullArchivePromise: Promise<ArrayBuffer> | null = null;
  private fullArchiveVerified = false;

  constructor(private readonly url: string) {}

  getKey(): string {
    return this.url;
  }

  async getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string): Promise<RangeResponse> {
    if (this.fullArchivePromise) {
      const buffer = await this.fullArchivePromise;
      if (offset + length <= buffer.byteLength || (offset === 0 && this.fullArchiveVerified)) {
        return { data: buffer.slice(offset, offset + length) };
      }
      if (this.fullArchiveVerified) {
        throw new Error(`PMTiles range out of bounds (${offset}+${length} > ${buffer.byteLength}) for ${this.url}`);
      }
      // An unverified oversized 206 did not reach this offset (e.g. chunked proxy); drop cache and fetch.
      this.fullArchivePromise = null;
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
      const contentRangeTotal = parseContentRangeTotal(response.headers.get('Content-Range'));
      // Reject unexpected short 206 chunks (offset === 0 may legitimately read past EOF on tiny archives).
      if (
        raw.byteLength < length &&
        (offset > 0 || (contentRangeTotal !== null && raw.byteLength < contentRangeTotal))
      ) {
        throw new Error(`PMTiles truncated 206 response (${raw.byteLength} < ${length}) for ${this.url}`);
      }
      // WebViewAssetLoader ignores the Range end byte and returns [offset..EOF]. When the initial
      // offset-0 read already loaded the whole archive, reuse it (up to 10 MiB) to avoid re-reading EOF.
      if (offset === 0 && raw.byteLength > length && raw.byteLength <= MAX_CACHED_ARCHIVE_BYTES) {
        this.fullArchivePromise = Promise.resolve(raw);
        this.fullArchiveVerified = contentRangeTotal !== null && raw.byteLength === contentRangeTotal;
      }
      const data = raw.byteLength <= length ? raw : raw.slice(0, length);
      return {
        data,
        etag: responseEtag ?? etag,
        cacheControl,
        expires,
      };
    }

    // Server ignored Range header (HTTP 200); cache the full buffer once and slice locally.
    if (!this.fullArchivePromise) {
      this.fullArchiveVerified = true;
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
