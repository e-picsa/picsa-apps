import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { getDayOfYear } from 'date-fns';

import type {
  IChartConfig,
  IChartMeta,
  IChartSummary,
  IStationMeta,
} from '@picsa/models';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { IClimateView } from '../models';
import {
  DATA_RANGES_DEFAULT,
  IDataRanges,
  IGridMeta,
  seriesColors,
} from '../models/chart-data.models';
import { ClimateDataService } from './climate-data.service';

import * as DATA from '../data';
import { DataPoint } from 'c3';
const CHART_VIEWS = [...DATA.CHART_TYPES, ...DATA.REPORT_TYPES];

@Injectable({ providedIn: 'root' })
export class ClimateChartService {
  /** Observable property trigger each time chart is rendered */
  public chartRendered$ = new Subject<void>();
  public chartDefinition?: IChartMeta & IClimateView;
  public station?: IStationMeta;

  constructor(
    private translateService: PicsaTranslateService,
    private dataService: ClimateDataService
  ) {}

  public async clearChartData() {
    this.chartDefinition = undefined;
    this.station = undefined;
    this.getPointColour = () => undefined;
  }

  public async setStation(id?: string) {
    if (!id) {
      this.station = undefined;
      return;
    }
    await this.dataService.ready();
    this.station = await this.dataService.getStationMeta(id);
    return this.station;
  }

  public async setChart(id?: string) {
    const chart = id ? CHART_VIEWS.find((v) => v._viewID === id) : undefined;
    if (chart?._viewType === 'report') {
      // TODO - handle legacy reports
      return;
    }
    this.chartDefinition = chart as IChartMeta & IClimateView;
  }

  /*****************************************************************************
   *   Chart Config
   ****************************************************************************/

  // create chart given columns of data and a particular key to make visible
  public generateChartConfig(data: IChartSummary[], definition: IChartMeta) {
    // configure major and minor ticks, labels and gridlines
    const ranges = this.calculateDataRanges(data, definition);
    const gridMeta = this.calculateGridMeta(definition, ranges);
    // configure chart
    const config: IChartConfig = {
      // ensure axis labels fit
      padding: {
        right: 10,
        left: 60,
      },
      data: {
        json: data as any,
        keys: {
          value: [...definition.keys, definition.xVar],
        },
        x: 'Year',
        classes: { LineTool: 'LineTool' },
        color: (_, d) =>
          this.getPointColour(d as DataPoint) ||
          seriesColors[(d as DataPoint).id],
      },
      ['title' as any]: {
        text: `${this.station?.name} | ${definition.name}`,
      },
      tooltip: {
        grouped: false,
        format: {
          value: (value) => this._getTooltipFormat(value as any, definition),
          // HACK - reformat missing  titles (lost when passing "" values back from axis)
          // i marked ? as incorrect typings
          title: (x, i?) =>
            this._formatXAxis(data[i as number][definition.xVar] as any),
        },
      },
      axis: {
        x: {
          label: definition.xLabel,
          min: ranges.xMin,
          max: ranges.xMax,
          tick: {
            rotate: 75,
            multiline: false,
            values: gridMeta.xTicks,
            format: (d) =>
              gridMeta.xLines.includes(d as any)
                ? this._formatXAxis(d as any)
                : '',
          },
          height: 60,
        },
        y: {
          label: { position: 'outer-middle', text: definition.yLabel },
          tick: {
            values: gridMeta.yTicks,
            format: (d: any) =>
              gridMeta.yLines.includes(d as any)
                ? this._formatYAxis(d as any, definition, true)
                : '',
          },
          min: ranges.yMin,
          max: ranges.yMax,
          padding: {
            bottom: 0,
            top: 10,
          },
        },
      },
      // add custom gridlines to only show on 'major' ticks
      grid: {
        y: {
          lines: gridMeta.yLines.map((l) => {
            return { value: l, class: 'picsa-gridline', text: '' };
          }),
        },
        x: {
          lines: gridMeta.xLines.map((l) => {
            return { value: l, class: 'picsa-gridline', text: '' };
          }),
        },
        // destructured as typings incorrect
        ...{
          lines: {
            front: false,
          },
        },
      },
      legend: {
        show: false,
      },
      point: {
        r: (d) => (d.id === 'LineTool' ? 0 : 8),
        // make it easier to select points when tapping outside
        // TODO - could vary depending on screen size
        sensitivity: 16,
      },
      onrendered: () => {
        this.chartRendered$.next();
      },
    };
    return config;
  }

