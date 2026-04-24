import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n/src';
import { ILineToolOptions, IProbabilityToolOptions } from '@picsa/models/src';

import { IProbabilities } from '../../../models';
import { ClimateChartService } from '../../../services/climate-chart.service';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss'],
  standalone: true,
  imports: [MatButtonToggleModule, MatCardModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProbabilityToolComponent implements OnInit {
  private chartService = inject(ClimateChartService);

  readonly chartName = input<string>();
  readonly lineValue = input<number>();
  readonly values = input<number[]>([]);

  public lineOptions: ILineToolOptions;
  public options: IProbabilityToolOptions;

  readonly probabilities = computed(() => {
    const lv = this.lineValue();
    const vals = this.values();
    if (lv !== undefined && vals && vals.length > 0) {
      return this.calculateProbabilities(lv, vals);
    }
    return undefined;
  });

  ngOnInit(): void {
    this.lineOptions = this.chartService.chartDefinition!.tools.line;
    this.options = this.chartService.chartDefinition!.tools.probability;
  }

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
