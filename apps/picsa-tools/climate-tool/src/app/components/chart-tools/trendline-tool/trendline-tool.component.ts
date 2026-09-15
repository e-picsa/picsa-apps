import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateModule } from '@picsa/i18n';

import { TrendlineConfigService } from '../../../services/trendline-config.service';
import {
  calculateLinearRegression,
  formatConfidenceInterval,
  formatConfidenceIntervalParts,
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
  ciRange: string;
  ciUnit: string;
  decadeText: string;
  subtext?: string;
  isTemperature: boolean;
}

export type StatIndicatorKey = 'ci' | 'p' | 'n' | 'r2';

export interface IStatIndicatorDef {
  key: StatIndicatorKey;
  symbol: string;
  isItalic: boolean;
  menuAriaLabel: string;
  title: string;
  description: string;
  noteKeys?: { threshold: string; label: string }[];
}

export const STAT_INDICATORS: IStatIndicatorDef[] = [
  {
    key: 'ci',
    symbol: '95% CI',
    isItalic: false,
    menuAriaLabel: translateMarker('Info on confidence interval'),
    title: translateMarker('95% Confidence Interval'),
    description: translateMarker(
      'The estimated range within which the true historical rate of change per decade is 95% likely to lie.',
    ),
  },
  {
    key: 'p',
    symbol: 'p',
    isItalic: true,
    menuAriaLabel: translateMarker('Info on p-value'),
    title: translateMarker('Statistical Significance (p)'),
    description: translateMarker(
      'Evaluates whether the historical change is statistically distinguishable from random year-to-year fluctuations.',
    ),
    noteKeys: [
      { threshold: '< 0.05', label: translateMarker('Statistically clear trend (trendline displayed)') },
      { threshold: '≥ 0.05', label: translateMarker('No clear trend (trendline omitted)') },
    ],
  },
  {
    key: 'n',
    symbol: 'n',
    isItalic: true,
    menuAriaLabel: translateMarker('Info on sample size'),
    title: translateMarker('Usable Years (n)'),
    description: translateMarker(
      'The number of verified complete annual or seasonal records included in the calculation.',
    ),
  },
  {
    key: 'r2',
    symbol: 'R²',
    isItalic: true,
    menuAriaLabel: translateMarker('Info on coefficient of determination R²'),
    title: translateMarker('Goodness of Fit (R²)'),
    description: translateMarker(
      'Measures the proportion of year-to-year variation accounted for by the linear trend (from 0.00 to 1.00). In variable climate series, low R² values are common even when an important trend exists.',
    ),
  },
];

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

  /** Definition array for statistical indicator columns to drive clean, loop-based rendering */
  public readonly statIndicators = STAT_INDICATORS;

  /** Tracks expanded state of statistical details per series key (starts contracted) */
  public readonly expandedStats = signal<Record<string, boolean>>({});

  constructor() {
    super();
    // Reactively synchronize SVG trendline overlay whenever series analyses recompute
    effect(() => {
      this.seriesAnalyses();
      this.chartService.syncPointOverlay();
    });
  }

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

  public formatPValue(p: number | null | undefined): string {
    return formatPValue(p);
  }

  /**
   * Evaluates all data series defined on the active chart.
   * Computes OLS fit, decadal slope, Student's t p-value, and 95% Confidence Interval.
   */
  public readonly seriesAnalyses = computed<ISeriesTrendAnalysis[]>(() => {
    if (this.chartService.timespanMode() === 'monthly') {
      return [];
    }

    const def = this.chartService.chartDefinition();
    const data = this.chartService.chartData();
    const period = this.configService.period();

    if (!def || !data || data.length === 0) {
      return [];
    }

    const xVar = def.xVar || 'Year';

    return def.keys.map((key, index) => {
      const points: { x: number; y: number }[] = [];
      for (const row of data) {
        const xVal = Number(row[xVar]);
        const yVal = Number(row[key]);
        if (Number.isFinite(xVal) && Number.isFinite(yVal)) {
          points.push({ x: xVal, y: yVal });
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
      const ciParts = formatConfidenceIntervalParts(stats.ciLowerDecade, stats.ciUpperDecade, units, isTemperature);
      const decadeText = stats.changePerDecade !== null ? rateLabel : '—';

      return {
        key,
        label,
        color,
        stats,
        status: stats.status,
        rateLabel,
        ciLabel,
        ciRange: ciParts.range,
        ciUnit: ciParts.unit,
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
          strokeDasharray: 'none',
          label: item.rateLabel,
        });
      }
    }

    return lines;
  }

  public override getChartMessage(): IChartOverlayMessage | undefined {
    return undefined;
  }
}
