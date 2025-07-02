import { ICropName } from '@picsa/data';

export type IProbabilityTable = IProbabilityTableStationMeta & {
  data: () => Promise<IStationCropData[]>;
};

export interface IProbabilityTableStationMeta {
  /** Location id for routing */
  id: string;
  /** Station name to display in label */
  label: string;
  /** Additional notes appended below table */
  notes: string[];
  /** Probabilities to display in header row for start of season */
  seasonProbabilities: string[];
  /** Text to display for heading columns */
  dateHeadings: string[];
}

/**
 * @deprecated
 * Should refactor to use IProbabilityTableStationMeta
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
