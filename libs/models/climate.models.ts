import type * as c3 from 'c3';

export interface ICropRequirement {
  crop: string;
  variety: string;
  image: string;
  name: string | null;
  daysMin: number;
  daysMax: number | null;
  waterMin: number;
  waterMax: number | null;
}

export interface IStationMeta {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  location: string[];
  /** Definitions for charts */
  definitions: IChartDefinitions;
  /**
   * Mark station in draft state (e.g. pending data approval)
   * Draft stations appear in global deployment but not country-specific
   **/
  draft?: boolean;
  /**
   * Station capability and data availability descriptor (generated at build/sync time)
   */
  capabilities?: IStationCapabilities;
}

export interface IStationData {
  Year: number;
  Start: number;
  End: number;
  Length: number;
  Rainfall: number;
  Extreme_events: number;
  max_tmax?: number;
  max_tmin?: number;
  min_tmax?: number;
  min_tmin?: number;
  mean_tmax?: number;
  mean_tmin?: number;
}

/**
 * Wide-format monthly station record representing 1 month of historical observations.
 */
export interface IMonthlyStationData {
  /** Month in YYYY-MM format, e.g. '1944-07' */
  month: string;
  /** Total rainfall for the month (mm) */
  Rainfall?: number | null;
  /** Lowest minimum daily temperature for the month (°C) */
  min_tmin?: number | null;
  /** Mean minimum daily temperature for the month (°C) */
  mean_tmin?: number | null;
  /** Mean maximum daily temperature for the month (°C) */
  mean_tmax?: number | null;
  /** Highest maximum daily temperature for the month (°C) */
  max_tmax?: number | null;
  /** Lowest maximum daily temperature for the month (°C) */
  min_tmax?: number | null;
  /** Highest minimum daily temperature for the month (°C) */
  max_tmin?: number | null;
}

/**
 * Station capability and data availability descriptor.
 * Enables synchronous chart filtering and UI badge generation without parsing data files.
 */
export interface IStationCapabilities {
  /** ISO timestamp of when this station's data was generated or synced */
  lastUpdated?: string;
  /** Deterministic content hash (e.g. SHA-256) of station data for cache invalidation */
  contentHash?: string;
  /** Schema version of the data format */
  schemaVersion: number;
  /** Earliest and latest historical years with data, e.g. [1946, 2024] */
  years?: [number, number];
  /** Available annual chart types */
  annual?: IChartId[];
  /** Available monthly metrics */
  monthly?: {
    hasRainfall: boolean;
    hasTemperature: boolean;
  };
}

/**
 * Representation of country-defined 3-month climatological periods
 * (e.g. OND, NDJ, DJF, JFM, FMA).
 * Note: Labels are formatted dynamically from month indices to support i18n without hardcoding text.
 */
export interface IThreeMonthPeriod {
  /** Unique period identifier, e.g. 'djf' */
  id: string;
  /** Short uppercase meteorological code, e.g. 'DJF' */
  code: string;
  /** 1-indexed months comprising the 3-month period, e.g. [12, 1, 2] */
  months: [number, number, number];
  /** Whether this is considered the primary agricultural / rainy period */
  primary?: boolean;
}

/** Backward compatibility alias */
export type IThreeMonthSeason = IThreeMonthPeriod;

/** Supported timespan display resolutions */
export type ClimateTimespanMode = 'annual' | 'monthly' | 'three_month';

export type IChartConfig = Partial<c3.ChartConfiguration>;

export type IChartId = 'start' | 'end' | 'length' | 'rainfall' | 'extreme_rainfall_days' | 'temp_min' | 'temp_max';
export type IChartDefinitions = { [id in IChartId]: IChartMeta };

export interface IChartMeta {
  _id: IChartId;
  /** Disable a chart from display */
  disabled?: boolean;
  name: string;
  shortname: string;
  image: string;
  /** Column names for data series */
  keys: (keyof IStationData)[];
  /** Optional override of text to show legend instead of data name */
  data_labels?: Record<string, string>;
  /** Colors for data series */
  colors: string[];
  yFormat: 'value' | 'date' | 'date-from-July';
  yLabel: string;
  xVar: keyof IStationData;
  xLabel: string;
  tools: IChartTools;
  units: string;
  definition: string;
  /** Methodology definition for monthly timespan view (e.g. for info tooltip / chart description) */
  definitionMonthly?: string;
  /** Methodology definition for 3-month seasonal timespan view (e.g. for info tooltip / chart description) */
  definitionThreeMonth?: string;
  legend?: {
    /** Specify whether to show chart legend */
    show?: boolean;
  };
  tooltip?: {
    /** Specify whether to group data series when displaying tooltip */
    grouped?: boolean;
  };
  axes: {
    /** Min/max values (default calculate from data) */
    yMin: number;
    yMax: number;
    xMin: number;
    xMax: number;
    /** Major/minor gridlines */
    xMinor: number;
    xMajor: number;
    yMinor: number;
    yMajor: number;
  };
}

/*************************************************************************
 *                            Tools
 ************************************************************************/
export interface IGenericToolOptions {
  enabled?: boolean;
}

export interface IChartTools {
  line?: ILineToolOptions;
  probability?: IProbabilityToolOptions;
  terciles?: IGenericToolOptions;
  el_nino?: IGenericToolOptions;
  la_nina?: IGenericToolOptions;
}

export interface ILineToolOptions {
  /** Specify if tool should be available */
  enabled?: boolean;
  /** Display config for points above line */
  above: {
    color: string;
  };
  /** Display config for points below line */
  below: {
    color: string;
  };
}
export interface IProbabilityToolOptions {
  /** Specify if tool should be available */
  enabled?: boolean;
  above: {
    /** label to populate for 'above' summary */
    label: string;
  };
  below: {
    /** label to populate for 'below' summary */
    label: string;
  };
  /** reverse probabilities to show 'below' values first */
  reverse?: boolean;
}

/*************************************************************************
 *                     Sync, Ingestion & Audit Models
 ************************************************************************/

/** Incoming long-format climate observation record from upstream data system */
export interface IIncomingClimateRecord {
  station_id: string;
  /** Time value formatted as 'YYYY-MM' or date string */
  time_value: string;
  /** Numeric observation value or null */
  summary_value: number | null | undefined;
  /** Element key: 'rainfall', 'mean_tmin', 'mean_tmax', 'min_tmin', 'max_tmax', etc. */
  summary_element: string;
}

/** Record of a change detected in previously published historical data */
export interface IHistoricalRevision {
  stationId: string;
  month: string;
  metric: string;
  oldValue: number | null;
  newValue: number | null;
  diff: number;
}

/** Record of physical consistency check failure */
export interface ISanityViolation {
  stationId: string;
  month: string;
  rule: string;
  message: string;
  values: Record<string, unknown>;
}

/** Summary of automated change detection and data health inspection */
export interface IClimateAuditReport {
  timestamp: string;
  totalStationsProcessed: number;
  stationsSummary: Array<{
    id: string;
    status: 'NEW' | 'UPDATED' | 'UNCHANGED';
    years?: [number, number];
    hasRainfall: boolean;
    hasTemperature: boolean;
    hash?: string;
  }>;
  historicalRevisions: IHistoricalRevision[];
  missingnessRegressions: Array<{
    stationId: string;
    month: string;
    metric: string;
    previousValue: number;
  }>;
  sanityViolations: ISanityViolation[];
}
