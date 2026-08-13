import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { EL_NINO_YEARS, LA_NINA_YEARS } from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';
import { DataPoint } from 'c3';

import { getShapePath } from '../../../utils/chart-point-overlay';
import { BaseChartToolComponent, ILegendItem, IPointStyle, ITooltipExtraRow } from '../base-tool.component';

abstract class BaseEnsoTool extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  protected abstract readonly label: string;
  protected abstract readonly symbol: string;
  protected abstract readonly targetYears: readonly number[];
  protected abstract readonly activeStyle: IPointStyle;

  protected readonly neutralStyle: IPointStyle = {
    shape: 'circle',
    size: 4,
    fill: '#9e9e9e',
    opacity: 0.6,
  };

  protected readonly targetYearSet = computed(() => new Set(this.targetYears));

  public override getLegendItems(): ILegendItem[] {
    return [{ ...this.activeStyle, label: this.label, strokeWidth: 1.5 }];
  }

  public readonly legendItems = computed(() =>
    (this.getLegendItems() || []).map((item) => ({
      label: item.label,
      path: getShapePath(item.shape, 10),
      color: item.fill,
      stroke: item.stroke,
    })),
  );

  public override getPointStyle(d: DataPoint): IPointStyle | undefined {
    if (!this.isDecoratable(d)) return undefined;
    return this.targetYearSet().has(d.x) ? this.activeStyle : this.neutralStyle;
  }

  public override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    if (!this.validXValues().has(year)) return undefined;
    if (this.targetYearSet().has(year)) {
      return { text: `${this.symbol} ${this.label}`, color: this.activeStyle.fill };
    }
    return undefined;
  }
}

@Component({
  selector: 'climate-el-nino-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElNinoToolComponent extends BaseEnsoTool {
  protected override readonly label = 'El Niño';
  protected override readonly symbol = '▲';
  protected override readonly targetYears = EL_NINO_YEARS;
  protected override readonly activeStyle: IPointStyle = {
    shape: 'triangle',
    size: 12,
    fill: '#d4802b',
    stroke: '#b86b1f',
    strokeWidth: 1.5,
  };
}

@Component({
  selector: 'climate-la-nina-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaNinaToolComponent extends BaseEnsoTool {
  protected override readonly label = 'La Niña';
  protected override readonly symbol = '■';
  protected override readonly targetYears = LA_NINA_YEARS;
  protected override readonly activeStyle: IPointStyle = {
    shape: 'square',
    size: 8,
    fill: '#13599e',
    stroke: '#0d4277',
    strokeWidth: 1.5,
  };
}
