# Crop Variety Extractor & Maturity Days Audit Script

## Overview & Motivation

Historically, crop variety details and maturity durations (days) for weather stations were extracted from legacy Word (`.docx`) documents into static station sheets.

The primary goal of this tool is to **retrofit and structure this historical data** to populate the central database with clean, standardized crop variety information. By storing individual crop varieties and maturity days (`days_lower` and `days_upper`) in the database, PICSA can **automatically recalculate crop probability tables** whenever updated climate or station data becomes available.

This script parses existing station JSON files (in Malawi `mw` and Zimbabwe `zw`), extracts individual crop varieties from compound strings, normalizes maturity durations, resolves multi-range discrepancies via modal selection, and exports DB-ready primary and downscaled CSV files.

---

## Co-Located Files & Project Layout

All files for this script are co-located in this directory:

- **`index.ts`**: The main runner script. Reads station JSON files, parses variety strings, performs modal frequency range selection, formats DB CSV rows, and writes output files.
- **`parser.ts`**: Utility functions (`parseVarietyString`, `parseDaysRange`, `roundToNearest`) containing tokenizers, prefix carry-over logic, and parenthetical alias protection rules.
- **`cleaning-rules.ts`**: Dedicated data cleaning module for explicit pre-processing regexes, brand prefix splitting, space-to-hyphen formatting, and crop remapping.
- **`parser.spec.ts`**: Self-contained unit test suite validating variety string tokenization, prefix carry-over, local name extraction, and days range parsing.
- **`.gitignore`**: Excludes temporary `output/` files from source control.
- **`output/`** *(Generated at runtime, git-ignored)*:
  - `crop_data_rows.[country].csv`: Primary database catalog CSV (`country_code,crop,variety,maturity_period,days_lower,days_upper,additional_info,additional_data`).
  - `crop_data_downscaled_rows.[country].csv`: Secondary station downscaled water requirements CSV (`country_code,location_id,water_requirements,override_data,station_id`).

---

## How to Run

Execute commands from the monorepo root using `yarn`:

### 1. Run Unit Tests

```sh
yarn scripts picsa/crop-probability/extract-varieties/parser.spec
```

### 2. Run Main Extraction & DB Export Script

```sh
yarn scripts picsa/crop-probability/extract-varieties/index
```

---

## Output CSV Files & Database JSON Structure

The script outputs database-ready CSV artifacts inside `output/`:

1. **`crop_data_rows.mw.csv` & `crop_data_rows.zw.csv`**:
   - Primary database catalog rows matching the Supabase `crop_data` table schema.
   - Discrepant ranges across stations are resolved by picking the **most common (modal) range** for `days_lower` and `days_upper`.
   - **`additional_data` JSON Structure**:
     ```json
     {
       "local_name": "KALULU",
       "days_comment": "Noted ranges across stations: 90-90 (19 stations); 80-80 (10 stations)"
     }
     ```

2. **`crop_data_downscaled_rows.mw.csv` & `crop_data_downscaled_rows.zw.csv`**:
   - Secondary station-level downscaled water requirements matching Supabase `crop_data_downscaled` table schema.
   - Maps station IDs to JSON objects `{ "[crop]": { "[standardized_variety]": rounded_water_mm } }`.

---

## Key Parsing Rules & Enhancements

- **Prefix Carry-Over for Numbered Varieties**: Bare numbers or number-led tokens inherit the brand/series prefix from preceding varieties in the same entry (e.g. `"SC 777, 529"` -> `SC-777`, `SC-529` | `"SC719, 725 Njovu"` -> `SC-719`, `SC-725`).
- **Local Name Extraction**: Bracketed local names (e.g. `(Mbidzi)`, `(Kalulu)`, `(Kanyani)`) are extracted into `local_name` and stored in `additional_data` JSON (`"local_name": "MBIDZI"`), keeping canonical variety IDs clean (`SC-537`).
- **Variety Naming Standardization**: Converted to **UPPERCASE** with hyphens separating brand prefixes and model numbers (e.g. `SC 419` -> `SC-419`, `PAN 3M-01` -> `PAN-3M-01`, `PEACOCK 10` -> `PEACOCK-10`).
- **Rounding to Nearest 5**: All day ranges (`days_lower`, `days_upper`) and water requirements are rounded to the nearest multiple of 5 using `roundToNearest(val, 5)` (duplicated from `apps/picsa-apps/dashboard/src/app/modules/crop-information/utils/probability.utils.ts`).
