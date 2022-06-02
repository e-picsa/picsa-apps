import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import {
  IChartMeta,
  IStationMeta,
  IChartSummary_V1,
  IChartSummary,
} from '@picsa/models';
import { BehaviorSubject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import * as DATA from '../data';
import { PicsaDbService } from '@picsa/shared/services/core/db';

@Injectable({ providedIn: 'root' })
export class ClimateToolService {
  private ready$ = new BehaviorSubject<boolean>(false);
  public activeChart: IChartMeta;
  public yValues: number[];

  constructor(private db: PicsaDbService) {
    this.init();
  }

  // not strict required, but considered useful to inform components
  // when db has been initialised
  private async init() {
    const collection = await this.db.getCollection('stationData');
    if (collection.length === 0) {
      await this.initialiseHardcodedData();
    }
    this.ready$.next(true);
  }

  public async loadStation(stationID: string) {
    await this.ready();
    return this.db.getDoc<IStationMeta>('stationData', stationID);
  }

  // read hardcoded csv data and populate into cacheDB alongside station meta
  async initialiseHardcodedData() {
    console.log(`Loading data for [${DATA.STATIONS.length}] stations`);
    for (const station of DATA.STATIONS) {
      const data = await this.loadCSV<IChartSummary_V1>(
        `assets/summaries/${station._key}.csv`
      );
      station.summaries = [...data];
      await this.db.setDoc('stationData', station);
    }
  }

  async loadCSV<T>(filePath: string): Promise<T[]> {
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
          console.error('err', err);
          reject(err);
        },
      });
    });
  }

  // observable to inform when service initialisation complete
  private async ready() {
    return new Promise((resolve) => {
      if (this.ready$.value === true) {
        resolve();
      } else {
        // only resolve when 'ready' status no longer false
        this.ready$.pipe(takeWhile((val) => val === false)).subscribe(
          (val) => null,
          (err) => null,
          () => resolve()
        );
      }
    });
  }

  /******************************************************************************
   *  Not currently in use, but may want in future
   *****************************************************************************/
  // used by combined probabilty component (not currently in use)
  calculateCombinedProbability(data?: IChartSummary[], conditions = []) {
    // //conditions are defined in format {key1:valueToTest1, key2:valueToTest2...}
    // console.log('data', data);
    // //remove values where conditions aren't known - current assumes null values non-numerical (e.g. string or null, may want to change later)
    // for (const condition of conditions) {
    //   console.log('testing condition', condition);
    //   const key = condition.key;
    //   const value = condition.value;
    //   data = data.filter(element => {
    //     return typeof element[key] == 'number';
    //   });
    // }
    // //filter based on coditions
    // const length = data.length;
    // for (const condition of conditions) {
    //   const key = condition.key;
    //   const value = condition.value;
    //   if (condition.operator == '>=') {
    //     data = data.filter(element => {
    //       return element[key] >= value;
    //     });
    //   }
    //   if (condition.operator == '<=') {
    //     data = data.filter(element => {
    //       return element[key] <= value;
    //     });
    //   }
    // }
    // const percentage = data.length / length;
    // const colors = {
    //   0: '#BF7720',
    //   10: '#B77A26',
    //   20: '#AF7E2D',
    //   30: '#A88134',
    //   40: '#A0853B',
    //   50: '#998942',
    //   60: '#918C49',
    //   70: '#899050',
    //   80: '#829357',
    //   90: '#7A975E',
    //   100: '#739B65'
    // };
    // const color = colors[Math.round(percentage * 10) * 10];
    // return {
    //   results: data,
    //   percentage: percentage,
    //   reversePercentage: 1 - percentage,
    //   color: color
    // };
  }
}
