export interface IStationCropInformation {
  id: number;
  station_name: string;
  station_data: IStationCropData[];
  notes: string[];
  dates: string[];
  season_probabilities: string[];
}

export interface IStationCropData {
  crop: string;
  data: {
    variety: string;
    days: string;
    water?: string[];
    probabilities?: string[];
  }[];
}
