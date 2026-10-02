# Upstream Climate API Anomalies & Station Metadata Overrides

This document records known data quality issues, naming anomalies, coordinate errors, and district omissions in the upstream climate data system (`https://api.epicsa.idems.international/v2`), alongside the client-side corrections and overrides defined in `@picsa/climate-tool` station metadata (`src/app/data/stations/*/metadata.ts`).

> [!NOTE]
> **Future Refactoring Goal**:
> Currently, station metadata files define comprehensive lists of stations. As the upstream data system stabilizes, these files should transition into **lean override maps** (specifying only required corrections such as invalid coordinates, missing districts, and custom chart definitions).

---

## 1. General Architectural Traps & Upstream Patterns

### A. Non-Destructive Ingestion (Preservation Strategy)

The upstream API periodically returns `district: null`, missing coordinates (`null` or `0, 0`), or empty arrays during service updates.

- **Edge Function Guard** (`apps/picsa-server/supabase/functions/dashboard/climate/index.ts`):
  - Pre-fetches existing database records for the country (`station_id, district, met_station_id, latitude, longitude`).
  - **Preserves existing non-null DB values**: Once a district, WMO station ID, or verified coordinate is populated in the database, upstream syncs **cannot** overwrite it with `null` or `0`.
  - **Rejects Empty Summaries**: If an upstream summary endpoint returns empty data, the sync preserves existing DB station data rather than purging it.
- **Database Check Constraint**:
  - `climate_stations_valid_coords` ensures that `(0, 0)` Atlantic Ocean coordinates or out-of-range latitude/longitude pairs are physically rejected by Postgres.

### B. Foreign Key Relationships

- `climate_station_data.station_id` references `climate_stations.id` (composite `country_code/station_id`).
- `crop_data_downscaled.station_id` references `climate_stations.id` with `ON UPDATE CASCADE ON DELETE SET NULL`.
- Whenever stations are migrated or pruned, references in `crop_data_downscaled` must be mapped to the canonical station or nullified prior to deleting legacy records to prevent transaction rollbacks.

---

## 2. Zimbabwe (`zw`)

### Upstream Issues

1. **Naming Convention Shift & Trailing Underscores**: Upstream transitioned station IDs from short names (`buffalo_range`, `masvingo`) to meteorological suffixes (`_met`), but string sanitization errors produced double underscores and trailing underscores (e.g. `buffalo_range__met_`, `masvingo_airport__met_`, `matopos_res__stn___met_`).
2. **Numeric WMO Identifier Collisions**: Zimbabwe Meteorological Services Department (MSD) numeric IDs (e.g. `67991020`, `67977040`) were returned as station IDs, causing regex slugification to generate collision strings like `zw/________`.
3. **Missing Districts**: Upstream API returns `district: null` for all Zimbabwe stations.
4. **Missing Stations**: `mt_darwin` is present in app metadata, bundled summaries, and capabilities, but is absent from upstream `/v2/station/zw`.

### Metadata Corrections (`src/app/data/stations/zw/metadata.ts`)

- **Canonical IDs**: Clean single-underscore slugs matching incoming data (`beitbridge_met`, `buffalo_range_met`, `masvingo_airport_met`, etc.).
- **Numeric ID Extraction**: Numeric MSD IDs mapped to `metStationId` (e.g. `metStationId: '67991020'` for Beitbridge).
- **Administrative Districts**: Localized districts populated (e.g. `Masvingo`, `Matabeleland South`, `Manicaland`, `Mashonaland Central`).
- **Coordinate Refinements**:
  - `chisumbanje_met`: Canonical `-20.8, 32.233` (legacy DB row had `-20.825, 32.204`).
  - `plumtree_met`: Canonical `-20.48, 27.8` (legacy DB row had `-20.483, 27.8`).

---

## 3. Zambia (`zm`)

### Upstream Issues

1. **Climsoft 8-Character Key Duplication**: The upstream database ingests Climsoft tables containing both canonical station names (`CHIPATA MET`) and legacy 8-character database keys (`CHIPAT01`, `LUNDAZ01`, `MFUWE001`, `MSEKER01`, `PETAUK01`). This created corrupted duplicate records (`chipat__`, `lundaz__`, `petauk__`).
2. **Redundant AWS Duplicates**: Automatic Weather Station entries (e.g., `CHIPATA MET AWS`, `LUSAKA CITY AIRPORT AWS`) duplicate historical manual stations and cause chart fragmentation.
3. **Severe Coordinate Errors**:
   - `chipepo_met`: Upstream Climsoft coordinates are `-16.79, 27.88`, which places the station ~111 km away in the middle of Lake Kariba (Sinazongwe).
   - `mpulungu_met`: Upstream coordinates are `0, 0` (Gulf of Guinea / Atlantic Ocean).
   - `petauk__`: Swapped latitude and longitude with inverted signs (`31.28, -14.25`).
   - `muyombe_camp`: Missing coordinates (`null, null`).
