import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EL_NINO_YEARS, LA_NINA_YEARS } from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';
import { DataPoint } from 'c3';

import { getShapePath } from '../../../utils/chart-point-overlay';
import { BaseChartToolComponent, IPointStyle, ITooltipExtraRow } from '../base-tool.component';

const EL_NINO_SET = new Set(EL_NINO_YEARS);
const LA_NINA_SET = new Set(LA_NINA_YEARS);

type EnsoPhase = 'elNino' | 'laNina' | 'neutral';

const PHASE_STYLE: Record<EnsoPhase, IPointStyle> = {
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

  /** Legend entries, sharing marker geometry with the chart overlay */
  public readonly legendItems = (['elNino', 'laNina'] as const).map((phase) => ({
    label: phase === 'elNino' ? 'El Niño' : 'La Niña',
    path: getShapePath(PHASE_STYLE[phase].shape, PHASE_STYLE[phase].size),
    color: PHASE_STYLE[phase].fill,
    stroke: PHASE_STYLE[phase].stroke,
  }));

  public override getPointStyle(d: DataPoint): IPointStyle | undefined {
    if (!this.isDecoratable(d)) return undefined;
    return PHASE_STYLE[phaseOf(d.x)];
  }

  public override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    if (!this.validXValues().has(year)) return undefined;
    const phase = phaseOf(year);
    if (phase === 'elNino') return { text: `▲ El Niño`, color: '#d4802b' };
    if (phase === 'laNina') return { text: `■ La Niña`, color: '#13599e' };
    return undefined;
  }
}
