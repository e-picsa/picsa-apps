import { ICropName } from '@picsa/data';

export type IProbabilityTable = IProbabilityTableMeta & {
  data: () => Promise<IStationCropData[]>;
};

export interface IProbabilityTableMeta {
  id: string;
  /** Location label to use in heading */
  label: string;
  /** Station name used in disclaimer for source of data */
  station_label: string;
  /** Probabilities to display in header row for start of season */
  seasonProbabilities: string[];
  /** Text to display for heading columns */
  dateHeadings: string[];
}

/**
 * @deprecated
 * Should refactor to use IProbabilityTableMeta
 */
export interface IStationCropInformation {
  id: string;
  station_district_id: string;
  station_name: string;
  data: IStationCropData[];
  dates: string[];
  season_probabilities: string[];
  notes: string[];
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
