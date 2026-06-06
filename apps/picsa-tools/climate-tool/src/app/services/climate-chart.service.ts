/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { MONTH_DATA } from '@picsa/data';
import { PicsaTranslateService } from '@picsa/i18n';
import type { IChartConfig, IChartId, IChartMeta, IStationData, IStationMeta } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { _wait } from '@picsa/utils';
import { isEqual } from '@picsa/utils/object.utils';
import { DataPoint } from 'c3';
import { getDayOfYear } from 'date-fns';
import { firstValueFrom, Subject } from 'rxjs';

import { generateChartConfig } from '../utils';
import { ClimateDataService } from './climate-data.service';
import { ClimateToolService } from './climate-tool.service';

@Injectable({ providedIn: 'root' })
export class ClimateChartService {
  private translateService = inject(PicsaTranslateService);
  private dataService = inject(ClimateDataService);
  private printProvider = inject(PrintProvider);
  private toolService = inject(ClimateToolService);
  private router = inject(Router);

  // SIGNALS - single source of truth for application state
  readonly station = signal<IStationMeta | undefined>(undefined);
  readonly chartDefinition = signal<IChartMeta | undefined>(undefined);
  readonly chartConfig = signal<IChartConfig | undefined>(undefined);
  readonly chartSeriesData = signal<number[]>([]);
  readonly stationData = signal<IStationData[]>([]);

  readonly availableCharts = computed<IChartMeta[]>(
    () => this.calculateAvailableCharts(this.station(), this.stationData()),
    { equal: isEqual },
  );

  // PNG blob for print version
  readonly chartPngBlob = signal<Blob | undefined>(undefined);

  // Subject for chart rendered events (one-time events, not state)
  private _chartRendered = new Subject<void>();
  chartRendered$ = this._chartRendered.asObservable();

  /** Binding for active rendered chart component */
  public chartComponent?: PicsaChartComponent;

  /** Track whether print mode has been toggled */
  private isPrintVersion = false;
  private pointRadius = 8;

  private monthNames: string[] = [];

  constructor() {
    // Ensure month names are translated
    // NOTE - while this could create a race condition where chart loads before months translated
    // in practice this is unlikely as in-memory translations likely loaded before accessing page
    effect(async () => {
      this.translateService.locale();
      this.monthNames = await this.translateService.translateArray(MONTH_DATA.map((m) => m.labelShort));
    });

    // Reactively synchronize preferred station configuration when active station changes
    effect(() => {
      const station = this.station();
      if (station && station.id) {
        untracked(() => {
          if (this.dataService.getPreferredStation() !== station.id) {
            this.dataService.setPreferredStation(station.id);
          }
        });
      }
    });
  }

  /**
   * Clear all chart data and reset to initial state.
   */
  public async clearChartData() {
    this.stationData.set([]);
    this.chartSeriesData.set([]);
    this.chartConfig.set(undefined);
    this.chartDefinition.set(undefined);
    this.setStation(undefined);
    this.getPointColour = () => undefined;
  }

  /**
   * Provide access to the current chart for use in tools.
   */
  public registerChartComponent(chart: PicsaChartComponent) {
    this.chartComponent = chart;
  }

  /**
   * Clear preferred station and redirect to parent path (site selection page).
   */
  public async goToSiteSelect(siteId: string) {
    localStorage.setItem('picsa_climate_station_temp', siteId);
    this.dataService.setPreferredStation('');
    const parentUrl = this.router.url.split('?')[0].split('/').slice(0, -1).join('/');
    await this.router.navigate([parentUrl], { replaceUrl: true });
  }

