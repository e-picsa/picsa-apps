/**
 * Verifies that all Latin & punctuation characters rendered by our MapLibre style
 * (`name:latin || name` and `ref`) across bundled offline `.pmtiles` archives are
 * covered by the local SDF font glyph `.pbf` files.
 *
 * Why this exists:
 *   MapLibre GL JS renders vector labels in WebGL using pre-rendered SDF protobuf
 *   blocks (`{start}-{end}.pbf`), not CSS `.woff2` fonts. Missing a block causes
 *   404s and dropped characters on offline devices.
 *
 * Usage:
 *   yarn scripts map/verify-map-glyphs               # check only
 *   FETCH=true yarn scripts map/verify-map-glyphs    # download missing Latin blocks
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gunzipSync } from 'node:zlib';

import { Compression, PMTiles, RangeResponse, Source, tileIdToZxy } from 'pmtiles';

import { PATHS } from '../paths';

const MAP_TILES_DIR = path.join(PATHS.rootDir, 'apps/picsa-tools/climate-tool/src/assets/mapTiles');
const FONT_STACK = 'Noto Sans Regular';
const FONTS_DIR = path.join(MAP_TILES_DIR, 'fonts', FONT_STACK);
const UPSTREAM_GLYPH_BASE = `https://tiles.openfreemap.org/fonts/${encodeURIComponent(FONT_STACK)}`;

/** MVT layers whose string properties are rendered via MapLibre symbol layers */
const LABEL_LAYERS = new Set(['place', 'water_name', 'waterway', 'transportation_name']);

/** Basic Latin + Latin Extended + General Punctuation; higher blocks are flagged as outliers */
const LATIN_AND_PUNCT_MAX_CP = 0x206f;

class NodeFileSource implements Source {
  constructor(private readonly filePath: string) {}

  getKey(): string {
    return this.filePath;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const fd = fs.openSync(this.filePath, 'r');
    try {
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, offset);
      return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
    } finally {
      fs.closeSync(fd);
    }
  }
}

async function nodeDecompress(buf: ArrayBuffer, compression: Compression): Promise<ArrayBuffer> {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf;
  }
  if (compression === Compression.Gzip) {
    const out = gunzipSync(Buffer.from(buf));
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  }
  throw new Error(`Unsupported PMTiles compression: ${compression}`);
}

