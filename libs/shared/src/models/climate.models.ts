import { IDBDoc } from './db.models';
import * as c3 from 'c3';

export interface ICropRequirement {
  crop: string;
  variety: string;
  image: string;
  name: string;
  daysMin: number;
  daysMax: number;
  waterMin: number;
  waterMax: number;
}

export interface IStationMeta extends IDBDoc {
  name: string;
  latitude: number;
  longitude: number;
  country: IPicsaCountry;
  summaries?: IChartSummary_V1[] | IChartSummary_V2[];
}

export interface IChartSummary_V1 {
  Year: number;
  Start: number;
  End: number;
  Length: number;
  Rainfall: number;
}

export interface IChartSummary_V2 {
  Year: number;
  StartDate: Date;
  Length: number;
  Rainfall: number;
}
// merged old and new formats for use when not sure type
export type IChartSummary = IChartSummary_V1 & IChartSummary_V2;

export type IChartConfig = Partial<c3.ChartConfiguration>;

export interface IChartMeta {
  name: string;
  image: string;
  keys: (keyof IChartSummary)[];
  yFormat: 'value' | 'date' | 'date-from-July';
  yLabel: string;
  xVar: keyof IChartSummary;
  xLabel: string;
  tools: { line: boolean };
  units: string;
  definition: string;
  xMinor: number;
  xMajor: number;
  yMinor: number;
  yMajor: number;
}

export type IPicsaCountry = 'Malawi';
