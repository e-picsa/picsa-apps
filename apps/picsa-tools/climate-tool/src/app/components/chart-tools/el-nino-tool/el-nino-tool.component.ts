import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EL_NINO_YEARS, LA_NINA_YEARS } from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';
import { DataPoint } from 'c3';

import { getShapePath } from '../../../utils/chart-point-overlay';
import { BaseChartToolComponent, ILegendItem, IPointStyle, ITooltipExtraRow } from '../base-tool.component';

const EL_NINO_SET = new Set(EL_NINO_YEARS);
const LA_NINA_SET = new Set(LA_NINA_YEARS);

type EnsoPhase = 'elNino' | 'laNina' | 'neutral';

const STYLES: Record<EnsoPhase, IPointStyle> = {
  elNino: { shape: 'triangle', size: 12, fill: '#d4802b', stroke: '#b86b1f', strokeWidth: 1.5 },
  laNina: { shape: 'square', size: 8, fill: '#13599e', stroke: '#0d4277', strokeWidth: 1.5 },
  neutral: { shape: 'circle', size: 4, fill: '#9e9e9e', opacity: 0.6 },
};

const phaseOf = (year: number): EnsoPhase =>
  EL_NINO_SET.has(year) ? 'elNino' : LA_NINA_SET.has(year) ? 'laNina' : 'neutral';

@Component({
  selector: 'climate-el-nino-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElNinoToolComponent extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  public override getLegendItems(): ILegendItem[] {
    return [
      { ...STYLES.elNino, label: 'El Niño', strokeWidth: 1.5 },
      { ...STYLES.laNina, label: 'La Niña', strokeWidth: 1.5 },
    ];
  }

  public readonly legendItems = (this.getLegendItems() || []).map((item) => ({
    label: item.label,
    path: getShapePath(item.shape, 10),
    color: item.fill,
    stroke: item.stroke,
  }));

  public override getPointStyle(d: DataPoint): IPointStyle | undefined {
    if (!this.isDecoratable(d)) return undefined;
    return STYLES[phaseOf(d.x)];
  }

  public override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    if (!this.validXValues().has(year)) return undefined;
    const phase = phaseOf(year);
    if (phase === 'elNino') return { text: `▲ El Niño`, color: STYLES.elNino.fill };
    if (phase === 'laNina') return { text: `■ La Niña`, color: STYLES.laNina.fill };
    return undefined;
  }
}
