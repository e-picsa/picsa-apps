import { Component, Input, OnDestroy } from '@angular/core';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { calcPercentile } from '../../../services/climate-tool.service';

interface ITercile {
  value: number;
  labelPosition: { x: string; y: string };
}

@Component({
  selector: 'climate-terciles-tool',
  templateUrl: './terciles-tool.component.html',
  styleUrls: ['./terciles-tool.component.scss'],
  standalone: false,
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
      const terciles = [calcPercentile(arr, 1 / 3), calcPercentile(arr, 2 / 3)];
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
