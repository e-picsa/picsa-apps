import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';

import { calculateLinearRegression, ITrendlineStats } from '../../../utils/statistics.utils';
import { BaseChartToolComponent, IChartOverlayMessage, ITrendlineOverlay } from '../base-tool.component';

export type TrendDirectionStatus = 'up' | 'down' | 'none' | 'insufficient';

export interface ISeriesTrendAnalysis {
  key: string;
  label: string;
  color: string;
  stats: ITrendlineStats;
  status: TrendDirectionStatus;
  rateLabel: string;
  decadeText: string;
}

@Component({
  selector: 'climate-trendline-tool',
  templateUrl: './trendline-tool.component.html',
  styleUrls: ['./trendline-tool.component.scss'],
  imports: [CommonModule, MatCardModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendlineToolComponent extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  private translate = inject(PicsaTranslateService);

  /** Series trend analyses for all keys in the active chart */
  public readonly seriesAnalyses = computed<ISeriesTrendAnalysis[]>(() => {
    const data = this.chartData();
    const def = this.chartDefinition();
    if (!data?.length || !def?.keys?.length) return [];

    const xVar = def.xVar || 'Year';
    const pThreshold = def.tools?.trendline?.pThreshold ?? 0.05;
    const rThreshold = def.tools?.trendline?.rThreshold ?? 0.3;

    return def.keys.map((key, index) => {
      const points: { x: number; y: number }[] = [];
      for (const row of data) {
        const x = row[xVar] as number;
        const y = row[key] as number;
        if (typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)) {
          points.push({ x, y });
        }
      }

      const stats = calculateLinearRegression(points, pThreshold, rThreshold);
      const color = def.colors?.[index] || '#13599e';
      const label = def.data_labels?.[key] || (def.keys.length === 1 ? def.name : String(key));
      const units = def.units || '';

      const status: TrendDirectionStatus =
        stats.n < 3 ? 'insufficient' : stats.hasTrend ? (stats.slope > 0 ? 'up' : 'down') : 'none';

      const sign = stats.changePerDecade >= 0 ? '+' : '';
      const unitStr = units ? ` ${units}` : '';
      const rateLabel = stats.n >= 3 ? `${sign}${stats.changePerDecade.toFixed(1)}${unitStr}/10y` : '';
      const decadeText = stats.n >= 3 ? `${sign}${stats.changePerDecade.toFixed(1)}${unitStr} / decade` : '—';

      return {
        key,
        label,
        color,
        stats,
        status,
        rateLabel,
        decadeText,
      };
    });
  });

  public override getTrendlines(): ITrendlineOverlay[] | undefined {
    const analyses = this.seriesAnalyses();
    const lines: ITrendlineOverlay[] = [];

    for (const item of analyses) {
      if (item.stats.hasTrend) {
        lines.push({
          id: `trendline-${item.key}`,
          seriesKey: item.key,
          startX: item.stats.startX,
          endX: item.stats.endX,
          startY: item.stats.startY,
          endY: item.stats.endY,
          color: item.color,
          strokeWidth: 2.5,
          strokeDasharray: '8 4',
          label: item.rateLabel,
        });
      }
    }

    return lines;
  }

  public override getChartMessage(): IChartOverlayMessage | undefined {
    const analyses = this.seriesAnalyses();
    if (!analyses.length) return undefined;

    const withTrend = analyses.filter((a) => a.stats.hasTrend);
    const withoutTrend = analyses.filter((a) => !a.stats.hasTrend);

    // If all series have a significant trend, no banner is needed
    if (withoutTrend.length === 0) {
      return undefined;
    }

    // Check if any series has insufficient data (< 3 observations)
    const insufficient = analyses.filter((a) => a.stats.n < 3);
    if (insufficient.length === analyses.length) {
      return {
        text: this.translate.instant(translateMarker('Insufficient data to determine trend')),
        subtext: this.translate.instant(translateMarker('At least 3 valid observations required')),
        color: '#475467',
        backgroundColor: '#f8f9fa',
        borderColor: '#d0d5dd',
      };
    }

    // Case 1: Single series chart without trend
    if (analyses.length === 1) {
      const single = analyses[0];
      const pStr = this.formatPValue(single.stats.pValue);
      const rStr = single.stats.r.toFixed(2);
      return {
        text: this.translate.instant(translateMarker('No strong trend detected')),
        subtext: `|r| = ${Math.abs(single.stats.r).toFixed(2)} (r = ${rStr}), p = ${pStr}`,
        color: '#475467',
        backgroundColor: '#f8f9fa',
        borderColor: '#d0d5dd',
      };
    }

    // Case 2: Multi-series chart where none have a trend
    if (withTrend.length === 0) {
      return {
        text: this.translate.instant(translateMarker('No strong trend detected')),
        subtext: this.translate.instant(
          translateMarker('None of the series meet the significance threshold (p < 0.05, |r| ≥ 0.3)'),
        ),
        color: '#475467',
        backgroundColor: '#f8f9fa',
        borderColor: '#d0d5dd',
      };
    }

    // Case 3: Multi-series chart where some have a trend, but some do not
    const noTrendNames = withoutTrend.map((a) => a.label).join(', ');
    return {
      text: `${this.translate.instant(translateMarker('No strong trend for'))}: ${noTrendNames}`,
      subtext: this.translate.instant(translateMarker('Other series trendlines are plotted below')),
      color: '#475467',
      backgroundColor: '#f8f9fa',
      borderColor: '#d0d5dd',
    };
  }

  public formatPValue(p: number): string {
    if (p < 0.001) return '< 0.001';
    return p.toFixed(3);
  }
}