  /*****************************************************************************
   *   Styles and Formatting
   ****************************************************************************/

  public getPointColour(d: DataPoint): string | undefined {
    // default will return color for series key, attached to d.id
    return;
  }

  public convertDateToDayNumber(d: Date) {
    const dayNumber = getDayOfYear(d);
    if (this.chartDefinition?.yFormat === 'date-from-July') {
      return dayNumber - 183;
    }
    return dayNumber;
  }

  // iterate over data and calculate min/max values for xVar and multiple yVars
  private calculateDataRanges(data: IChartSummary[], definition: IChartMeta) {
    let { yMin, yMax, xMin, xMax } = DATA_RANGES_DEFAULT;
    const { xMajor, yMajor } = definition;
    data.forEach((d) => {
      const xVal = d[definition.xVar] as number;
      // take all possible yValues and filter out undefined
      const yVals = definition.keys
        .map((k) => d[k])
        .filter((v) => typeof v === 'number') as number[];
      xMax = xVal ? Math.max(xMax, xVal) : xMax;
      xMin = xVal ? Math.min(xMin, xVal) : xMin;
      yMax = Math.max(yMax, ...yVals);
      yMin = Math.min(yMin, ...yVals);
    });
    // NOTE - yAxis hardcoded to 0 start currently for rainfall chart
    if (definition.yFormat === 'value') {
      yMin = 0;
    }
    // Note - xAxis hardcoded to end at this year for all year charts
    if (definition.xVar === 'Year') {
      xMax = new Date().getFullYear();
    }
    return {
      // round max up and min down to the nearest interval
      yMin: Math.floor(yMin / yMajor) * yMajor,
      yMax: Math.ceil(yMax / yMajor) * yMajor,
      xMin: Math.floor(xMin / xMajor) * xMajor,
      xMax: Math.ceil(xMax / xMajor) * xMajor,
    };
  }

  // calculate grid ticks, lines and label meta data
  private calculateGridMeta(meta: IChartMeta, ranges: IDataRanges): IGridMeta {
    const { xMin, xMax, yMin, yMax } = ranges;
    const { xMajor, yMajor, xMinor, yMinor } = meta;
    return {
      xTicks: this._getAxisValues(xMin, xMax, xMinor) as number[],
      xLines: this._getAxisValues(xMin, xMax, xMajor) as number[],
      yTicks: this._getAxisValues(yMin, yMax, yMinor) as number[],
      yLines: this._getAxisValues(yMin, yMax, yMajor) as number[],
    };
  }

  // sometimes want to manually specify axis values so that y-axis can start at 0,
  // or so x-axis can extend beyond range of dates to current year
  private _getAxisValues(min: number, max: number, interval: number) {
    const values: number[] = [];
    for (let i = 0; i <= (max - min) / interval; i++) {
      values.push(min + i * interval);
    }
    return values;
  }

  // now all ticks are displayed we only want values for every 5
  private _formatXAxis(value: number): string {
    return `${value} - ${(value + 1).toString().substring(2, 4)}`;
  }

  private _formatYAxis(value: number, meta: IChartMeta, isAxisLabel?: boolean) {
    const { yMajor } = meta;
    const monthNames: string[] = this.translateService.monthNames;
    let label: string;

    switch (meta.yFormat) {
      case 'date-from-July': {
        // previously 181 based on local met +182 and -1 for index starting at 0
        // now simply half of standard year 365 + 1 for index
        const dayNumber = (value + 183) % 366;
        if (isAxisLabel) {
          const monthNumber = Math.round(dayNumber / yMajor) % 12;
          // just want nearest month name
          label = monthNames[monthNumber].substring(0, 3);
        } else {
          //simply converts number to day rough date value (same method as local met office)
          //initialise year from a year with 365 days
          const d = new Date(2015, 0);
          d.setDate(dayNumber);

          // just take first 3 letters
          label = `${d.getDate()}-${monthNames[d.getMonth() % 12].substring(
            0,
            3
          )}`;
        }
        return label;
      }
      case 'date':
        // TODO
        return `${value}`;
      default:
        return `${value}`;
    }
  }

  private _getTooltipFormat(value: number, meta: IChartMeta) {
    if (meta.yFormat == 'value') {
      return `${Math.round(value).toString()} ${meta.units}`;
    } else {
      return `${this._formatYAxis(value, meta, false)} ${meta.units}`;
    }
  }
}
