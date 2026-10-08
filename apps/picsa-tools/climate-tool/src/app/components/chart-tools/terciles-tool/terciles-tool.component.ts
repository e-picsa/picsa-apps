import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { calcPercentile } from '../../../services/climate-tool.service';
import { BaseChartToolComponent, IOverlayLine } from '../base-tool.component';

@Component({
  selector: 'climate-terciles-tool',
  templateUrl: './terciles-tool.component.html',
  styleUrls: ['./terciles-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TercilesToolComponent extends BaseChartToolComponent {
  public override readonly usesPointOverlay = true;

  /** Value of current series data displayed */
  readonly values = input<number[]>([]);

  readonly sortedValues = computed<number[]>(() => {
    const vals = this.values();
    if (!vals || vals.length === 0) return [];
    return [...vals].filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  });

  readonly lowerTercile = computed<number>(() => {
    const arr = this.sortedValues();
    if (arr.length === 0) return 0;
    return Math.round(calcPercentile(arr, 1 / 3));
  });

  readonly upperTercile = computed<number>(() => {
    const arr = this.sortedValues();
    if (arr.length === 0) return 0;
    return Math.round(calcPercentile(arr, 2 / 3));
  });

  public override getOverlayLines(): IOverlayLine[] | undefined {
    const lower = this.lowerTercile();
    const upper = this.upperTercile();
    const lines: IOverlayLine[] = [];
    if (lower) {
      lines.push({
        id: 'tercile-lower',
        value: lower,
        color: '#aa1818',
        strokeWidth: 2.5,
        strokeDasharray: '6 4',
        label: {
          text: `Lower = ${this.formatYValue(lower)}`,
          position: 'left',
          color: '#000000',
          background: '#ffffff',
          borderColor: '#aa1818',
        },
      });
    }
    if (upper) {
      lines.push({
        id: 'tercile-upper',
        value: upper,
        color: '#aa1818',
        strokeWidth: 2.5,
        strokeDasharray: '6 4',
        label: {
          text: `Upper = ${this.formatYValue(upper)}`,
          position: 'left',
          color: '#000000',
          background: '#ffffff',
          borderColor: '#aa1818',
        },
      });
    }
    return lines;
  }
}
