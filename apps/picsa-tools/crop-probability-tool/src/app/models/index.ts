import { ICropName } from '@picsa/data';

export interface IStationCropInformation {
  id: string;
  station_name: string;
  station_data: IStationCropData[];
  notes: string[];
  dates: string[];
  season_probabilities: string[];
}

export interface IStationCropData {
  crop: ICropName;
  data: IStationCropDataItem[];
}

export interface IStationCropDataItem {
  variety: string;
  days: string;
  water?: string[];
  probabilities?: string[];
}

export interface IStationRouteQueryParams {
  /** id of active selected station */
  stationId?: string;
}
