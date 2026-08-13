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

import { BaseChartToolComponent, TOOL_SERIES_IDS } from '../components/chart-tools/base-tool.component';
import { generateChartConfig } from '../utils';
import {
  clearPointOverlay,
  clearSvgLegend,
  IOverlayPoint,
  renderPointOverlay,
  renderSvgLegend,
} from '../utils/chart-point-overlay';
import { ClimateDataService } from './climate-data.service';
import { ClimateToolService } from './climate-tool.service';

@Injectable({ providedIn: 'root' })
export class ClimateChartService {
  private translateService = inject(PicsaTranslateService);
  private dataService = inject(ClimateDataService);
  private printProvider = inject(PrintProvider);
  private toolService = inject(ClimateToolService);
  private router = inject(Router);

  /** Signal holding reference to the currently active tool component */
  public readonly activeToolHandler = signal<BaseChartToolComponent | undefined>(undefined);

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

  // Subject and signal for chart rendered events
  private _chartRendered = new Subject<void>();
  chartRendered$ = this._chartRendered.asObservable();
  readonly chartRenderCount = signal(0);

  /** Binding for active rendered chart component and active C3 chart API */
  readonly chartComponent = signal<PicsaChartComponent | undefined>(undefined);
  readonly chart = computed(() => this.chartComponent()?.chart());

  /** Track whether print mode has been toggled */
  private isPrintVersion = false;
  private static readonly DEFAULT_POINT_RADIUS = 8;
  private readonly pointRadius = signal(ClimateChartService.DEFAULT_POINT_RADIUS);

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
        this.dataService.setPreferredStation(station.id);
      }
    });

    // Synchronize overlay reactively whenever chart instance, active tool, or render/resize changes
    effect(() => {
      this.chartRenderCount();
      const chart = this.chart();
      const tool = this.activeToolHandler();
      if (chart && tool?.usesPointOverlay) {
        this.syncPointOverlay();
      } else if (chart) {
        clearPointOverlay(chart);
        clearSvgLegend(chart);
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
    this.activeToolHandler.set(undefined);
  }

  /**
   * Provide access to the current chart for use in tools.
   */
  public registerChartComponent(chart: PicsaChartComponent) {
    this.chartComponent.set(chart);
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
    const available = untracked(() => this.availableCharts());
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
        this.chartRenderCount.update((c) => c + 1);
        this._chartRendered.next();
      };

      // override point color, radius and tooltip if function set
      config.data!.color = (color, d) => {
        if (TOOL_SERIES_IDS.includes((d as DataPoint).id)) return color;
        return this.getPointColour(d as DataPoint) || color;
      };
      config.point!.r = (d) => {
        if (TOOL_SERIES_IDS.includes(d.id)) return 0;
        if (d.value === null || d.value === undefined || typeof d.value !== 'number' || !Number.isFinite(d.value)) {
          return 0;
        }
        return this.getPointRadius(d as DataPoint) ?? this.pointRadius();
      };
      config.tooltip = config.tooltip || {};
      config.tooltip.contents = (d: any, defaultTitleFormat: any, defaultValueFormat: any, color: any) => {
        const chartApi = this.chart();
        let html = chartApi?.internal?.getTooltipContent(d, defaultTitleFormat, defaultValueFormat, color) || '';
        const year = d[0]?.x;
        if (typeof year === 'number' && this.formatTooltipRow) {
          const extraRow = this.formatTooltipRow(year);
          if (extraRow && html) {
            const row = `<tr class="extra-tooltip-row"><td colspan="2" style="color: ${extraRow.color}; font-weight: 600; text-align: center; padding-top: 6px; border-top: 1px solid #e0e0e0;">${extraRow.text}</td></tr>`;
            html = html.replace('</table>', `${row}</table>`);
          }
        }
        return html;
      };

      this.chartConfig.set(config);
      // update data used by tools
      const seriesData = currentStationData.map((v) => v[definition.keys[0]] as number);
      this.chartSeriesData.set(seriesData);
    } else {
      console.warn('No chart found', id, station);
    }
  }

  /**
   * Build the marker list from station data and hand it to the overlay renderer.
   * Markers are applied to every series key on the active chart.
   */
  private syncPointOverlay() {
    const chart = this.chart();
    if (!chart) return;

    const tool = this.activeToolHandler();
    const definition = this.chartDefinition();
    if (!tool?.usesPointOverlay || !definition) {
      clearPointOverlay(chart);
      clearSvgLegend(chart);
      return;
    }

    const xVar = definition.xVar || 'Year';
    const points: IOverlayPoint[] = [];
    const isValidVal = (val: any): boolean => typeof val === 'number' && Number.isFinite(val);

    for (const row of this.stationData()) {
      const x = row[xVar] as number;
      if (!isValidVal(x)) continue;
      for (const key of definition.keys) {
        const value = row[key] as number;
        if (!isValidVal(value)) continue;
        const style = tool.getPointStyle({ id: key, x, value, index: -1 } as DataPoint);
        if (style) points.push({ id: key, x, value, style });
      }
    }

    const scale = Math.max(0.6, this.pointRadius() / ClimateChartService.DEFAULT_POINT_RADIUS);
    renderPointOverlay(chart, points, scale);

    const legendItems = tool.getLegendItems();
    // Render SVG legend on canvas ONLY in print version (so it is captured in PNG export without appearing on normal screen)
    if (this.isPrintVersion && legendItems?.length) {
      renderSvgLegend(chart, legendItems, scale);
    } else {
      clearSvgLegend(chart);
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
    const chart = this.chart();
    if (!chart) return;
    if (value) {
      const dataLength = this.stationData().length;
      const lineArray = new Array(dataLength).fill(value);
      lineArray.unshift(id);
      chart.load({ columns: [lineArray as any], classes: { id } });
      chart.show(id);
    } else {
      try {
        chart.hide([id]);
      } catch {
        /* empty */
      }
      chart.unload({ ids: [id] });
    }
  }

  public removeSeriesFromChart(ids: string[]) {
    const chart = this.chart();
    if (!chart) return;
    try {
      chart.hide(ids);
    } catch {
      /* empty */
    }
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
    const svgElement = this.chart()?.internal?.svg?.node() as SVGSVGElement | undefined;
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
      this.chartConfig.set({
        ...config,
        size: { width: 900, height: 530 },
        padding: { bottom: 45, right: 10, left: 60 },
        title: { text: '' },
      });
      this.pointRadius.set(3);
    } else {
      const newConfig = { ...config, size: undefined, padding: undefined };
      this.chartConfig.set(newConfig);
      this.pointRadius.set(ClimateChartService.DEFAULT_POINT_RADIUS);
    }

    // Ensure graphics updated by waiting for chart render notification and timeout
    await firstValueFrom(this.chartRendered$);
    await _wait(500);
  }

  /**
   * Delegates point colour setting to active tool handler.
   * @return hex colour code string or undefined for default colour
   */
  public getPointColour(d: DataPoint): string | undefined {
    return this.activeToolHandler()?.getPointColour(d);
  }

  /**
   * Delegates point radius setting to active tool handler.
   * @return radius number or undefined for default radius
   */
  public getPointRadius(d: DataPoint): number | undefined {
    return this.activeToolHandler()?.getPointRadius(d);
  }

  /**
   * Delegates extra tooltip pop-up row to active tool handler.
   */
  public formatTooltipRow(year: number): { text: string; color: string } | undefined {
    return this.activeToolHandler()?.formatTooltipRow(year);
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
