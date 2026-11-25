/**
 * Shared merge types for the MW consultant EPA import (no runtime imports).
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

export interface ICleanedOccurrence {
  blockKey: string;
  locationId: string;
  crop: string;
  variety: string;
  localName?: string;
  daysLower: number;
  daysUpper: number;
  daysRaw: string;
  maturity: string | null;
  water: number;
  stationRaw: string | null;
}

export interface IWaterSample {
  water: number;
  blockKey: string;
  stationId: string | null;
  daysLower: number;
  daysUpper: number;
}

export interface IVarietyAcc {
  crop: string;
  variety: string;
  waters: number[];
  dayPairs: Map<string, { lower: number; upper: number; count: number }>;
  maturities: Map<string, number>;
  localNames: Set<string>;
  blocks: Set<string>;
}

export interface IVarietyDef {
  country_code: string;
  crop: string;
  variety: string;
  maturity_period: string | null;
  days_lower: number;
  days_upper: number;
  additional_info: string | null;
  additional_data: {
    local_name?: string;
    source: string;
    blocks: string[];
  };
}

export interface IDownscaledRow {
  country_code: string;
  location_id: string;
  water_requirements: Record<string, Record<string, number>>;
  station_id: string | null;
}

export interface IWaterConflict {
  location_id: string;
  crop: string;
  variety: string;
  samples: { water: number; blockKey: string; stationId: string | null }[];
  chosen: number;
  strategy: 'mean' | 'nearest-epa' | 'modal-days';
  /** Modal-days alignments only: samples outside the kept days group. */
  dropped?: { water: number; blockKey: string; daysLower: number; daysUpper: number }[];
}
