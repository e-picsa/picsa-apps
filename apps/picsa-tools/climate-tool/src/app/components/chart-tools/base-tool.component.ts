import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { DataPoint } from 'c3';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';

export const TOOL_SERIES_IDS = ['LineTool', 'lowerTercile', 'upperTercile'];

export interface ITooltipExtraRow {
  text: string;
  color: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export abstract class BaseChartToolComponent {
  protected chartService = inject(ClimateChartService);
  protected toolService = inject(ClimateToolService);
  protected destroyRef = inject(DestroyRef);

  /** Protected reactive signals & streams exposing chart data/config to derived tools */
  protected readonly chartDefinition = computed(() => this.chartService.chartDefinition());
  protected readonly chartSeriesData = computed(() => this.chartService.chartSeriesData());
  protected readonly stationData = computed(() => this.chartService.stationData());
  protected readonly chartConfig = computed(() => this.chartService.chartConfig());
  protected readonly chartRendered$ = this.chartService.chartRendered$;

  constructor() {
    // Register this tool instance as the active tool handler on ClimateChartService
    this.chartService.activeToolHandler.set(this);

    this.destroyRef.onDestroy(() => {
      this.cleanupToolState();
    });
  }

  /**
   * Method hooks that extending tools can override.
   * Return undefined to defer to standard chart defaults.
   */
  public getPointColour(d: DataPoint): string | undefined {
    return undefined;
  }

  public getPointRadius(d: DataPoint): number | undefined {
    return undefined;
  }

  public formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    return undefined;
  }

  /** Helper method for tools to add horizontal lines to the chart */
  protected addFixedLine(value: number, id: string) {
    this.chartService.addFixedLineToChart(value, id);
  }

  /** Helper method for tools to remove series lines from the chart */
  protected removeSeries(ids: string[]) {
    this.chartService.removeSeriesFromChart(ids);
  }

  /** Helper method to convert a Date to a day-of-year number */
  protected convertDateToDayNumber(date: Date): number {
    return this.chartService.convertDateToDayNumber(date);
  }

  /**
   * Unregisters this tool instance from ClimateChartService and executes per-tool cleanup.
   */
  protected cleanupToolState() {
    if (this.chartService.activeToolHandler() === this) {
      this.chartService.activeToolHandler.set(undefined);
    }
    this.onToolDestroy();
  }

  /** Optional per-tool custom cleanup hook for subclassed components */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onToolDestroy(): void {}
}
