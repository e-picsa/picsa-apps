import * as c3 from 'c3';

import { IDBDoc } from './db.models';

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
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string;
  /** Data summaries for charts */
  data?: IStationData[];
  /** Definitions for charts */
  definitions: IChartDefinitions;
}
export type IStationMetaDB = IStationMeta & IDBDoc;

export interface IStationData {
  Year: number;
  Start: number;
  End: number;
  Length: number;
  Rainfall: number;
  Extreme_events: number;
}

export type IChartConfig = Partial<c3.ChartConfiguration>;

export type IChartId = 'start' | 'end' | 'length' | 'rainfall' | 'extreme_rainfall_days';
export type IChartDefinitions = { [id in IChartId]: IChartMeta };

export interface IChartMeta {
  _id: IChartId;
  name: string;
  shortname: string;
  image: string;
  /** Column names for data series */
  keys: (keyof IStationData)[];
  /** Colors for data series */
  colors: string[];
  yFormat: 'value' | 'date' | 'date-from-July';
  yLabel: string;
  xVar: keyof IStationData;
  xLabel: string;
  tools: { line: boolean };
  units: string;
  definition: string;
  xMinor: number;
  xMajor: number;
  yMinor: number;
  yMajor: number;
  linetool?: {
    reverse?: boolean;
  };
}
