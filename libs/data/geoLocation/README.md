# GeoLocation Data & Resolver

Administrative boundary TopoJSON files (`MW.topo.json`, `ZM.topo.json`, `ZW.topo.json`) are generated from OpenStreetMap boundary relations by `geo-data`:

- App: https://geo-data.picsa.app/
- API: `https://geo-data-api.picsa.app/boundaries/{COUNTRY_CODE}.topojson`
- Repo: https://github.com/e-picsa/geo-data

Each TopoJSON feature includes `id`, `name`, `admin_level`, `center` (`[longitude, latitude]`), and `center_source`.

## Structure

Each country is self-contained under `libs/data/geoLocation/<cc>/`:

- `<cc>/index.ts` exports the country's `IGeolocationData` (`topoJson`, `layers`, and `toolLayers`).
- `<cc>/<tier>.ts` holds the static location list for each tier (e.g. `provinces.ts`, `districts.ts`, `epas.ts`).
- `<cc>/<CC>.topo.json` holds the OSM boundary geometry.
- `libs/data/geoLocation/index.ts` registers countries in `GEO_LOCATION_DATA` and exposes `getGeoLocationData`, types, and resolver utilities.

## Mental Model

Each country's `IGeolocationData` explicitly declares:

1. **`layers`**: Ordered hierarchy from root (`layers[0]`) to leaf (`layers[layers.length - 1]`).
   - Child layers specify `parentLayer` and map each entry's parent reference to `parentId`.
   - Polygon layers set `topoAdminLevel`; point-only layers (e.g. Malawi EPAs) omit it and supply `coordinates` so `getLocationTopoFeature` walks up `parentId` to the parent polygon.
2. **`toolLayers`** (required): Explicit `Record<GeoToolKey, string>` mapping every tool (`cropProbability`, `forecast`, `climate`) to its target `layer.key`. Adding a new deeper layer will never silently change an existing tool's tier.

| Country            | Layers (Root → Leaf)                | `forecast` | `cropProbability` | `climate`  |
| ------------------ | ----------------------------------- | ---------- | ----------------- | ---------- |
| `mw` (current)     | `district` (`4`)                    | `district` | `district`        | `district` |
| `mw` (EPA-enabled) | `district` (`4`) → `epa` (points)   | `district` | `epa`             | `epa`      |
| `zm`               | `province` (`4`) → `district` (`5`) | `district` | `district`        | `district` |
| `zw`               | `province` (`4`) → `district` (`6`) | `district` | `district`        | `district` |

## Adding a New Country

1. Create `libs/data/geoLocation/<cc>/` containing `<CC>.topo.json`, per-tier `.ts` files, and an `index.ts` exporting `<CC>_GEOLOCATION_DATA: IGeolocationData` with explicit `toolLayers`.
2. Register the country in `GEO_LOCATION_DATA` in `libs/data/geoLocation/index.ts`.
3. Add the country code to the manifest integrity test in `libs/data/geoLocation/utils.spec.ts`.

## Enabling Malawi EPAs (When EPA Crop Tables Are Ready)

1. In `libs/data/geoLocation/mw/index.ts`, import `MW_EPAS` and add it as the second layer (`key: 'epa'`, `parentLayer: 'district'`, no `topoAdminLevel`).
2. Update `toolLayers` in `mw/index.ts` to `{ cropProbability: 'epa', forecast: 'district', climate: 'epa' }` (or keep `climate: 'district'` if desired).
3. Re-sync MW crop probability tables (`yarn scripts:crop:sync --country=mw`).
