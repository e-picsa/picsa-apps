import { Component, Input } from '@angular/core';
import { IProbabilities } from 'src/app/models';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss']
})

// take an array of numbers (values) and number to test (x), and display metrics
export class ProbabilityToolComponent {
  @Input() values: number[];
  @Input() set x(x: number) {
    if (x && this.values) {
      this.probabilities = this.calculateProbabilities(x);
    }
  }
  @Input() chartName: string;
  probabilities = DEFAULT_PROBABILITIES;

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(x: number): IProbabilities {
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
    const ratio = this._toRatio(totalAbove, totalBelow);
    const total = totalAbove + totalBelow;
    return {
      above: {
        count: totalAbove,
        pct: Math.round((totalAbove / total) * 100),
        inTen: Math.round((totalAbove / total) * 10)
      },
      below: {
        count: totalBelow,
        pct: 100 - Math.round((totalAbove / total) * 100),
        inTen: 1 - Math.round((totalAbove / total) * 10)
      },
      total,
      ratio
    };
  }

  public numberToArray(n: number) {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(i);
    return arr;
  }

  // represent a number in simplest forms x:1 or 1:x
  private _toRatio(above: number, below: number) {
    let ratio = [0, 0];
    const i = Math.round((below + above) / above);
    const j = Math.round((below + above) / below);
    if (above != 0 && above <= below) {
      ratio = [1, i - 1];
    }
    if (below != 0 && below <= above) {
      ratio = [j - 1, 1];
    }
    return ratio as [number, number];
  }
}

const DEFAULT_PROBABILITIES = {
  above: {
    count: 0,
    pct: 0,
    inTen: 0
  },
  below: {
    count: 0,
    pct: 0,
    inTen: 0
  },
  total: 0,
  ratio: [0, 0]
};

// const MOCK_PROBABILITIES: IProbabilities = {
//   above: 30,
//   below: 9,
//   percentage: 0.7692307692307693,
//   reversePercentage: 0.23076923076923073,
//   ratio: [3, 1]
// };
