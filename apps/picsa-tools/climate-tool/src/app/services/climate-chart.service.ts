/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import type {
  IChartConfig,
  IChartMeta,
  IStationData,
  IStationMeta,
} from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { PrintProvider } from '@picsa/shared/services/native';
import { _wait } from '@picsa/utils';
import { DataPoint } from 'c3';
import { getDayOfYear } from 'date-fns';
import { firstValueFrom, Subject } from 'rxjs';

import * as DATA from '../data';
import { IClimateView } from '../models';
import {
  DATA_RANGES_DEFAULT,
  IDataRanges,
  IGridMeta,
  seriesColors,
} from '../models/chart-data.models';
import { ClimateDataService } from './climate-data.service';

const CHART_VIEWS = [...DATA.CHART_TYPES, ...DATA.REPORT_TYPES];

@Injectable({ providedIn: 'root' })
export class ClimateChartService {
  /** Observable property trigger each time chart is rendered */
  public chartRendered$ = new Subject<void>();

  public chartDefinition?: IChartMeta & IClimateView;

  /** Binding for active rendered chart component */
  public chartComponent?: PicsaChartComponent;

  /** Datapoints of the current rendered chart */
  public chartSeriesData: number[];

  public station?: IStationMeta;

  public stationData: IStationData[];

  /** Config of current displayed chart */
  public chartConfig: IChartConfig;

  /** Png version of chart converted from SVG */
  public chartPng?: string;

  /** Track whether print mode has been toggled */
  private isPrintVersion = false;

  private pointRadius = 8;

  constructor(
    private translateService: PicsaTranslateService,
    private dataService: ClimateDataService,
    private printProvider: PrintProvider
  ) {}

  public async clearChartData() {
    this.chartDefinition = undefined;
    this.station = undefined;
    this.getPointColour = () => undefined;
  }

  /** Provide access to the current chart for use in tools */
  public registerChartComponent(chart: PicsaChartComponent) {
    this.chartComponent = chart;
  }

  public async setStation(id?: string) {
    console.log('[Climate] set station', id);
    if (!id) {
      this.station = undefined;
      return;
    }
    await this.dataService.ready();
    this.station = await this.dataService.getStationMeta(id);
    this.stationData = this.station.summaries as IStationData[];
    return this.station;
  }

  public async setChart(id?: string) {
    console.log('[Climate] set chart', id);
    const chart = id ? CHART_VIEWS.find((v) => v._viewID === id) : undefined;
    this.chartDefinition = chart as IChartMeta & IClimateView;
    await this.generateChartConfig();
    this.chartSeriesData = this.stationData.map(
      (v) => v[this.chartDefinition!.keys[0]] as number
    );
  }

  /*****************************************************************************
   *   Chart Config
   ****************************************************************************/

  /**
   * Generate a c3 chart config with series loaded for all station data, and
   * active definition series displayed
   */
  private async generateChartConfig() {
    const data = this.stationData;
    console.count('Generate chart');
    const definition = this.chartDefinition as IChartMeta & IClimateView;
    // configure major and minor ticks, labels and gridlines
    const ranges = this.calculateDataRanges(data, definition);
    const gridMeta = this.calculateGridMeta(definition, ranges);
    const chartName = await this.translateService.translateText(
      definition.name
    );
    // configure chart
    this.chartConfig = {
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
        text: `${this.station?.name} | ${chartName}`,
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
        r: (d) => {
          return ['LineTool', 'upperTercile', 'lowerTercile'].includes(d.id)
            ? 0
            : this.pointRadius;
        },
        // make it easier to select points when tapping outside
        // TODO - could vary depending on screen size
        sensitivity: 16,
      },
      onrendered: () => {
        this.chartRendered$.next();
      },
    };
  }

  /*****************************************************************************
   *   Chart additions
   ****************************************************************************

  /**
   * Add a horizontal line to the chart at a specific value.
   * NOTE - to remove the points the chart config also needs to be included in hardcoded config
   */
  public addFixedLineToChart(value: number, id: string) {
    const chart = this.chartComponent?.chart;
    if (!chart) return;
    if (value) {
      const lineArray = new Array(this.stationData.length).fill(value);
      lineArray.unshift(id);
      chart.load({ columns: [lineArray as any], classes: { id } });
      chart.show(id);
    } else {
      chart.unload({ ids: [id] });
    }
  }
  public removeSeriesFromChart(ids: string[]) {
    const chart = this.chartComponent?.chart;
    if (!chart) return;
    chart.unload({ ids });
  }

  /*****************************************************************************
   *   Styles and Formatting
   ****************************************************************************/

  /**
   * Update styles and when rendered save as png
   * slightly messy - want to update chart config for print format, and wait until render
   * complete before downloading and reverting back
   *
   * https://spin.atomicobject.com/2014/01/21/convert-svg-to-png/
   * https://github.com/exupero/saveSvgAsPng
   * https://github.com/exupero/saveSvgAsPng/issues/186
   */
  public async generatePrintVersion() {
    const { station, chartDefinition } = this;
    const filename = `${station?.name} - ${chartDefinition!.name}`;
    // TODO - translate and add language suffix

    await this.togglePrintVersion();
    const png = await this.printProvider.convertC3ChartToPNG('picsa_chart_svg');
    this.chartPng = png;
    await _wait(200);
    await this.printProvider.shareHtmlDom('#picsaClimatePrintLayout', filename);
    this.chartPng = undefined;
    await this.togglePrintVersion();
  }

  /**
   * When printing reduce the size of points and fix the chart size
   * Uses cache to revert back to original after print complete
   */
  private async togglePrintVersion() {
    this.isPrintVersion = !this.isPrintVersion;
    console.log('isPrintVersion', this.isPrintVersion);
    // if cache config exists revert back
    if (this.isPrintVersion) {
      this.chartConfig.size = { width: 900, height: 500 };
      this.pointRadius = 3;
      this.chartConfig.title!.text = '';
    } else {
      this.chartConfig.size = undefined;
      this.pointRadius = 8;
      const title = `${this.station?.name} | ${this.chartDefinition!.name}`;
      this.chartConfig.title!.text = title;
    }
    window.dispatchEvent(new CustomEvent('picsaChartRerender'));
    // Ensure graphics updated by waiting for chart render notification and timeout
    await firstValueFrom(this.chartRendered$);
    await _wait(200);
  }

  /**
   * Overridable function for point colour setting (e.g. line tool supplies custom)
   * @return hex colour code string or undefined for default colour
   * */
  public getPointColour(d: DataPoint): string | undefined {
    return;
  }

  public convertDateToDayNumber(d: Date) {
    const dayNumber = getDayOfYear(d);
    if (this.chartDefinition?.yFormat === 'date-from-July') {
      return dayNumber > 183 ? dayNumber - 183 : dayNumber + 183;
    }
    return dayNumber;
  }

  // iterate over data and calculate min/max values for xVar and multiple yVars
  private calculateDataRanges(data: IStationData[], definition: IChartMeta) {
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
