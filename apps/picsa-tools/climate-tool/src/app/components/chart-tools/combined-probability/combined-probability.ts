import { Component, Input } from '@angular/core';
import { IStationData } from '@picsa/models';

import { ClimateDataService } from '../../../services/climate-data.service';

@Component({
  selector: 'climate-combined-probability',
  templateUrl: 'combined-probability.html',
  standalone: false,
})
export class CombinedProbabilityComponent {
  @Input() data: IStationData[];

  plantDate: any;
  labels: any;
  crops: any;
  startProbability: any = { reversePercentage: null };
  lengthProbability: any = { reversePercentage: null };
  selectedCrop: any = {};
  dayValue: number;
  test = 'red';

  constructor(public dataService: ClimateDataService) {
    this.plantDate = { min: 1, max: 8, value: 3, step: 1 };
    this.labels = {
      1: 'Week 1, November',
      2: 'Week 2, November',
      3: 'Week 3, November',
      4: 'Week 4, November',
      5: 'Week 1, December',
      6: 'Week 2, December',
      7: 'Week 3, December',
      8: 'Week 4, December',
    };
  }
  plantDateChange(e) {
    //manually set 1 October as day 274 and multiple by 7.6 (rough number of days in 1/4 month)
    this.dayValue = 305 + (365 / 48) * this.plantDate.value;
    this.startProbability = this.calculateCombinedProbability(this.data, [
      { key: 'Start', value: this.dayValue, operator: '<=' },
    ]);
    this.calculateCropProbabilities();
    // console.log('start probability', this.startProbability);
    // console.log('day value', this.dayValue);
  }
  calculateCropProbabilities() {
    for (const crop of this.crops) {
      this.crops[crop.index].lengthProbability = this.calculateCombinedProbability(this.data, [
        {
          key: 'End',
          value: (this.dayValue + crop.lengthAvg) % 366,
          operator: '>=',
        },
      ]);
      this.crops[crop.index].rainfallProbability = this.calculateCombinedProbability(this.data, [
        {
          key: 'Rainfall',
          value: crop.waterAvg * (1 + this.plantDate.value / 16),
          operator: '>=',
        },
      ]);
    }
  }

  /******************************************************************************
   *  Not currently in use, but may want in future
   *****************************************************************************/
  // used by combined probabilty component (not currently in use)
  private calculateCombinedProbability(
    data?: IStationData[],
    conditions: { key: string; value: any; operator: '>=' | '<=' }[] = []
  ) {
    // //conditions are defined in format {key1:valueToTest1, key2:valueToTest2...}
    // console.log('data', data);
    // //remove values where conditions aren't known - current assumes null values non-numerical (e.g. string or null, may want to change later)
    // for (const condition of conditions) {
    //   console.log('testing condition', condition);
    //   const key = condition.key;
    //   const value = condition.value;
    //   data = data.filter(element => {
    //     return typeof element[key] == 'number';
    //   });
    // }
    // //filter based on coditions
    // const length = data.length;
    // for (const condition of conditions) {
    //   const key = condition.key;
    //   const value = condition.value;
    //   if (condition.operator == '>=') {
    //     data = data.filter(element => {
    //       return element[key] >= value;
    //     });
    //   }
    //   if (condition.operator == '<=') {
    //     data = data.filter(element => {
    //       return element[key] <= value;
    //     });
    //   }
    // }
    // const percentage = data.length / length;
    // const colors = {
    //   0: '#BF7720',
    //   10: '#B77A26',
    //   20: '#AF7E2D',
    //   30: '#A88134',
    //   40: '#A0853B',
    //   50: '#998942',
    //   60: '#918C49',
    //   70: '#899050',
    //   80: '#829357',
    //   90: '#7A975E',
    //   100: '#739B65'
    // };
    // const color = colors[Math.round(percentage * 10) * 10];
    // return {
    //   results: data,
    //   percentage: percentage,
    //   reversePercentage: 1 - percentage,
    //   color: color
    // };
  }
}
