/**
 * Shared raw block types for the MW consultant EPA import.
 *
 * Kept free of heavy imports so generated verification files
 * (`intermediates/blocks/index.ts`) can import these types for compile-time
 * checking of the parsed JSON without pulling in the whole pipeline.
 */

export interface IRawRow {
  rowNumber: number;
  /** Block district (col A), forward-filled from the block header */
  district: string | null;
  /** Block agro-ecological zone (col B), forward-filled from the block header */
  agroZone: string | null;
  cropRaw: string | null;
  varietyRaw: string | null;
  localRaw: string | null;
  maturityRaw: string | null;
  daysRaw: string | null;
  waterRaw: number | null;
  waterText: string | null;
  sourceRaw: string | null;
}

export interface IEpaBlock {
  /** Stable block id: `<sheet>::<station-slug>` (no row numbers) */
  key: string;
  sheet: string;
  startRow: number;
  districtRaw: string | null;
  agroZoneRaw: string | null;
  stationRaw: string | null;
  latitude: number | null;
  longitude: number | null;
  reasonRaw: string | null;
  /** Canonical EPA id(s) read back from the xlsx `epa_canonical` column */
  epaColumnRaw: string | null;
  rows: IRawRow[];
}
