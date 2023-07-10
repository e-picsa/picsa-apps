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
  summaries?: IStationData[];
  /**
   * Specific definitions to accompany summaries
   * TODO - better if merged with summary above
   */
  definitions: IChartDefinitions;
}
export type IStationMetaDB = IStationMeta & IDBDoc;

export interface IStationData {
  Year: number;
  Start: number;
  End: number;
  Length: number;
  Rainfall: number;
}

export type IChartConfig = Partial<c3.ChartConfiguration>;

export type IChartId = 'start' | 'end' | 'length' | 'rainfall';
export type IChartDefinitions = { [id in IChartId]: IChartMeta };

export interface IChartMeta {
  _id: IChartId;
  name: string;
  shortname: string;
  image: string;
  keys: (keyof IStationData)[];
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
