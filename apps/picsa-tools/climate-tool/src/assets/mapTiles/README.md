# Offline Map Tiles & SDF Font Glyphs

This directory contains the offline vector basemap archives (`.pmtiles`) and MapLibre GL JS font glyphs used by `PicsaMapComponent` (`libs/shared/src/features/map/`).

## Contents

- `global-base.pmtiles` — World basemap (`z0–3`) plus shared Southern Africa (`z4–6`) coverage (`mobile` preset).
- `<country>.pmtiles` (`mw`, `zm`, `zw`) — Polygon-masked country detail extracts (`z7–9/10/11`, `mobile` preset), overscaled offline and optionally falling back to online tiles above each archive's `maxzoom`.
- `fonts/Noto Sans Regular/<range>.pbf` — Pre-rendered Signed Distance Field (SDF) glyph blocks required by MapLibre GL JS to render map labels on the WebGL canvas.

> **Why `.pbf` glyphs exist alongside `libs/theme/src/fonts/noto-sans.woff2`**
>
> The app's UI uses `noto-sans.woff2`, which WebGL shaders cannot read. MapLibre requires pre-rendered SDF protobuf blocks (`{start}-{end}.pbf`) matching `"text-font": ["Noto Sans Regular"]` in `libs/shared/src/features/map/pmtiles-style.ts`. Only the Unicode ranges actually used by bundled map labels are included here to keep APK size minimal.

## Verifying or Adding Glyph Ranges

When updating `.pmtiles` files or adding new countries, verify that all rendered Latin/punctuation characters in the archives have matching local `.pbf` files:

```bash
yarn scripts map/verify-map-glyphs
```

If missing ranges are reported (or if MapLibre logs a 404 on a `.pbf` glyph block for a new language/country), download the missing blocks automatically:

```bash
FETCH=true yarn scripts map/verify-map-glyphs
```

_Note: `project.json` excludes `**/*.md` from `assets/mapTiles` so this `README.md` is not bundled into app or dashboard builds._