function readVarint(buf: Uint8Array, state: { pos: number }): number {
  let result = 0;
  let shift = 0;
  while (state.pos < buf.length) {
    const byte = buf[state.pos++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return result >>> 0;
    shift += 7;
    if (shift > 35) {
      while (state.pos < buf.length && (buf[state.pos++] & 0x80) !== 0) {
        // Skip 64-bit varint upper bytes
      }
      return result >>> 0;
    }
  }
  return result >>> 0;
}

function skipField(buf: Uint8Array, state: { pos: number }, wireType: number) {
  if (wireType === 0) {
    readVarint(buf, state);
  } else if (wireType === 1) {
    state.pos += 8;
  } else if (wireType === 2) {
    const len = readVarint(buf, state);
    state.pos += len;
  } else if (wireType === 5) {
    state.pos += 4;
  } else {
    throw new Error(`Unsupported protobuf wire type: ${wireType}`);
  }
}

function decodeFeatureTags(featureBuf: Uint8Array): number[] {
  const tags: number[] = [];
  const state = { pos: 0 };
  while (state.pos < featureBuf.length) {
    const fTag = readVarint(featureBuf, state);
    const fField = fTag >>> 3;
    const fWire = fTag & 7;
    if (fField === 2 && fWire === 2) {
      const packedLen = readVarint(featureBuf, state);
      const end = state.pos + packedLen;
      while (state.pos < end) {
        tags.push(readVarint(featureBuf, state));
      }
    } else {
      skipField(featureBuf, state, fWire);
    }
  }
  return tags;
}

/**
 * Extract the exact label text rendered by `pmtiles-style.ts` (`name:latin || name` and `ref`)
 * from MVT layers in LABEL_LAYERS directly from the MVT protobuf.
 */
function extractRenderedLabelStrings(mvtBytes: Uint8Array): string[] {
  const rendered: string[] = [];
  const decoder = new TextDecoder('utf-8');
  const tileState = { pos: 0 };

  while (tileState.pos < mvtBytes.length) {
    const tag = readVarint(mvtBytes, tileState);
    const field = tag >>> 3;
    const wire = tag & 7;
    if (field !== 3 || wire !== 2) {
      skipField(mvtBytes, tileState, wire);
      continue;
    }

    const layerLen = readVarint(mvtBytes, tileState);
    const layerEnd = tileState.pos + layerLen;
    const layerBuf = mvtBytes.subarray(tileState.pos, layerEnd);
    tileState.pos = layerEnd;

    let layerName = '';
    const keys: string[] = [];
    const stringValues: Array<string | undefined> = [];
    const featureTagLists: number[][] = [];
    const layerState = { pos: 0 };

    while (layerState.pos < layerBuf.length) {
      const lTag = readVarint(layerBuf, layerState);
      const lField = lTag >>> 3;
      const lWire = lTag & 7;

      if (lField === 1 && lWire === 2) {
        const len = readVarint(layerBuf, layerState);
        layerName = decoder.decode(layerBuf.subarray(layerState.pos, layerState.pos + len));
        layerState.pos += len;
      } else if (lField === 2 && lWire === 2) {
        const len = readVarint(layerBuf, layerState);
        featureTagLists.push(decodeFeatureTags(layerBuf.subarray(layerState.pos, layerState.pos + len)));
        layerState.pos += len;
      } else if (lField === 3 && lWire === 2) {
        const len = readVarint(layerBuf, layerState);
        keys.push(decoder.decode(layerBuf.subarray(layerState.pos, layerState.pos + len)));
        layerState.pos += len;
      } else if (lField === 4 && lWire === 2) {
        const valLen = readVarint(layerBuf, layerState);
        const valEnd = layerState.pos + valLen;
        const valBuf = layerBuf.subarray(layerState.pos, valEnd);
        layerState.pos = valEnd;

        let strVal: string | undefined;
        const valState = { pos: 0 };
        while (valState.pos < valBuf.length) {
          const vTag = readVarint(valBuf, valState);
          const vField = vTag >>> 3;
          const vWire = vTag & 7;
          if (vField === 1 && vWire === 2) {
            const sLen = readVarint(valBuf, valState);
            strVal = decoder.decode(valBuf.subarray(valState.pos, valState.pos + sLen));
            valState.pos += sLen;
          } else {
            skipField(valBuf, valState, vWire);
          }
        }
        stringValues.push(strVal);
      } else {
        skipField(layerBuf, layerState, lWire);
      }
    }

    if (!LABEL_LAYERS.has(layerName)) continue;

    for (const tags of featureTagLists) {
      let name: string | undefined;
      let nameLatin: string | undefined;
      let ref: string | undefined;
      for (let i = 0; i + 1 < tags.length; i += 2) {
        const key = keys[tags[i]];
        const val = stringValues[tags[i + 1]];
        if (!val) continue;
        if (key === 'name') name = val;
        else if (key === 'name:latin') nameLatin = val;
        else if (key === 'ref') ref = val;
      }
      const primary = nameLatin || name;
      if (primary) rendered.push(primary);
      if (layerName === 'transportation_name' && ref) rendered.push(ref);
    }
  }

  return rendered;
}

async function collectAllTileIds(pmtiles: PMTiles): Promise<number[]> {
  const header = await pmtiles.getHeader();
  const source = pmtiles.source;
  const ids: number[] = [];

  async function walkDir(offset: number, length: number) {
    const res = await source.getBytes(offset, length);
    const dirBytes = new Uint8Array(await nodeDecompress(res.data, header.internalCompression));
    const state = { pos: 0 };
    const numEntries = readVarint(dirBytes, state);

    const tileIds: number[] = [];
    let lastId = 0;
    for (let i = 0; i < numEntries; i++) {
      lastId += readVarint(dirBytes, state);
      tileIds.push(lastId);
    }
    const runLengths: number[] = [];
    for (let i = 0; i < numEntries; i++) runLengths.push(readVarint(dirBytes, state));
    const lengths: number[] = [];
    for (let i = 0; i < numEntries; i++) lengths.push(readVarint(dirBytes, state));
    const offsets: number[] = [];
    let nextOffset = 0;
    for (let i = 0; i < numEntries; i++) {
      const val = readVarint(dirBytes, state);
      const off = val === 0 && i > 0 ? nextOffset : val - 1;
      offsets.push(off);
      nextOffset = off + lengths[i];
    }

    for (let i = 0; i < numEntries; i++) {
      if (runLengths[i] === 0) {
        await walkDir(header.leafDirectoryOffset + offsets[i], lengths[i]);
      } else {
        for (let r = 0; r < runLengths[i]; r++) {
          ids.push(tileIds[i] + r);
        }
      }
    }
  }

  await walkDir(header.rootDirectoryOffset, header.rootDirectoryLength);
  return ids;
}

function getGlyphRange(codePoint: number): string {
  const start = Math.floor(codePoint / 256) * 256;
  return `${start}-${start + 255}`;
}

async function main() {
  const shouldFetch = process.argv.includes('--fetch') || process.env.FETCH === 'true';
  const pmtilesFiles = fs
    .readdirSync(MAP_TILES_DIR)
    .filter((f) => f.endsWith('.pmtiles'))
    .sort((a, b) => a.localeCompare(b));

  if (pmtilesFiles.length === 0) {
    console.error(`No .pmtiles files found in ${MAP_TILES_DIR}`);
    process.exit(1);
  }

  const latinRanges = new Map<string, Set<string>>();
  const outlierRanges = new Map<string, Set<string>>();

  for (const file of pmtilesFiles) {
    const fullPath = path.join(MAP_TILES_DIR, file);
    const archive = new PMTiles(new NodeFileSource(fullPath), undefined, nodeDecompress);
    const tileIds = await collectAllTileIds(archive);

    for (const tileId of tileIds) {
      const [z, x, y] = tileIdToZxy(tileId);
      const tile = await archive.getZxy(z, x, y);
      if (!tile?.data) continue;
      for (const text of extractRenderedLabelStrings(new Uint8Array(tile.data))) {
        for (const ch of text) {
          const cp = ch.codePointAt(0);
          if (cp === undefined || cp < 32) continue;
          const range = getGlyphRange(cp);
          const targetMap = cp <= LATIN_AND_PUNCT_MAX_CP ? latinRanges : outlierRanges;
          let samples = targetMap.get(range);
          if (!samples) {
            samples = new Set<string>();
            targetMap.set(range, samples);
          }
          if (samples.size < 8 && cp >= 128) {
            samples.add(`${ch} (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`);
          }
        }
      }
    }
    console.log(`Scanned ${file}: ${tileIds.length} tiles`);
  }

  const requiredRanges = [...latinRanges.keys()].sort(
    (a, b) => Number.parseInt(a.split('-')[0], 10) - Number.parseInt(b.split('-')[0], 10),
  );
  const missingRanges: string[] = [];

  console.log(`\nRequired Latin/punctuation glyph ranges for "${FONT_STACK}":`);
  for (const range of requiredRanges) {
    const pbfPath = path.join(FONTS_DIR, `${range}.pbf`);
    const exists = fs.existsSync(pbfPath);
    const samples = [...(latinRanges.get(range) ?? [])].join(', ');
    console.log(`  ${exists ? 'OK     ' : 'MISSING'} ${range}.pbf${samples ? `  [${samples}]` : ''}`);
    if (!exists) missingRanges.push(range);
  }

  if (outlierRanges.size > 0) {
    console.log('\nNon-Latin outlier characters (not bundled; e.g. upstream OSM placeholder nodes):');
    for (const [range, samples] of outlierRanges.entries()) {
      console.log(`  SKIP   ${range}.pbf  [${[...samples].join(', ')}]`);
    }
  }

  if (missingRanges.length === 0) {
    console.log('\nAll required offline SDF glyph ranges are present.');
    return;
  }

  if (!shouldFetch) {
    console.error(
      `\nMissing ${missingRanges.length} required glyph range(s). Re-run with FETCH=true to download them.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(FONTS_DIR, { recursive: true });
  for (const range of missingRanges) {
    const url = `${UPSTREAM_GLYPH_BASE}/${range}.pbf`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(FONTS_DIR, `${range}.pbf`), buf);
    console.log(`Downloaded ${range}.pbf (${(buf.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
