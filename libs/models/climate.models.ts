import { IDBDoc } from './db.models';

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

export interface IStationData extends IDBDoc {
  name: string;
  latitude: number;
  longitude: number;
  fileName: string;
  country: string;
  summaries?: any;
}

export interface IChartSummary {
  Year: number;
  Start: number;
  StartDate: number;
  EndDay: number;
  EndDate: number;
  Length: number;
  Rainfall: number;
}
export interface IChartSummary2019 {
  Year: number;
  StartDate: Date;
  Length: number;
  Rainfall: number;
}

export interface IChartMeta {
  name: string;
  image: string;
  cropTableValue?: string;
  y: string;
  yFormat: string;
  tools: { line: boolean };
  units: string;
  definition: string;
}
