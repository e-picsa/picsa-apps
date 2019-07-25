import { Component, OnInit, Input } from '@angular/core';
import { ClimateToolService } from 'src/app/services/climate-tool.service';
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
  probabilities = DEFAULT_PROBABILITIES;

  // given a line tool value lookup the existing values and return probability information
  // based on how many points are above and below the given value
  // various outputs used to assist rendering graphics (e.g. number arrays and reverse %)
  calculateProbabilities(x: number): IProbabilities {
    const points = this.values;
    let above = 0,
      below = 0,
      ratio = [0, 0];
    for (const point of points) {
      if (point != null) {
        if (point >= x) {
          above++;
        } else {
          below++;
        }
      }
    }
    const percentage = above / (above + below);
    const reversePercentage = 1 - percentage;
    const i = Math.round((below + above) / above);
    const j = Math.round((below + above) / below);
    if (above != 0 && above <= below) {
      ratio = [1, i - 1];
    }
    if (below != 0 && below <= above) {
      ratio = [j - 1, 1];
    }
    const tens = {
      above: Array(Math.round(percentage * 10)).fill(1),
      below: Array(Math.round(reversePercentage * 10)).fill(-1),
      value: Math.round(percentage * 10) * 10
    };
    return {
      above: above,
      below: below,
      percentage: percentage,
      reversePercentage: reversePercentage,
      ratio: ratio,
      tens: tens
    };
  }
}

const DEFAULT_PROBABILITIES: IProbabilities = {
  above: 0,
  below: 0,
  percentage: 0,
  ratio: [0, 0],
  reversePercentage: 0,
  tens: {
    above: [],
    below: [],
    value: 0
  }
};
