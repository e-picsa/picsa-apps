import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LINE_TOOL_OPTIONS, PROBABILITY_TOOL_OPTIONS } from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';

import { IProbabilities } from '../../../models';
import { ClimateChartService } from '../../../services/climate-chart.service';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss'],
  imports: [MatButtonToggleModule, MatCardModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProbabilityToolComponent {
  private chartService = inject(ClimateChartService);

  readonly chartName = input<string>();
  readonly lineValue = input<number>();
  readonly values = input<number[]>([]);

  readonly probabilities = computed(() => {
    const lv = this.lineValue();
    const vals = this.values();
    if (lv !== undefined && vals && vals.length > 0) {
      return this.calculateProbabilities(lv, vals);
    }
    return undefined;
  });

  public options = computed(() => this.chartService.chartDefinition()?.tools.probability || PROBABILITY_TOOL_OPTIONS);

  /** Match probability block colors to line tool */
  public colorAbove = computed(
    () => this.chartService.chartDefinition()?.tools.line.above.color || LINE_TOOL_OPTIONS.above.color,
  );
  public colorBelow = computed(
    () => this.chartService.chartDefinition()?.tools.line.below.color || LINE_TOOL_OPTIONS.below.color,
  );

  calculateProbabilities(x: number, values: number[]): IProbabilities | undefined {
    if (x === undefined || x === null || !values) {
      return undefined;
    }
    const points = values;
    let totalAbove = 0;
    let totalBelow = 0;
    for (const point of points) {
      if (point != null) {
        if (point > x) {
          totalAbove++;
        } else {
          totalBelow++;
        }
      }
    }
    const total = totalAbove + totalBelow;
    return {
      above: {
        count: totalAbove,
        pct: Math.round((totalAbove / total) * 100),
        inTen: Math.round((totalAbove / total) * 10),
      },
      below: {
        count: totalBelow,
        pct: 100 - Math.round((totalAbove / total) * 100),
        inTen: 10 - Math.round((totalAbove / total) * 10),
      },
      total,
    };
  }

  public numberToArray(n: number) {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(i);
    return arr;
  }
}
