# GeoLocation Data & Resolver

Data is generated via https://geo-data.picsa.app/
Code available at: https://github.com/e-picsa/geo-data

## Mental Model

Each country in `data.ts` declares:

1. **`layers`**: Ordered hierarchy from root (`layers[0]`) to leaf (`layers.at(-1)`).
   - Child layers specify `parentLayer` (defaults to the previous layer).
   - Polygon layers set `topoAdminLevel`; point-only layers (e.g. Malawi EPAs) omit it and supply `coordinates` so `getLocationTopoFeature` walks up `parentId` to the parent polygon.
2. **`toolLayers`** (optional): Maps `GeoToolKey` (`cropProbability`, `forecast`, `climate`) to a specific `layer.key` only when a tool operates at a coarser tier than the deepest layer. Omitted tools default to the deepest layer.

| Country            | Layers (Root → Leaf)                | `forecast` | `cropProbability` | `climate`  |
| ------------------ | ----------------------------------- | ---------- | ----------------- | ---------- |
| `mw` (current)     | `district` (`4`)                    | `district` | `district`        | `district` |
| `mw` (EPA-enabled) | `district` (`4`) → `epa` (points)   | `district` | `epa`             | `epa`      |
| `zm`               | `province` (`4`) → `district` (`5`) | `district` | `district`        | `district` |
| `zw`               | `province` (`4`) → `district` (`6`) | `district` | `district`        | `district` |

## Adding a New Country

1. Add `<CC>.topo.json` and per-tier `.ts` files under `libs/data/geoLocation/<cc>/`.
2. Register the country in `GEO_LOCATION_DATA` in `data.ts`. Add `toolLayers` only if tools differ in tier.
3. Add the country code to the manifest integrity test in `utils.spec.ts`.

## Enabling Malawi EPAs (When EPA Crop Tables Are Ready)

1. Import `MW_EPAS` in `data.ts` as the second layer (`key: 'epa'`, `parentLayer: 'district'`, no `topoAdminLevel`).
2. Add `toolLayers: { forecast: 'district' }` to `GEO_LOCATION_DATA['mw']`.
3. Re-sync MW crop probability tables (`yarn scripts:crop:sync --country=mw`).
