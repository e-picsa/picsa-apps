import { select } from '@angular-redux/store';
import { Injectable, OnDestroy } from '@angular/core';
import * as Papa from 'papaparse';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// import { ClimateToolActions } from './climate-tool.actions';
import { IChartMeta, ISite } from '@picsa/core/models/climate.models';

@Injectable({ providedIn: 'root' })
export class ClimateToolProvider implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @select(['climate', 'site'])
  readonly site$: Observable<ISite>;
  @select(['climate', 'chart'])
  readonly activeChart$: Observable<IChartMeta>;
  public activeSite: ISite;
  public activeChart: IChartMeta;
  public yValues: number[];
  site: any;
  constructor() // private actions: ClimateToolActions
  {
    this._addSubscriptions();
  }

  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  // when site changed load the relevant summaries and push to redux
  async _siteChanged(site: ISite) {
    if (!site.summaries) {
      const filePath = `assets/climate/summaries/${site.fileName}.csv`;
      site.summaries = await this.loadCSV(filePath);
      // this.actions.selectSite(site);
    }
  }
  // when chart selected create list of chart-specific values from main site
  // summary data to use when quickly calculating probabilities
  _chartChanged(chart: IChartMeta) {
    const selectedAxis = chart.y;
    const yValues = this.activeSite.summaries.map(v => {
      return v[selectedAxis];
    });
    this.yValues = yValues;
  }

  async loadCSV(filePath) {
    console.log('loading csv', filePath);
    return new Promise((resolve, reject) => {
      Papa.parse(filePath, {
        download: true,
        dynamicTyping: true,
        header: true,
        complete: function(res, file) {
          // resolve(this.site);
          resolve(res.data);
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
  calculateProbabilities(value) {
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
  calculateCombinedProbability(conditions) {
    //conditions are defined in format {key1:valueToTest1, key2:valueToTest2...}
    let data = this.site.summaries;
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

  _addSubscriptions() {
    this.activeChart$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(chart => {
        if (chart) {
          this.activeChart = chart;
          this._chartChanged(chart);
        }
      });
    this.site$.pipe(takeUntil(this.componentDestroyed)).subscribe(site => {
      if (site) {
        this.activeSite = site;
        this._siteChanged(site);
      }
    });
  }
}
