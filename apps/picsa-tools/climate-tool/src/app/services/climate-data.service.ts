import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import {
  IChartMeta,
  IStationMeta,
  IChartSummary_V1,
  IDBDoc,
} from '@picsa/models';
import * as DATA from '../data';
import { PicsaDbService } from '@picsa/shared/services/core/db';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';

@Injectable({ providedIn: 'root' })
export class ClimateDataService extends PicsaAsyncService {
  public activeChart: IChartMeta;
  public yValues: number[];

  override initOnCreate = false;

  constructor(private db: PicsaDbService) {
    super();
  }

  public override async init() {
    console.log('[Climate Data] init');
    const dbData = await this.db.getCollection<IStationMeta>('stationData');
    await this.initialiseHardcodedData(dbData);
  }

  public async getStationMeta(stationID: string) {
    await this.ready();
    return this.db.getDoc<IStationMeta>('stationData', stationID);
  }

  // read hardcoded csv data and populate into cacheDB alongside station meta
  async initialiseHardcodedData(dbData: IStationMeta[]) {
    const dbDataHashmap: { [name: string]: IDBDoc } = {};
    for (const station of dbData) {
      dbDataHashmap[station._key] = station;
    }
    for (const station of DATA.HARDCODED_STATIONS) {
      // compare with existing db, only update if modified date change
      const dbStation = dbDataHashmap[station._key];
      if (dbStation?._modified !== station._modified) {
        // load data and update db
        const data = await this.loadCSV<IChartSummary_V1>(
          `assets/summaries/${station._key}.csv`
        );
        station.summaries = [...data];
        await this.db.setDoc('stationData', station, false, true);
      }
    }
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
