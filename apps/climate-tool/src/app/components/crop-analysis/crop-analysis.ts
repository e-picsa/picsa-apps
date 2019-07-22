import { Component, OnInit } from '@angular/core';
import { ICropRequirement } from '@picsa/models';
import * as DATA from 'src/app/data';

@Component({
  selector: 'climate-crop-analysis',
  templateUrl: './crop-analysis.html',
  styleUrls: ['./crop-analysis.scss']
})
export class CropAnalysisComponent implements OnInit {
  selectedCrop: ICropRequirement;
  crops = DATA.CROP_REQUIREMENTS;

  constructor() {}

  ngOnInit(): void {}

  setCrop(crop: ICropRequirement) {
    this.selectedCrop = crop;
    const cropValues = {
      rain: this._calculateMean(crop.waterMin, crop.waterMax),
      length: this._calculateMean(crop.daysMin, crop.daysMax)
    };
    console.log('crop values', cropValues);
  }

  // sometimes either min or max is not defined, so in that case simply return
  // the min/max that is given. Otherwise simple mean average
  _calculateMean(min?: number, max?: number) {
    if (!min) {
      min = max as number;
    }
    if (!max) {
      max = min as number;
    }
    return (min + max) / 2;
  }
}
