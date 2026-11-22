# SVG Audit Report

Generated: 2026-11-22T17:32:25.024Z

## Totals

- SVGs in app bundle: **212** (936.0 KB)
- Dead/unreferenced: **19** (29.0 KB)
- Ambiguous (human review): **6**
- Byte-identical duplicate groups: **8**

## Asset globs (apps/picsa-apps/app/project.json)

- `apps/picsa-apps/app/src/assets`
- glob `**/*` input `apps/picsa-apps/app/src/static` -> output `/`
- glob `**/*` input `libs/shared-assets/favicon` -> output ``
- glob `**/*` input `libs/shared-assets/` -> output `assets` ignore `favicon/**/*`
- glob `*.json` input `libs/i18n/assets` -> output `assets/i18n`
- glob `**/*` input `apps/picsa-tools/budget-tool/src/assets` -> output `assets`
- glob `*.svg` input `libs/data/crops/svgs` -> output `assets/budget-cards`
- glob `*.svg` input `libs/data/crops/svgs` -> output `assets/svgs/crops`
- glob `*.svg` input `libs/data/weather/svgs` -> output `assets/svgs/weather`
- glob `*` input `libs/data/crop_activity/svgs` -> output `assets/svgs/crop_activity`
- glob `*.svg` input `libs/data/farmer_content/svgs` -> output `assets/svgs/farmer_content`
- glob `*.svg` input `libs/data/tools/svgs` -> output `assets/svgs/tools`
- glob `**/*` input `libs/data/climate/climate-icons` -> output `assets/climate-icons`
- glob `**/*` input `apps/picsa-tools/climate-tool/src/assets` -> output `assets`
- glob `**/*` input `apps/picsa-tools/manual-tool/src/assets` -> output `assets`
- glob `**/*` input `apps/picsa-tools/option-tool/src/assets` -> output `assets`
- glob `**/*` input `apps/picsa-tools/resources-tool/src/assets` -> output `assets`
- glob `**/*` input `apps/picsa-tools/seasonal-calendar-tool/src/assets` -> output `assets`
- glob `**/*` input `apps/picsa-tools/forecasts-tool/src/assets` -> output `assets`
- glob `{*.min.mjs,images/*,locale/en-US/*,locale/locale.json,standard_fonts/**}` input `node_modules/ngx-extended-pdf-viewer/assets/` -> output `/assets/pdf-viewer` ignore `**/*-es5.min.mjs`
- glob `supabase.config.json` input `libs/environments/src/supabase` -> output `assets`

## Duplicate groups (verify before dedupe)

### 4468fc63 (1.8 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/apply-pesticide.svg`
- `libs/data/crop_activity/svgs/pesticide_apply.svg`

### 3bae5f3a (2.1 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/banding.svg`
- `libs/data/crop_activity/svgs/banding.svg`

### b34c0502 (1.2 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/cattle.svg`
- `apps/picsa-tools/option-tool/src/assets/svgs/livestock-enterprise.svg`

### f6729764 (5.0 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/crop.svg`
- `apps/picsa-tools/option-tool/src/assets/svgs/crop-enterprise.svg`

### afbc7d95 (1.4 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/post-harvest-handling.svg`
- `libs/data/crop_activity/svgs/post_harvest_handling.svg`

### f83d5a29 (2.3 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/provide-supplements.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/supplements.svg`

### 9f155364 (1.9 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/transport.svg`
- `libs/data/crop_activity/svgs/transport.svg`

### 90c29571 (1.8 KB x2)
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/value-addition.svg`
- `libs/data/crop_activity/svgs/value_addition.svg`

## Dead files (no static or ID-derived consumer found)

> Do not delete without human review of the "ambiguous" dynamic-ID cases below.

- `libs/shared-assets/images/crop-analysis.svg` (7.1 KB) -> `assets/images/crop-analysis.svg`
- `libs/shared-assets/images/raw.svg` (4.1 KB) -> `assets/images/raw.svg`
- `libs/shared-assets/images/settings.svg` (2.4 KB) -> `assets/images/settings.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/livestock.svg` (2.4 KB) -> `assets/budget-cards/livestock.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/livelihood.svg` (2.1 KB) -> `assets/budget-cards/livelihood.svg`
- `libs/shared-assets/images/loaders/blocks.svg` (1.7 KB) -> `assets/images/loaders/blocks.svg`
- `libs/shared-assets/images/add_data.svg` (1.6 KB) -> `assets/images/add_data.svg`
- `libs/shared-assets/images/map.svg` (1.5 KB) -> `assets/images/map.svg`
- `libs/shared-assets/images/chart.svg` (1.2 KB) -> `assets/images/chart.svg`
- `libs/shared-assets/images/station.svg` (0.8 KB) -> `assets/images/station.svg`
- `libs/shared-assets/images/copy.svg` (0.8 KB) -> `assets/images/copy.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/days.svg` (0.8 KB) -> `assets/budget-cards/days.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/water.svg` (0.5 KB) -> `assets/budget-cards/water.svg`
- `libs/shared-assets/images/controls.svg` (0.5 KB) -> `assets/images/controls.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/other.svg` (0.4 KB) -> `assets/budget-cards/other.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/add.svg` (0.3 KB) -> `assets/budget-cards/add.svg`
- `apps/picsa-tools/budget-tool/src/assets/budget-cards/family-member.svg` (0.3 KB) -> `assets/budget-cards/family-member.svg`
- `libs/shared-assets/images/download.svg` (0.2 KB) -> `assets/images/download.svg`
- `libs/shared-assets/images/delete.svg` (0.2 KB) -> `assets/images/delete.svg`

## Ambiguous dynamic-ID cases (human decision required)

- `libs/data/tools/svgs/discussions.svg` -> assets/svgs/tools/discussions.svg
  - AMBIGUOUS: no TOOLS_DATA entry, only commented extension-content ref (likely dead)
  - static literal `assets/svgs/tools/discussions.svg`
- `libs/data/climate/climate-icons/crop-analysis.svg` -> assets/climate-icons/crop-analysis.svg
  - AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)
- `libs/data/climate/climate-icons/temperatures.svg` -> assets/climate-icons/temperatures.svg
  - AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)
- `libs/data/climate/climate-icons/extreme-drought.svg` -> assets/climate-icons/extreme-drought.svg
  - AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)
- `libs/data/climate/climate-icons/extreme-heat.svg` -> assets/climate-icons/extreme-heat.svg
  - AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)
- `libs/data/climate/climate-icons/combined-risk.svg` -> assets/climate-icons/combined-risk.svg
  - AMBIGUOUS: climate-icons not in chart_definitions - flag for human (likely dead, verify templates)

## Live files (sample)

Full consumer mapping is in `svg-audit-report.json`. 187 live files.
