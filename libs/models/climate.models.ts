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
  country: string;
  summaries?: IChartSummary_V1[] | IChartSummary_V2[];
}

export interface IChartSummary_V1 {
  Year: number;
  Start: number;
  StartDate: number;
  EndDay: number;
  EndDate: number;
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

// export interface IChartSummary {
//   Year: number;
//   Start?: number;
//   StartDate: number | Date;
//   EndDay?: number;
//   EndDate?: number;
//   Length: number;
//   Rainfall: number;
// }

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
