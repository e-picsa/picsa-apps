import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { TrendlineConfigService } from '../../../services/trendline-config.service';
import {
  calculateLinearRegression,
  formatConfidenceInterval,
  formatDecadeRate,
  formatPValue,
  type ITrendlineStats,
  type TrendlinePeriod,
  type TrendStatus,
} from '../../../utils/statistics.utils';
import { PicsaClimateMaterialModule } from '../../material.module';
import { BaseChartToolComponent, type IChartOverlayMessage, type ITrendlineOverlay } from '../base-tool.component';
import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';

export interface ISeriesTrendAnalysis {
  key: string;
  label: string;
  color: string;
  stats: ITrendlineStats;
  status: TrendStatus;
  rateLabel: string;
  ciLabel: string;
  decadeText: string;
  subtext?: string;
  isTemperature: boolean;
}

@Component({
  selector: 'climate-trendline-tool',
  templateUrl: './trendline-tool.component.html',
  styleUrls: ['./trendline-tool.component.scss'],
  imports: [DecimalPipe, PicsaClimateMaterialModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendlineToolComponent extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  public readonly configService = inject(TrendlineConfigService);
  private readonly dialog = inject(MatDialog);

  /** Tracks expanded state of statistical details per series key (starts contracted) */
  public readonly expandedStats = signal<Record<string, boolean>>({});

  public toggleStats(key: string): void {
    this.expandedStats.update((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  public setPeriod(period: TrendlinePeriod): void {
    this.configService.setPeriod(period);
    this.chartService.syncPointOverlay();
  }

  public openMethodologyDialog(): void {
    this.dialog.open(TrendlineMethodologyDialogComponent, {
      width: '540px',
      maxWidth: '92vw',
    });
  }

  /** Series trend analyses for all keys in the active chart */
  public readonly seriesAnalyses = computed<ISeriesTrendAnalysis[]>(() => {
    // Trendline is strictly scoped to annual and seasonal indicators, not monthly
    if (this.chartService.timespanMode() === 'monthly') {
      return [];
    }

    const data = this.chartData();
    const def = this.chartDefinition();
    if (!data?.length || !def?.keys?.length) return [];

    const xVar = def.xVar || 'Year';
    const period = this.configService.period();

    return def.keys.map((key, index) => {
      const points: { x: number; y: number }[] = [];
      for (const row of data) {
        const x = row[xVar] as number;
        const y = row[key] as number;
        // Never convert missing values to zero or treat incomplete totals as complete
        if (typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)) {
          points.push({ x, y });
        }
      }

      const stats = calculateLinearRegression(points, period);
      const color = def.colors?.[index] || '#13599e';
      const label = def.data_labels?.[key] || (def.keys.length === 1 ? def.name : String(key));
      const units = def.units || '';

      const isTemperature =
        units.toLowerCase().includes('°c') || units.toLowerCase().includes('c') || key.toLowerCase().includes('temp');

      const rateLabel = formatDecadeRate(stats.changePerDecade, units, isTemperature);
      const ciLabel = formatConfidenceInterval(stats.ciLowerDecade, stats.ciUpperDecade, units, isTemperature);
      const decadeText = stats.changePerDecade !== null ? rateLabel : '—';

      return {
        key,
        label,
        color,
        stats,
        status: stats.status,
        rateLabel,
        ciLabel,
        decadeText,
        subtext: stats.subtext,
        isTemperature,
      };
    });
  });

  /**
   * Generates trendlines for SVG chart overlay.
   * Public graph display rule:
   * - Plotted as a solid coloured line ONLY when statistically distinguishable from zero (p < 0.05).
   * - No line is plotted for inconclusive direction ('no_clear_trend') or insufficient data.
   */
  public override getTrendlines(): ITrendlineOverlay[] | undefined {
    if (this.chartService.timespanMode() === 'monthly') {
      return [];
    }

    const analyses = this.seriesAnalyses();
    const lines: ITrendlineOverlay[] = [];

    for (const item of analyses) {
      if (item.stats.shouldPlotLine) {
        lines.push({
          id: `trendline-${item.key}`,
          seriesKey: item.key,
          startX: item.stats.startX,
          endX: item.stats.endX,
          startY: item.stats.startY,
          endY: item.stats.endY,
          color: item.color,
          strokeWidth: 2.5,
          label: item.rateLabel,
        });
      }
    }

    return lines;
  }

  public override getChartMessage(): IChartOverlayMessage | undefined {
    return undefined;
  }

  public formatPValue(p: number | null): string {
    return formatPValue(p);
  }
}
