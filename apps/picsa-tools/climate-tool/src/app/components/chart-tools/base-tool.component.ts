import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { DataPoint } from 'c3';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';

export const TOOL_SERIES_IDS = ['LineTool', 'lowerTercile', 'upperTercile'];

export interface ITooltipExtraRow {
  text: string;
  color: string;
}

export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond';

/**
 * Declarative marker definition for a single data point.
 * NOTE - paint properties are applied as inline SVG attributes (not CSS) so that
 * markers survive PNG export via `svgToPngBlob`.
 */
export interface IPointStyle {
  shape: PointShape;
  /** radius / half-extent in px, at the default point scale */
  size: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export abstract class BaseChartToolComponent {
  protected chartService = inject(ClimateChartService);
  protected toolService = inject(ClimateToolService);
  protected destroyRef = inject(DestroyRef);

  protected readonly chartDefinition = computed(() => this.chartService.chartDefinition());
  protected readonly chartSeriesData = computed(() => this.chartService.chartSeriesData());
  protected readonly stationData = computed(() => this.chartService.stationData());
  protected readonly chartConfig = computed(() => this.chartService.chartConfig());
  protected readonly chartRendered$ = this.chartService.chartRendered$;

  /**
   * Set true in subclasses that implement `getPointStyle`, so the chart service
   * knows to render the custom marker overlay and hide C3's default circles.
   */
  public readonly usesPointOverlay: boolean = false;

  constructor() {
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

  /** Override to draw a custom marker in place of C3's default circle */
  public getPointStyle(d: DataPoint): IPointStyle | undefined {
    return undefined;
  }

  public formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    return undefined;
  }

  /** Set of x values (usually years) having at least one finite value on the active chart */
  protected readonly validXValues = computed(() => {
    const data = this.stationData();
    const def = this.chartDefinition();
    const values = new Set<number>();
    if (!data?.length || !def) return values;

    const xVar = def.xVar || 'Year';
    for (const row of data) {
      const x = row[xVar] as number;
      if (Number.isFinite(x) && (def.keys || []).some((key) => Number.isFinite(row[key]))) {
        values.add(x);
      }
    }
    return values;
  });

  /** Shared guard excluding tool series and x values without data */
  protected isDecoratable(d: DataPoint): d is DataPoint & { x: number } {
    if (typeof d?.x !== 'number') return false;
    if (d.id && TOOL_SERIES_IDS.includes(d.id)) return false;
    return this.validXValues().has(d.x);
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
