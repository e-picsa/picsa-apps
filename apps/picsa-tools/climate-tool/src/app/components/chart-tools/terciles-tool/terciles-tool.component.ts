import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

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

  public lowerTercile = signal<number>(0);
  public upperTercile = signal<number>(0);

  constructor() {
    super();
    effect(() => {
      const vals = this.values();
      this.generateTerciles(vals);
    });
  }

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

  protected override onToolDestroy() {
    this.upperTercile.set(0);
    this.lowerTercile.set(0);
  }

  private generateTerciles(values: number[]) {
    if (!values || values.length === 0) {
      this.lowerTercile.set(0);
      this.upperTercile.set(0);
      return;
    }

    const arr = [...values].filter((v) => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    const [lower, upper] = [Math.round(calcPercentile(arr, 1 / 3)), Math.round(calcPercentile(arr, 2 / 3))];

    this.lowerTercile.set(lower);
    this.upperTercile.set(upper);
  }
}
