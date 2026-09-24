import type { IStationData } from '@picsa/models';

export type DiffChangeType = 'year_added' | 'year_removed' | 'value_changed';

export interface IClimateProductDefinition {
  id: string;
  label: string;
  keys: (keyof IStationData)[];
  units: string;
}

export const CLIMATE_PRODUCTS: IClimateProductDefinition[] = [
  { id: 'rainfall', label: 'Rainfall', keys: ['Rainfall'], units: 'mm' },
  { id: 'start', label: 'Start of Season', keys: ['Start'], units: 'doy' },
  { id: 'end', label: 'End of Season', keys: ['End'], units: 'doy' },
  { id: 'length', label: 'Season Length', keys: ['Length'], units: 'days' },
  { id: 'temp_min', label: 'Min Temperature', keys: ['mean_tmin', 'min_tmin'], units: '°C' },
  { id: 'temp_max', label: 'Max Temperature', keys: ['mean_tmax', 'max_tmax'], units: '°C' },
  { id: 'extremes', label: 'Extreme Events', keys: ['Extreme_events'], units: 'days' },
];

export interface IValueDiff {
  year: number;
  productId: string;
  productLabel: string;
  field: string;
  appValue: number | null;
  dbValue: number | null;
  diff: number | null;
  type: DiffChangeType;
}

export interface IProductDiffSummary {
  productId: string;
  label: string;
  units: string;
  yearsAdded: number[];
  yearsRemoved: number[];
  changedCount: number;
  changes: IValueDiff[];
  appYearSpan: [number, number] | null;
  dbYearSpan: [number, number] | null;
  hasData: boolean;
  isInSync: boolean;
}

export type StationDiffStatus = 'in_sync' | 'diff' | 'app_only' | 'db_only' | 'no_data';

export interface IStationDiffSummary {
  stationId: string;
  hasAppData: boolean;
  hasDbData: boolean;
  status: StationDiffStatus;
  totalYearsAddedCount: number;
  totalYearsRemovedCount: number;
  totalChangedValuesCount: number;
  products: Record<string, IProductDiffSummary>;
}
