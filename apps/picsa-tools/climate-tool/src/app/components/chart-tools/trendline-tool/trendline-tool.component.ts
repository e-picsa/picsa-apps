import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { PicsaTranslateModule } from '@picsa/i18n';

import { TrendlineConfigService } from '../../../services/trendline-config.service';
import {
  calculateLinearRegression,
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
  decadeText: string;
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
  private readonly translate = inject(TranslateService);
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

      const sign = stats.changePerDecade !== null && stats.changePerDecade >= 0 ? '+' : '';
      const unitStr = units ? ` ${units}` : '';
      const rateLabel =
        stats.changePerDecade !== null ? `${sign}${stats.changePerDecade.toFixed(1)}${unitStr} / decade` : '';
      const decadeText = rateLabel || '—';

      return {
        key,
        label,
        color,
        stats,
        status: stats.status,
        rateLabel,
        decadeText,
      };
    });
  });

  public override getTrendlines(): ITrendlineOverlay[] | undefined {
    if (this.chartService.timespanMode() === 'monthly') {
      return [];
    }

    const analyses = this.seriesAnalyses();
    const lines: ITrendlineOverlay[] = [];

    for (const item of analyses) {
      if (item.stats.shouldPlotLine) {
        const isSignificant = item.stats.status === 'significant_up' || item.stats.status === 'significant_down';
        const isUncertain = item.stats.status === 'uncertain_trend';

        let color = item.color;
        const strokeDasharray = '8 4';
        const strokeWidth = 2.5;
        let label = item.rateLabel;

        if (!isSignificant) {
          // Grey line for non-significant trends (uncertain or weak)
          color = '#98a2b3';
          const tag = isUncertain
            ? this.translate.instant(translateMarker('uncertain'))
            : this.translate.instant(translateMarker('weak'));
          label = `${item.rateLabel}\n${tag}`;
        }

        lines.push({
          id: `trendline-${item.key}`,
          seriesKey: item.key,
          startX: item.stats.startX,
          endX: item.stats.endX,
          startY: item.stats.startY,
          endY: item.stats.endY,
          color,
          strokeWidth,
          strokeDasharray,
          label,
        });
      }
    }

    return lines;
  }

  /**
   * Upper chart message summary removed as it does not add value over the
   * on-line overlay labels and sidebar panel details.
   */
  public override getChartMessage(): IChartOverlayMessage | undefined {
    return undefined;
  }

  public formatPValue(p: number | null): string {
    return formatPValue(p);
  }
}
