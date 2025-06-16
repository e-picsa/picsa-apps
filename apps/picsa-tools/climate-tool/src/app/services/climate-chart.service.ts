/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { MONTH_DATA } from '@picsa/data';
import type { IChartConfig, IChartId, IChartMeta, IStationData, IStationMeta } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { PrintProvider } from '@picsa/shared/services/native';
import { _wait } from '@picsa/utils';
import { DataPoint } from 'c3';
import { getDayOfYear } from 'date-fns';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';

import { generateChartConfig } from '../utils';
import { ClimateDataService } from './climate-data.service';

@Injectable({ providedIn: 'root' })
export class ClimateChartService {
  public chartDefinition?: IChartMeta;

  /** Binding for active rendered chart component */
  public chartComponent?: PicsaChartComponent;

  /** Datapoints of the current rendered chart */
  public chartSeriesData: number[];

  /** Actively selected station */
  public station?: IStationMeta;
  /** Observable subject for active station */

  public stationData: IStationData[];

  /** Config of current displayed chart */
  public chartConfig: IChartConfig;

  /** Png version of chart converted from SVG */
  public chartPng?: string;

  /** Observable properties for config above */
  public chartConfig$ = new BehaviorSubject<IChartConfig | undefined>(undefined);
  public chartDefinition$ = new BehaviorSubject<IChartMeta | undefined>(undefined);
  public station$ = new BehaviorSubject<IStationMeta | undefined>(undefined);
  public chartSeriesData$ = new BehaviorSubject<number[]>([]);

  public chartRendered$ = new Subject<void>();

  /** Track whether print mode has been toggled */
  private isPrintVersion = false;

  private pointRadius = 8;

  /** List of month names translated */
  private monthNames: string[] = [];

  constructor(
    private translateService: PicsaTranslateService,
    private dataService: ClimateDataService,
    private printProvider: PrintProvider
  ) {}

  public async clearChartData() {
    this.chartDefinition$.next(undefined);
    this.chartConfig$.next(undefined);
    this.chartSeriesData$.next([]);
    this.setStation(undefined);
    this.getPointColour = () => undefined;
  }

  /** Provide access to the current chart for use in tools */
  public registerChartComponent(chart: PicsaChartComponent) {
    this.chartComponent = chart;
  }

  public async setStation(id?: string) {
    const station = id ? await this.dataService.getStationMeta(id) : undefined;
    this.station = station;
    this.station$.next(station);
    this.stationData = station?.data || [];
    // ensure month names are translated
    this.monthNames = await this.translateService.translateArray(MONTH_DATA.map((m) => m.labelShort));
    return this.station;
  }

  public async setChart(id: IChartId) {
    const definition = this.station?.definitions[id];
    this.chartDefinition = definition;
    this.chartDefinition$.next(this.chartDefinition);
    if (definition) {
      // apply translations
      definition.name = await this.translateService.translateText(definition.name);
      definition.yLabel = await this.translateService.translateText(definition.yLabel);
      definition.xLabel = await this.translateService.translateText(definition.xLabel);
      // generate config and apply custom onrendered callback
      // these are not included in base methods as they are used by both extension and dashboard tools
      const config = await generateChartConfig(this.stationData, definition, this.monthNames);
      config.onrendered = () => {
        this.chartRendered$.next();
      };
      config.data!.color = (_, d) => this.getPointColour(d as DataPoint) || definition.colors[0];
      config.point!.r = (d) => {
        return ['LineTool', 'upperTercile', 'lowerTercile'].includes(d.id) ? 0 : this.pointRadius;
      };
      // TODO - ensure month names translated (removed from method)

      this.chartConfig = config;
      this.chartConfig$.next(config);
      // update data used by tools
      this.chartSeriesData = this.stationData.map((v) => v[this.chartDefinition!.keys[0]] as number);
      this.chartSeriesData$.next(this.chartSeriesData);
    } else {
      console.warn('No chart found', id, this.station);
    }
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
}
