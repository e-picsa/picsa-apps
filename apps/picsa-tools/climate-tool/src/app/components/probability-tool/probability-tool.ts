import { Component, Input, OnChanges } from '@angular/core';
import { IProbabilities } from '../../models';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss'],
})

// take an array of numbers (values) and number to test (x), and display metrics
export class ProbabilityToolComponent implements OnChanges {
  @Input() values: number[];
  @Input() x: number;
  @Input() chartName: string;
  // for start of seasion need to reverse
  @Input() reverseProbabilities: boolean;
  probabilities = DEFAULT_PROBABILITIES;

  ngOnChanges(): void {
    const p = this.calculateProbabilities();
    this.probabilities = this.reverseProbabilities
      ? this._swapValues(p, 'above', 'below')
      : p;
  }

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(): IProbabilities {
    const x = this.x;
    const points = this.values;
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

  private _swapValues(obj: any, key1: string, key2: string) {
    return {
      ...obj,
      [key1]: obj[key2],
      [key2]: obj[key1],
    };
  }
}

const DEFAULT_PROBABILITIES = {
  above: {
    count: 0,
    pct: 0,
    inTen: 0,
  },
  below: {
    count: 0,
    pct: 0,
    inTen: 0,
  },
  total: 0,
  ratio: [0, 0],
};