4. **Missing / Partial Districts**: Upstream omits or inconsistently formats district names.

### Metadata Corrections (`src/app/data/stations/zm/metadata.ts`)

- **Coordinate Overrides**:
  - `chipepo_met`: Overridden to `-15.79, 28.14` (Gwembe district).
  - `mpulungu_met`: Overridden to `-8.76, 31.1` (Lake Tanganyika port).
  - `muyombe_camp`: Corrected to `-10.59, 33.46` (Mafinga district).
  - `petauke_met`: Canonical `-14.25, 31.28`.
- **Filtering**: Edge function filters out 8-character Climsoft codes and redundant AWS duplicates when canonical stations exist.
- **Draft Stations**: `kabwe_agro` flagged as draft (preferring `kabwe_met` for climate summaries).

---

## 4. Malawi (`mw`)

### Upstream Issues

1. **V1 to V2 Migration Gap**: Upstream `/v2` API currently returns 0 stations/summaries for Malawi while backend migration is underway. Empty responses must not wipe out existing database records.
2. **Missing Districts**: Upstream omits districts for most stations.
3. **Missing & Imprecise Coordinates**:
   - `makanjira`: Missing coordinates (`null, null`) in upstream database.
   - `namwera`: Upstream has approximate coordinates `-14.37, 35.5`.
   - `mimosa`: Upstream has `-16.07, 35.62` vs verified `-16.1, 35.6`.
   - `kasinthula`: Upstream has `-16.08, 34.83` vs verified `-16.1, 34.8`.
   - Minute-rounding offsets on 12 stations (`chichiri`, `dedza`, `karonga`, `kasungu`, `kia`, `mangochi`, `monkey_bay`, `mzuzu`, `nkhotakota`, `ntaja`, `salima`, `chitipa`).
4. **Data Quality Flags (Pending Validation)**:
   - `Chiradzulu`: Erroneously high rainfall spike in 2015–16.
   - `Luwazi`: Zero values prior to 1968 (valid data starts 1968).
   - `Kamuona`, `Mzandu`, `Nalunga`: Incomplete final observation years.
   - `Kasiya`: Extreme outlier value in 2015–16.
   - `Mtakataka`: Incomplete records prior to 1947 (valid data starts 1947–48).

### Metadata Corrections (`src/app/data/stations/mw/metadata.ts`)

- **Coordinate Overrides**:
  - `makanjira`: Set to `-13.7050735, 35.037632`.
  - `namwera`: Set to `-14.3530807, 35.4706477`.
  - `mimosa`: Set to `-16.1, 35.6`.
  - `kasinthula`: Set to `-16.1, 34.8`.
- **Districts**: Fully mapped across all 28 districts (Karonga, Balaka, Rumphi, Thyolo, Mzimba, Zomba, Blantyre, Chikwawa, Lilongwe, Nkhata Bay, Chiradzulu, Salima, Chitipa, Dedza, Dowa, Nkhotakota, Kasungu, Mangochi, Nsanje, Ntchisi, Mchinji, Mulanje, Ntcheu, Mwanza, Phalombe, Neno, Machinga).
- **Draft Status**: Stations with known data anomalies are marked with `draft: true` until upstream data cleaning completes.

---

## 5. Transitioning to Lean Metadata Overrides

When upstream fixes are deployed, `metadata.ts` files should be trimmed to only export an `OVERRIDES` object:

```typescript
// Proposed future lean structure:
export const STATION_OVERRIDES: Record<string, Partial<IStationMeta>> = {
  chipepo_met: {
    latitude: -15.79,
    longitude: 28.14,
    location: ['GWEMBE'],
  },
  mpulungu_met: {
    latitude: -8.76,
    longitude: 31.1,
  },
  // Custom chart definitions / draft flags only
};
```

Until upstream confirms coordinates and district inclusion across `/v2/station/{country}`, comprehensive metadata files remain active as the primary offline source of truth.
