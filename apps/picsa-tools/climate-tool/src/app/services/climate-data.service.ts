import { Injectable } from '@angular/core';
import { IChartMeta, IStationData, IStationMetaDB } from '@picsa/models';
import { arrayToHashmap, loadCSV } from '@picsa/utils';

import * as DATA from '../data';

@Injectable({ providedIn: 'root' })
export class ClimateDataService {
  public activeChart: IChartMeta;
  public yValues: number[];

  public dataByStation: { [name: string]: IStationMetaDB } = {};

  constructor() {
    this.dataByStation = arrayToHashmap(DATA.HARDCODED_STATIONS, '_key');
  }

  public async getStationMeta(stationID: string): Promise<IStationMetaDB> {
    const station = this.dataByStation[stationID];
    if (!station) {
      console.error('No data for station');
      return { data: [] as any[], name: 'Data not found' } as IStationMetaDB;
    }
    if (!station.data) {
      console.log('[Climate] Load Data', stationID);
      const summaries = await this.loadStationSummaries(stationID);
      this.dataByStation[stationID].data = summaries;
    }
    return this.dataByStation[stationID];
  }
  private async loadStationSummaries(stationID: string) {
    // TODO - ensure still working
    return loadCSV<IStationData>(`assets/summaries/${stationID}.csv`, {
      download: true,
      dynamicTyping: true,
      header: true,
    });
  }
}
