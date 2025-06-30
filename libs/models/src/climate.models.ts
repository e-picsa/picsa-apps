import * as c3 from 'c3';

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
  district?: string;
  /** Data summaries for charts */
  data?: IStationData[];
  /** Definitions for charts */
  definitions: IChartDefinitions;
  /**
   * Mark station in draft state (e.g. pending data approval)
   * Draft stations appear in global deployment but not country-specific
   **/
  draft?: boolean;
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
  tools: { line: ILineToolOptions; probability: IProbabilityToolOptions };
  units: string;
  definition: string;
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
export interface ILineToolOptions {
  /** Specify if tool should be available */
  enabled: boolean;
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
