import { Component, OnInit } from '@angular/core';
import { ClimateToolService } from 'src/app/services/climate-tool.service';
import { IProbabilities } from 'src/app/models';

@Component({
  selector: 'climate-probability-tool',
  templateUrl: './probability-tool.html',
  styleUrls: ['./probability-tool.scss']
})
export class ProbabilityToolComponent implements OnInit {
  probabilities = DEFAULT_PROBABILITIES;

  constructor(private climateService: ClimateToolService) {}

  ngOnInit(): void {}

  calculateProbabilities(value: number): IProbabilities {
    return this.climateService.calculateProbabilities(value);
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
