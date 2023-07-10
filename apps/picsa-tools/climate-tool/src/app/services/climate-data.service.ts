import { Injectable } from '@angular/core';
import { IChartMeta, IStationData, IStationMetaDB } from '@picsa/models';
import * as Papa from 'papaparse';

import * as DATA from '../data';
import { arrayToHashmap } from '@picsa/utils';

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
    return this.loadCSV<IStationData>(`assets/summaries/${stationID}.csv`);
  }

  private async loadCSV<T>(filePath: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(filePath, {
        download: true,
        dynamicTyping: true,
        header: true,
        complete: function (res, file) {
          // resolve(this.site);
          resolve(res.data as T[]);
        }.bind(this),
        error: function (err) {
          console.error('Could not parse CSV', filePath, err.message);
          resolve([]);
        },
      });
    });
  }
}
