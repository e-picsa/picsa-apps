import { ChangeDetectionStrategy, Component, computed, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  EL_NINO_GRADES,
  EnsoCategory,
  EnsoGrade,
  formatRoniAnomaly,
  getEnso3MonthValue,
  getEnsoSeasonRecord,
  IEnsoGradeConfig,
  LA_NINA_GRADES,
  RONI_DATA_SOURCE,
} from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';
import { DataPoint } from 'c3';

import { getShapePath } from '../../../utils/chart-point-overlay';
import { BaseChartToolComponent, ILegendItem, IPointStyle, ITooltipExtraRow, PointShape } from '../base-tool.component';

export interface IEnsoGradeDisplayItem {
  grade: EnsoGrade;
  label: string;
  code: string;
  threshold: string;
  color: string;
  stroke: string;
  size: number;
  shape: PointShape;
  path: string;
  count: number;
  isSelected: boolean;
}

export abstract class BaseEnsoTool extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  public abstract readonly label: string;
  public abstract readonly symbol: string;
  public abstract readonly shape: PointShape;
  public abstract readonly category: EnsoCategory;
  public abstract readonly availableGrades: readonly IEnsoGradeConfig[];
  public abstract readonly selectedGrades: WritableSignal<Set<EnsoGrade>>;

  public readonly dataSource = RONI_DATA_SOURCE;

  protected readonly neutralStyle: IPointStyle = {
    shape: 'circle',
    size: 4,
    fill: '#9e9e9e',
    stroke: '#757575',
    strokeWidth: 1,
    opacity: 0.6,
  };

  /** Toggle a specific grading on/off */
  public toggleGrade(grade: EnsoGrade): void {
    const next = new Set(this.selectedGrades());
    if (next.has(grade)) {
      next.delete(grade);
    } else {
      next.add(grade);
    }
    this.selectedGrades.set(next);
    this.chartService.syncPointOverlay();
  }

  /** Select all available gradings */
  public selectAllGrades(): void {
    this.selectedGrades.set(new Set(this.availableGrades.map((g) => g.grade)));
    this.chartService.syncPointOverlay();
  }

  /** Clear all gradings */
  public clearAllGrades(): void {
    this.selectedGrades.set(new Set());
    this.chartService.syncPointOverlay();
  }

  /** Returns true if a given grade is selected */
  public isGradeSelected(grade: EnsoGrade): boolean {
    return this.selectedGrades().has(grade);
  }

  /** Look up the active grade config for a given year if it matches the current category and user selection */
  protected getActiveGradeConfig(year: number): IEnsoGradeConfig | undefined {
    const record = getEnsoSeasonRecord(year);
    if (
      record &&
      record.category === this.category &&
      record.grade !== null &&
      this.selectedGrades().has(record.grade)
    ) {
      return this.availableGrades.find((g) => g.grade === record.grade);
    }
    return undefined;
  }

  /** Helper to get IPointStyle for a specific grade */
  protected getPointStyleForGrade(gradeConfig: IEnsoGradeConfig): IPointStyle {
    return {
      shape: this.shape,
      size: gradeConfig.size,
      fill: gradeConfig.color,
      stroke: gradeConfig.stroke,
      strokeWidth: 1.5,
      opacity: 1,
    };
  }

  /** Items to render in the print SVG legend on chart canvas */
  public override getLegendItems(): ILegendItem[] {
    const selected = this.selectedGrades();
    const items: ILegendItem[] = [];

    for (const g of this.availableGrades) {
      if (selected.has(g.grade)) {
        items.push({
          shape: this.shape,
          size: g.size,
          fill: g.color,
          stroke: g.stroke,
          strokeWidth: 1.5,
          label: `${this.label} (${g.label})`,
        });
      }
    }

    items.push({
      shape: this.neutralStyle.shape,
      size: this.neutralStyle.size,
      fill: this.neutralStyle.fill,
      stroke: this.neutralStyle.stroke,
      strokeWidth: this.neutralStyle.strokeWidth,
      label: 'Neutral / Other',
    });

    return items;
  }

  /** Display items for the UI controls & interactive legend */
  public readonly displayItems = computed<IEnsoGradeDisplayItem[]>(() => {
    const selected = this.selectedGrades();
    const chartYears = this.validXValues();

    // Single-pass count of years matching each grade in active dataset
    const countsByGrade = new Map<EnsoGrade, number>();
    if (chartYears.size > 0) {
      for (const y of chartYears) {
        const rec = getEnsoSeasonRecord(y);
        if (rec?.category === this.category && rec.grade !== null) {
          countsByGrade.set(rec.grade, (countsByGrade.get(rec.grade) || 0) + 1);
        }
      }
    }

    return this.availableGrades.map((g) => ({
      grade: g.grade,
      label: g.label,
      code: g.code,
      threshold: g.threshold,
      color: g.color,
      stroke: g.stroke,
      size: g.size,
      shape: this.shape,
      path: getShapePath(this.shape, g.size),
      count: countsByGrade.get(g.grade) || 0,
      isSelected: selected.has(g.grade),
    }));
  });

  public readonly neutralLegendItem = computed(() => ({
    label: 'Neutral / Other',
    path: getShapePath(this.neutralStyle.shape, this.neutralStyle.size),
    color: this.neutralStyle.fill,
    stroke: this.neutralStyle.stroke,
  }));

  public override getPointStyle(d: DataPoint): IPointStyle | undefined {
    if (!this.isDecoratable(d)) return undefined;
    const gConfig = this.getActiveGradeConfig(d.x);
    if (gConfig) {
      return this.getPointStyleForGrade(gConfig);
    }
    return this.neutralStyle;
  }

  public override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    if (!this.validXValues().has(year)) return undefined;
    const gConfig = this.getActiveGradeConfig(year);
    const mode = this.chartService.timespanMode();

    if (mode === 'three_month') {
      const period = this.chartService.selectedPeriod();
      const val = period?.code ? getEnso3MonthValue(year, period.code) : undefined;
      const valStr = formatRoniAnomaly(val);

      if (gConfig) {
        const anomalySuffix = valStr && period?.code ? ` • ${period.code}: ${valStr}°C` : '';
        return {
          text: `${this.symbol} ${this.label} (${gConfig.label})${anomalySuffix}`,
          color: gConfig.color,
        };
      } else if (valStr && period?.code) {
        return {
          text: `RONI (${period.code}): ${valStr}°C`,
          color: '#64748b',
        };
      }
      return undefined;
    }

    // Annual mode
    if (gConfig) {
      return {
        text: `${this.symbol} ${this.label} (${gConfig.label})`,
        color: gConfig.color,
      };
    }

    return undefined;
  }
}

@Component({
  selector: 'climate-el-nino-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElNinoToolComponent extends BaseEnsoTool {
  public override readonly label = 'El Niño';
  public override readonly symbol = '▲';
  public override readonly shape: PointShape = 'triangle';
  public override readonly category: EnsoCategory = 'el_nino';
  public override readonly availableGrades = [
    EL_NINO_GRADES[1],
    EL_NINO_GRADES[2],
    EL_NINO_GRADES[3],
    EL_NINO_GRADES[4],
  ] as const;
  public override readonly selectedGrades = signal<Set<EnsoGrade>>(new Set([2, 3, 4]));
}

@Component({
  selector: 'climate-la-nina-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaNinaToolComponent extends BaseEnsoTool {
  public override readonly label = 'La Niña';
  public override readonly symbol = '■';
  public override readonly shape: PointShape = 'square';
  public override readonly category: EnsoCategory = 'la_nina';
  public override readonly availableGrades = [
    LA_NINA_GRADES[1],
    LA_NINA_GRADES[2],
    LA_NINA_GRADES[3],
  ] as const;
  public override readonly selectedGrades = signal<Set<EnsoGrade>>(new Set([2, 3]));
}
