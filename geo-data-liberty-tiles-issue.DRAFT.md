## Overview & Motivation

In `picsa-apps`, `PicsaMapComponent` (`libs/shared/src/features/map/map.ts`) has been migrated from the hybrid Leaflet + `@maplibre/maplibre-gl-leaflet` bridge to **pure MapLibre GL JS**. The component now renders:

- **Online, zoom ≥ 9**: OpenFreeMap Liberty vector style (`https://tiles.openfreemap.org/styles/liberty`).
- **Offline, or zoom < 9**: packaged static raster tiles (`assets/mapTiles/raw/{z}/{x}/{y}.webp`, z0–8) bundled into the app.

The offline raster currently comes from `POST /export-tiles`, which serves **OSM standard (osm-carto) cartography**. The result is a visible style discontinuity at the zoom-9 handoff: users drop from Liberty vector rendering into osm-carto raster and back as they pinch-zoom. Since the app deliberately gates metered vector tiles to zoom ≥ 9 (offline-first, Android bandwidth constraints), the bundled raster is the *primary* basemap — it should look like the same map.

## Requirement: Liberty-styled static tile export

Add an export path (new `POST /export-liberty-tiles` endpoint, or a `style` parameter on the existing `/export-tiles`) that renders raster tiles with the **actual Liberty style JSON** instead of OSM standard raster.

### Suggested implementation

1. **Vector source**: build a per-country `.mbtiles` with **Planetiler** from the Geofabrik PBF extracts the API already downloads. Planetiler emits the **OpenMapTiles schema**, which is exactly what the Liberty style expects — no style fork required.
2. **Renderer**: run **TileServer-GL** (or equivalent) against the local `.mbtiles` with the Liberty style JSON (fetch once from `tiles.openfreemap.org`, rewrite `sources` to the local file). Cache the referenced **font glyphs and sprite sheets** alongside, as offline rendering needs them and they are the fiddliest dependency.
3. **Tile walk**: render z0–8 within the existing per-country bbox logic, convert to WebP via the existing `sharp` step, package as `.tar.gz`.

### Output contract (must stay stable — the app depends on it)

- `{z}/{x}/{y}.webp` layout, zooms 0–8, per-country bbox, `.tar.gz` archive.
- Add a small manifest to the archive (style id + revision, source data date, content hash) so app and tiles cannot silently drift out of sync.
- Keep the z0–8 cap: the current cap exists to respect OSM's tile usage policy, which no longer applies to self-rendered tiles — but the app bundle stays at ~1–2 MB and overscales above native zoom, so there is no reason to grow it.

### Run as a batch job, not a request path

Rendering is far too heavy for Cloud Run request handling. Pre-generate on a schedule (e.g. weekly CI, aligned with planet/PBF refreshes) into GCS alongside the existing `CACHE_BUCKET`, and expose a lightweight download endpoint for the prebuilt archives.

## Acceptance criteria

- [ ] New export produces a `.tar.gz` of WebP tiles in the identical layout/zoom range as `/export-tiles`.
- [ ] Side-by-side comparison at zoom 8/9 shows no cartographic discontinuity (same palette, road styling, labels) versus live Liberty vector.
- [ ] Archive includes a manifest with style id, data date, and content hash.
- [ ] Generation runs as a scheduled batch job with GCS output (no on-demand rendering in the API path).
- [ ] No changes required in `picsa-apps` (drop-in replacement of the checked-in `mapTiles` assets).

## Out of scope

- Offline **vector** tiles (per-country PMTiles + same Liberty style) — the correct long-term follow-up for offline high-zoom, but explicitly deferred until offline high-zoom is actually required. The app component is already vector-native and will only need a source swap.
- Any change to the existing `/export-tiles` OSM-standard output (keep it until the Liberty export is validated as a replacement).
