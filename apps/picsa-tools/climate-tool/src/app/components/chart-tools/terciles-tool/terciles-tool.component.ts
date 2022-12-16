import { Component, Input, OnDestroy } from '@angular/core';
import { ClimateChartService } from '../../../services/climate-chart.service';

interface ITercile {
  value: number;
  labelPosition: { x: string; y: string };
}

@Component({
  selector: 'climate-terciles-tool',
  templateUrl: './terciles-tool.component.html',
  styleUrls: ['./terciles-tool.component.scss'],
})
export class TercilesToolComponent implements OnDestroy {
  /** Value of current series data displayed */
  @Input() set values(values: number[]) {
    setTimeout(() => {
      this.generateTerciles(values);
    }, 200);
  }

  terciles: { upper?: ITercile; lower?: ITercile } = {};

  constructor(private chartService: ClimateChartService) {}

  ngOnDestroy() {
    // when tool is toggle off also remove from the graph
    this.generateTerciles([]);
  }

  private generateTerciles(values?: number[]) {
    if (values && values.length > 0) {
      const arr = values.sort((a, b) => a - b).filter((v) => v !== undefined);
      const terciles = [percentile(arr, 1 / 3), percentile(arr, 2 / 3)];
      this.updateChart('lower', Math.round(terciles[0]));
      this.updateChart('upper', Math.round(terciles[1]));
    } else {
      this.terciles = {};
      this.updateChart('lower', 0);
      this.updateChart('upper', 0);
    }
  }
  private updateChart(tercile: 'lower' | 'upper', value: number) {
    if (value) {
      this.chartService.addFixedLineToChart(value, `${tercile}Tercile`);
      setTimeout(() => {
        const labelPosition = this.getTextLabelPosition(tercile);
        this.terciles[tercile] = { value, labelPosition };
      }, 500);
    } else {
      this.chartService.removeSeriesFromChart([`${tercile}Tercile`]);
    }
  }
  /**
   * Lookup the rendered tercile line and use to position fixed label dom element
   */
  private getTextLabelPosition(tercile: 'lower' | 'upper') {
    const chartPathEl = document.querySelector(`.c3-line-${tercile}Tercile`);
    if (chartPathEl) {
      const { x, y, width } = chartPathEl.getBoundingClientRect();
      const yOffset = tercile === 'lower' ? 16 : -48;
      return { x: Math.round(x) + 'px', y: Math.round(y) + yOffset + 'px' };
    } else {
      return { x: '-100vw', y: '-100vh' };
    }
  }
}

/**
 * Returns the value at a given percentile in a sorted numeric array.
 * "Linear interpolation between closest ranks" method
 * https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
 *
 * @param p percentile to calculate, as a decimal between 0 and 1
 */

function percentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 1) return arr[arr.length - 1];

  const index = (arr.length - 1) * p;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= arr.length) return arr[lower];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}

// Returns the percentile of the given value in a sorted numeric array.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function percentRank(arr: number[], v: number) {
  if (typeof v !== 'number') throw new TypeError('v must be a number');
  for (let i = 0, l = arr.length; i < l; i++) {
    if (v <= arr[i]) {
      while (i < l && v === arr[i]) i++;
      if (i === 0) return 0;
      if (v !== arr[i - 1]) {
        i += (v - arr[i - 1]) / (arr[i] - arr[i - 1]);
      }
      return i / l;
    }
  }
  return 1;
}
