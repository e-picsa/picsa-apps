import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { isEqual } from '@picsa/utils/object.utils';

import { calcPercentile } from '../../../services/climate-tool.service';
import { BaseChartToolComponent } from '../base-tool.component';

@Component({
  selector: 'climate-terciles-tool',
  templateUrl: './terciles-tool.component.html',
  styleUrls: ['./terciles-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle],
})
export class TercilesToolComponent extends BaseChartToolComponent {
  /** Value of current series data displayed */
  readonly values = input<number[]>([]);

  constructor() {
    super();
    effect(() => {
      const vals = this.values();
      this.generateTerciles(vals);
    });
  }

  public lowerTercile = signal<number>(0);
  public upperTercile = signal<number>(0);

  public labelStyles = {
    lower: signal(this.generateLabelStyles('lower'), { equal: isEqual }),
    upper: signal(this.generateLabelStyles('upper'), { equal: isEqual }),
  };

  protected override onToolDestroy() {
    // When tool is toggled off, remove lines from graph
    this.generateTerciles([]);
    this.removeSeries(['lowerTercile', 'upperTercile']);
    this.upperTercile.set(0);
    this.lowerTercile.set(0);
  }

  private generateTerciles(values: number[]) {
    const arr = values.sort((a, b) => a - b).filter((v) => v !== undefined);
    const [lower, upper] = [Math.round(calcPercentile(arr, 1 / 3)), Math.round(calcPercentile(arr, 2 / 3))];

    this.addFixedLine(lower, 'lowerTercile');
    this.addFixedLine(upper, 'upperTercile');

    this.lowerTercile.set(lower);
    this.upperTercile.set(upper);

    // ensure terciles rendered before positioning lable
    setTimeout(() => {
      this.labelStyles.lower.set(this.generateLabelStyles('lower'));
      this.labelStyles.upper.set(this.generateLabelStyles('upper'));
    }, 50);
  }

  /**
   * Lookup the rendered tercile line and use to position fixed label dom element
   */
  private generateLabelStyles(tercile: 'lower' | 'upper') {
    const chartPathEl = document.querySelector(`.c3-line-${tercile}Tercile`);
    if (chartPathEl) {
      const { x, y } = chartPathEl.getBoundingClientRect();

      const yOffset = tercile === 'lower' ? 16 : -48;
      return { left: Math.round(x) + 'px', top: Math.round(y) + yOffset + 'px' };
    } else {
      return { left: '-100vw', top: '-100vh' };
    }
  }
}
