/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  formatThreeMonthPeriodLabel,
  getActiveMonthsForCountry,
  getActivePeriodsForCountry,
  getChartDefinitionText,
  MONTH_DATA,
} from '@picsa/data';
import { PicsaTranslateService } from '@picsa/i18n';
import type {
  ClimateTimespanMode,
  IChartConfig,
  IChartId,
  IChartMeta,
  IStationData,
  IStationMeta,
  IThreeMonthPeriod,
} from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { _wait } from '@picsa/utils';
import { isEqual } from '@picsa/utils/object.utils';
import { DataPoint } from 'c3';
import { getDayOfYear } from 'date-fns';

import type { BaseChartToolComponent } from '../components/chart-tools/base-tool.component';
import { formatYValue, generateChartConfig } from '../utils';
import {
  clearLineOverlay,
  clearPointOverlay,
  clearSvgLegend,
  IOverlayPoint,
  renderLineOverlay,
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
  readonly chartData = signal<IStationData[]>([]);
  readonly availableCharts = signal<IChartMeta[]>([], { equal: isEqual });

  readonly chartSeriesData = computed<number[]>(() => {
    const data = this.chartData();
    const def = this.chartDefinition();
    if (!def || !data.length) return [];
    const key = def.keys[0];
    return data.map((v) => v[key] as number);
  });

  // Timespan resolution state
  readonly timespanMode = signal<ClimateTimespanMode>('annual');
  readonly selectedMonth = signal<number>(1);
  readonly selectedPeriod = signal<IThreeMonthPeriod | undefined>(undefined);

  readonly availablePeriods = computed<IThreeMonthPeriod[]>(() => {
    return getActivePeriodsForCountry(this.station()?.countryCode);
  });

  readonly availableMonths = computed<number[]>(() => {
    return getActiveMonthsForCountry(this.station()?.countryCode);
  });

  /** 1-to-1 capability guard: returns true only if the station explicitly advertises monthly support for this chart ID */
  readonly canShowTimespan = computed<boolean>(() => {
    const station = this.station();
    const def = this.chartDefinition();
    if (!station?.capabilities?.monthly || !def) return false;
    return station.capabilities.monthly.includes(def._id);
  });

  readonly currentPeriodLabel = computed<string>(() => {
    const mode = this.timespanMode();
    if (mode === 'annual') return '';
    if (mode === 'monthly') {
      const mIdx = this.selectedMonth() - 1;
      return this.monthNames[mIdx] || MONTH_DATA[mIdx]?.labelShort || '';
    }
    if (mode === 'three_month') {
      const period = this.selectedPeriod() || this.availablePeriods()[0];
      return period ? formatThreeMonthPeriodLabel(period, this.monthNames) : '';
    }
    return '';
  });

  readonly currentDefinitionText = computed<string>(() => {
    return getChartDefinitionText(this.chartDefinition(), this.timespanMode());
  });

  // PNG blob for print version
  readonly chartPngBlob = signal<Blob | undefined>(undefined);

  // Signal and resolvers for chart render events
  private renderResolvers: Array<() => void> = [];
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
    effect(() => {
      this.translateService.locale();
      this.translateService
        .translateArray(MONTH_DATA.map((m) => m.labelShort))
        .then((names) => {
          this.monthNames = names;
        })
        .catch(() => {
          this.monthNames = MONTH_DATA.map((m) => m.labelShort);
        });
    });

    // Reactively synchronize preferred station configuration when active station changes
    effect(() => {
      const station = this.station();
      if (station && station.id) {
        this.dataService.setPreferredStation(station.id);
        const months = this.availableMonths();
        if (!months.includes(this.selectedMonth()) && months.length > 0) {
          this.selectedMonth.set(months[0]);
        }
        const periods = this.availablePeriods();
        if (this.selectedPeriod() && !periods.some((p) => p.id === this.selectedPeriod()?.id) && periods.length > 0) {
          this.selectedPeriod.set(periods[0]);
        }
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

    // Auto-revert timespan mode to annual if current chart does not support monthly data
    effect(() => {
      if (!this.canShowTimespan() && this.timespanMode() !== 'annual') {
        untracked(() => {
          this.setTimespanMode('annual');
        });
      }
    });
  }

  /**
   * Clear all chart data and reset to initial state.
   */
  public async clearChartData() {
    this.chartData.set([]);
    this.availableCharts.set([]);
    this.chartConfig.set(undefined);
    this.chartDefinition.set(undefined);
    this.timespanMode.set('annual');
    this.selectedMonth.set(1);
    this.selectedPeriod.set(undefined);
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
      this.availableCharts.set(this.calculateAvailableCharts(station, data || []));
    } else {
      this.station.set(undefined);
      this.availableCharts.set([]);
    }
  }

  /**
   * Set the active chart by ID.
   */
  public async setChart(id: IChartId) {
    const station = this.station();
    const rawDef = station?.definitions?.[id];
    const definition = rawDef ? { ...rawDef } : undefined;

    if (definition) {
      this.chartDefinition.set(definition);
      // apply translations
      definition.name = await this.translateService.translateText(definition.name);
      definition.yLabel = await this.translateService.translateText(definition.yLabel);
      definition.xLabel = await this.translateService.translateText(definition.xLabel);

      // Determine active station data based on timespan mode
      const mode = this.timespanMode();
      const isTimespan = this.canShowTimespan() && mode !== 'annual' && !!station;
      const period =
        isTimespan && mode === 'three_month' ? this.selectedPeriod() || this.availablePeriods()[0] : undefined;
      if (period && !this.selectedPeriod()) {
        this.selectedPeriod.set(period);
      }

      if (isTimespan && mode === 'monthly') {
        const months = this.availableMonths();
        if (!months.includes(this.selectedMonth()) && months.length > 0) {
          this.selectedMonth.set(months[0]);
        }
      }

      const currentStationData = isTimespan
        ? await this.dataService.getTimespanData(station!.id, mode, this.selectedMonth(), period)
        : (await this.dataService.getStationData(station!.id)) || [];

      const periodLabel = this.currentPeriodLabel();
      if (isTimespan && periodLabel) {
        definition.name = `${definition.name} (${periodLabel})`;
      }

      if (definition._id === 'rainfall' && isTimespan && mode === 'monthly') {
        definition.axes = {
          ...definition.axes,
          yMinor: 50,
          yMajor: 100,
        };
      }

      this.chartData.set(currentStationData);

      // In monthly mode, use all monthly data so all 1-month charts share fixed boundary A.
      // In 3-month mode, use all 3-month aggregated periods so all 3-month charts share fixed boundary B.
      // In annual mode, boundsData is undefined so axis bounds default to annual data (boundary C).
      const boundsData = isTimespan
        ? await this.dataService.getTimespanBoundsData(station!.id, mode, this.availablePeriods())
        : undefined;

      // generate config and apply custom onrendered callback
      const config = await generateChartConfig(currentStationData, definition, this.monthNames, boundsData);
      const notifyRender = () => {
        this.chartRenderCount.update((c) => c + 1);
        const resolvers = this.renderResolvers;
        this.renderResolvers = [];
        resolvers.forEach((r) => r());
      };
      config.onrendered = notifyRender;

      // override point radius and tooltip if function set
      config.point!.r = (d) => {
        if (d.value === null || d.value === undefined || typeof d.value !== 'number' || !Number.isFinite(d.value)) {
          return 0;
        }
        return this.pointRadius();
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
    } else {
      console.warn('No chart found', id, station);
    }
  }

  /**
   * Reload the current active chart with the current timespan configuration.
   */
  public async reloadActiveChart() {
    const def = this.chartDefinition();
    if (def?._id) {
      await this.setChart(def._id);
    }
  }

  public async setTimespanMode(mode: ClimateTimespanMode) {
    if (this.timespanMode() === mode) return;
    this.timespanMode.set(mode);
    if (mode === 'monthly') {
      const months = this.availableMonths();
      if (!months.includes(this.selectedMonth()) && months.length > 0) {
        this.selectedMonth.set(months[0]);
      }
    } else if (mode === 'three_month' && !this.selectedPeriod()) {
      const periods = this.availablePeriods();
      if (periods.length > 0) {
        this.selectedPeriod.set(periods[0]);
      }
    }
    await this.reloadActiveChart();
  }

  public async setSelectedMonth(month: number) {
    if (this.selectedMonth() === month) return;
    this.selectedMonth.set(month);
    await this.reloadActiveChart();
  }

  public async setSelectedPeriod(period: IThreeMonthPeriod) {
    if (this.selectedPeriod()?.id === period.id) return;
    this.selectedPeriod.set(period);
    await this.reloadActiveChart();
  }

  public async nextPeriod() {
    await this.stepPeriod(1);
  }

  public async previousPeriod() {
    await this.stepPeriod(-1);
  }

  private async stepPeriod(step: 1 | -1) {
    const mode = this.timespanMode();
    if (mode === 'monthly') {
      const months = this.availableMonths();
      if (months.length <= 1) return;
      const cur = this.selectedMonth();
      const curIndex = months.indexOf(cur);
      const nextIndex = curIndex === -1 ? 0 : (curIndex + step + months.length) % months.length;
      await this.setSelectedMonth(months[nextIndex]);
    } else if (mode === 'three_month') {
      const periods = this.availablePeriods();
      if (periods.length <= 1) return;
      const curPeriod = this.selectedPeriod() || periods[0];
      const curIndex = periods.findIndex((p) => p.id === curPeriod.id);
      const nextIndex = (curIndex + step + periods.length) % periods.length;
      await this.setSelectedPeriod(periods[nextIndex]);
    }
  }

  /**
   * Build the marker list and lines from station data and hand it to the overlay renderer.
   */
  public syncPointOverlay() {
    const chart = this.chart();
    if (!chart) return;

    const tool = this.activeToolHandler();
    const definition = this.chartDefinition();
    if (!tool?.usesPointOverlay || !definition) {
      clearPointOverlay(chart);
      clearSvgLegend(chart);
      clearLineOverlay(chart);
      return;
    }

    const scale = Math.max(0.6, this.pointRadius() / ClimateChartService.DEFAULT_POINT_RADIUS);

    // 1. Sync overlay lines (horizontal thresholds / terciles)
    const lines = tool.getOverlayLines?.();
    if (lines && lines.length > 0) {
      renderLineOverlay(chart, lines, scale);
    } else {
      clearLineOverlay(chart);
    }

    // 2. Sync overlay points
    const xVar = definition.xVar || 'Year';
    const points: IOverlayPoint[] = [];
    const isValidVal = (val: any): boolean => typeof val === 'number' && Number.isFinite(val);

    for (const row of this.chartData()) {
      const x = row[xVar] as number;
      if (!isValidVal(x)) continue;
      for (const key of definition.keys) {
        const value = row[key] as number;
        if (!isValidVal(value)) continue;
        const style = tool.getPointStyle({ id: key, x, value, index: -1 } as DataPoint);
        if (style) points.push({ id: key, x, value, style });
      }
    }

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
    await this.waitForNextRender();
    await _wait(500);
  }

  private waitForNextRender(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.renderResolvers.push(resolve);
    });
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

  /**
   * Format a y-value according to the active chart definition.
   */
  public formatYValue(value: number, isAxisLabel = false): string {
    const def = this.chartDefinition();
    return formatYValue(value, def, isAxisLabel);
  }
}