  /**
   * Load station and chart view reactively while validating that the station is correct
   * for the country/deployment and the chart is available.
   * Returns true if loaded successfully, or false if a redirect was triggered.
   */
  public async loadStationAndChart(siteId?: string, viewId?: IChartId): Promise<boolean> {
    if (!siteId) {
      this.dataService.setPreferredStation('');
      const parentUrl = this.router.url.split('?')[0].split('/').slice(0, -1).join('/');
      await this.router.navigate([parentUrl], { replaceUrl: true });
      return false;
    }

    const stations = this.dataService.stations();
    const currentStation = this.station();
    const isStationInvalid =
      !currentStation || !stations.some((s) => s.id === siteId && s.countryCode === currentStation.countryCode);

    // 1. If site changed or is invalid for the current country, update station & load station data
    if (currentStation?.id !== siteId || isStationInvalid) {
      await this.setStation(siteId);

      const station = this.station();
      if (!station || !station.id) {
        await this.goToSiteSelect(siteId);
        return false;
      }
    }

    // 2. Validate active view ID against available charts
    const available = this.availableCharts();
    if (available.length > 0) {
      const isValid = viewId && available.some((c) => c._id === viewId);
      if (!isValid) {
        // Redirect to the first available chart if current view is invalid
        const fallbackViewId = available[0]._id;
        await this.router.navigate([], {
          queryParams: { view: fallbackViewId },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return false;
      }
    }

    // 3. Load the validated view
    if (viewId) {
      this.toolService.disableAll();
      await _wait(50);
      await this.setChart(viewId);
    }

    return true;
  }

  /**
   * Set the active station by ID.
   */
  public async setStation(id?: string) {
    if (id) {
      const station = await this.dataService.getStationMeta(id);
      const data = await this.dataService.getStationData(id);
      this.station.set(station);
      this.stationData.set(data || []);
    } else {
      this.station.set(undefined);
      this.stationData.set([]);
    }
  }

  /**
   * Set the active chart by ID.
   */
  public async setChart(id: IChartId) {
    const station = this.station();
    const definition = station?.definitions?.[id] ? { ...station.definitions[id] } : undefined;

    if (definition) {
      this.chartDefinition.set(definition);
      // apply translations
      definition.name = await this.translateService.translateText(definition.name);
      definition.yLabel = await this.translateService.translateText(definition.yLabel);
      definition.xLabel = await this.translateService.translateText(definition.xLabel);

      // generate config and apply custom onrendered callback
      const currentStationData = this.stationData();
      const config = await generateChartConfig(currentStationData, definition, this.monthNames);
      config.onrendered = () => {
        this._chartRendered.next();
      };

      // override point color if function set
      config.data!.color = (color, d) => this.getPointColour(d as DataPoint) || color;
      config.point!.r = (d) => {
        return ['LineTool', 'upperTercile', 'lowerTercile'].includes(d.id) ? 0 : this.pointRadius;
      };

      this.chartConfig.set(config);
      // update data used by tools
      const seriesData = currentStationData.map((v) => v[definition.keys[0]] as number);
      this.chartSeriesData.set(seriesData);
    } else {
      console.warn('No chart found', id, station);
    }
  }

  /*****************************************************************************
   *   Chart additions
   ***************************************************************************/

  /**
   * Add a horizontal line to the chart at a specific value.
   * NOTE - to remove the points the chart config also needs to be included in hardcoded config
   */
  public addFixedLineToChart(value: number, id: string) {
    const chart = this.chartComponent?.chart;
    if (!chart) return;
    if (value) {
      const dataLength = this.stationData().length;
      const lineArray = new Array(dataLength).fill(value);
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
   ***************************************************************************/

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
    const station = this.station();
    const chartDefinition = this.chartDefinition();
    const filename = `${station?.name} - ${chartDefinition!.name}`;
    // TODO - translate and add language suffix

    // Toggle chart settings to resize points and size for print
    await this.togglePrintVersion();

    // Generate a png representation of currently rendered chart so that it
    // can be embedded in custom print-layout component
    const svgElement = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (svgElement) {
      const pngBlob = await this.printProvider.svgToPngBlob(svgElement);
      if (pngBlob) {
        this.chartPngBlob.set(pngBlob);
      }
    }

    // wait for `print-layout` to render with generated image and export
    await _wait(500);
    await this.printProvider.shareHtmlDom('#picsaClimatePrintLayout', filename);

    this.chartPngBlob.set(undefined);
    await this.togglePrintVersion();
  }

  /**
   * When printing reduce the size of points and fix the chart size.
   */
  private async togglePrintVersion() {
    this.isPrintVersion = !this.isPrintVersion;
    const config = this.chartConfig();

    if (!config) return;

    // if cache config exists revert back
    if (this.isPrintVersion) {
      this.chartConfig.set({ ...config, size: { width: 900, height: 500 }, title: { text: '' } });
      this.pointRadius = 3;
    } else {
      const newConfig = { ...config, size: undefined };
      this.chartConfig.set(newConfig);
      this.pointRadius = 8;
    }

    window.dispatchEvent(new CustomEvent('picsaChartRerender'));
    // Ensure graphics updated by waiting for chart render notification and timeout
    await firstValueFrom(this.chartRendered$);
    await _wait(500);
  }

  /**
   * Overridable function for point colour setting (e.g. line tool supplies custom).
   * @return hex colour code string or undefined for default colour
   */
  public getPointColour(d: DataPoint): string | undefined {
    return;
  }

  /**
   * Identify which charts should be available based on the data
   */
  private calculateAvailableCharts(station: IStationMeta | undefined, data: IStationData[]): IChartMeta[] {
    if (!station) return [];
    const definitions = station.definitions;
    if (!definitions) return [];

    return Object.values(definitions).filter((chart) => {
      if (!chart) return false;
      if (chart.disabled) return false;

      const hasData = data.some((row) =>
        chart.keys.some((key) => {
          const val = row[key];
          return val !== undefined && val !== null && (val as any) !== '';
        }),
      );
      return hasData;
    });
  }

  public convertDateToDayNumber(d: Date) {
    const dayNumber = getDayOfYear(d);
    const def = this.chartDefinition();
    if (def?.yFormat === 'date-from-July') {
      return dayNumber > 183 ? dayNumber - 183 : dayNumber + 183;
    }
    return dayNumber;
  }
}
