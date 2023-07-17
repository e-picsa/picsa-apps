import { Component, Input, OnInit } from '@angular/core';

import { IProbabilities } from '../../../models';
import { ClimateChartService } from '../../../services/climate-chart.service';
import { ILineToolOptions, IProbabilityToolOptions } from '@picsa/models/src';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss'],
})

// take an array of numbers (values) and number to test (x), and display metrics
export class ProbabilityToolComponent implements OnInit {
  @Input() chartName: string;

  probabilities?: IProbabilities;

  /** Probability tool inherits various options from line tool (e.g. colors) */
  public lineOptions: ILineToolOptions;

  /** Specific options exposed in chart configuration for override */
  public options: IProbabilityToolOptions;

  /** Chart series values */
  private _values: number[] = [];

  /** Target line value */
  private _lineValue: number;

  @Input() set lineValue(lineValue: number) {
    this._lineValue = lineValue;
    this.updateProbabilities();
  }

  // HACK - use multiple set methods to calc probabilities to ensure
  // both lineValue and chart values are populated (TODO - find tidier way to handle)
  @Input() set values(values: number[]) {
    this._values = values;
    this.updateProbabilities();
  }

  constructor(private chartService: ClimateChartService) {}

  ngOnInit(): void {
    this.lineOptions = this.chartService.chartDefinition!.tools.line;
    this.options = this.chartService.chartDefinition!.tools.probability;
  }

  private updateProbabilities() {
    if (this._lineValue && this._values) {
      this.probabilities = this.calculateProbabilities(this._lineValue, this._values);
    } else {
      this.probabilities = undefined;
    }
  }

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(x: number, values: number[]): IProbabilities | undefined {
    // ensure both properties passed
    if (!x || !values) {
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
