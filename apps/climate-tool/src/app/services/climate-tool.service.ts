import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import {
  IChartMeta,
  IStationData,
  IChartSummary_V1,
  IChartSummary
} from '@picsa/models/climate.models';
import { DBCacheService } from '@picsa/services/core/db/db.cache';
import { IProbabilities } from '../models';
import { BehaviorSubject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import * as DATA from 'src/app/data';

@Injectable({ providedIn: 'root' })
export class ClimateToolService {
  private ready$ = new BehaviorSubject<boolean>(false);
  public activeChart: IChartMeta;
  public yValues: number[];

  constructor(private db: DBCacheService) {
    this.init();
  }

  // not strict required, but considered useful to inform components
  // when db has been initialised
  private async init() {
    await this.db.loadStores({ stationData: null });
    if (await this.db.isEmpty('stationData')) {
      await this.initialiseHardcodedData();
    }
    this.ready$.next(true);
  }

  public async loadStation(stationID: string) {
    await this.ready();
    return this.db.getDoc<IStationData>('stationData', stationID);
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

  // when site changed load the relevant summaries and push to redux
  async _siteChanged(station: IStationData) {
    //
  }

  // when chart selected create list of chart-specific values from main site
  // summary data to use when quickly calculating probabilities
  // _chartChanged(chart: IChartMeta) {
  //   const selectedAxis = chart.y;
  //   const yValues = this.activeStation.summaries.map(v => {
  //     return v[selectedAxis];
  //   });
  //   this.yValues = yValues;
  // }

  async loadCSV<T>(filePath: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(filePath, {
        download: true,
        dynamicTyping: true,
        header: true,
        complete: function(res, file) {
          // resolve(this.site);
          resolve(res.data as T[]);
        }.bind(this),
        error: function(err) {
          console.error('err', err);
          reject(err);
        }
      });
    });
  }

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(value: number): IProbabilities {
    console.log('calculating provbabilities', value);
    console.log('yValues', this.yValues);
    const points = this.yValues;
    let above = 0,
      below = 0,
      ratio = [0, 0];
    for (const point of points) {
      if (point != null) {
        if (point >= value) {
          above++;
        } else {
          below++;
        }
      }
    }
    const percentage = above / (above + below);
    const reversePercentage = 1 - percentage;
    const i = Math.round((below + above) / above);
    const j = Math.round((below + above) / below);
    if (above != 0 && above <= below) {
      ratio = [1, i - 1];
    }
    if (below != 0 && below <= above) {
      ratio = [j - 1, 1];
    }
    const tens = {
      above: Array(Math.round(percentage * 10)).fill(1),
      below: Array(Math.round(reversePercentage * 10)).fill(-1),
      value: Math.round(percentage * 10) * 10
    };
    return {
      above: above,
      below: below,
      percentage: percentage,
      reversePercentage: reversePercentage,
      ratio: ratio,
      tens: tens
    };
  }

  // used by combined probabilty component (not currently in use)
  calculateCombinedProbability(data: IChartSummary[], conditions) {
    //conditions are defined in format {key1:valueToTest1, key2:valueToTest2...}
    console.log('data', data);
    //remove values where conditions aren't known - current assumes null values non-numerical (e.g. string or null, may want to change later)
    for (const condition of conditions) {
      console.log('testing condition', condition);
      const key = condition.key;
      const value = condition.value;
      data = data.filter(element => {
        return typeof element[key] == 'number';
      });
    }
    //filter based on coditions
    const length = data.length;
    for (const condition of conditions) {
      const key = condition.key;
      const value = condition.value;
      if (condition.operator == '>=') {
        data = data.filter(element => {
          return element[key] >= value;
        });
      }
      if (condition.operator == '<=') {
        data = data.filter(element => {
          return element[key] <= value;
        });
      }
    }
    const percentage = data.length / length;
    const colors = {
      0: '#BF7720',
      10: '#B77A26',
      20: '#AF7E2D',
      30: '#A88134',
      40: '#A0853B',
      50: '#998942',
      60: '#918C49',
      70: '#899050',
      80: '#829357',
      90: '#7A975E',
      100: '#739B65'
    };
    const color = colors[Math.round(percentage * 10) * 10];
    return {
      results: data,
      percentage: percentage,
      reversePercentage: 1 - percentage,
      color: color
    };
  }

  // observable to inform when service initialisation complete
  private async ready() {
    return new Promise(resolve => {
      if (this.ready$.value === true) {
        resolve();
      } else {
        // only resolve when 'ready' status no longer false
        this.ready$
          .pipe(takeWhile(val => val === false))
          .subscribe(val => null, err => null, () => resolve());
      }
    });
  }
}
