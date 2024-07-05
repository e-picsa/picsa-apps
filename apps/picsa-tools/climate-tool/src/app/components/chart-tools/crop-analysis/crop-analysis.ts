import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICropRequirement } from '@picsa/models';

@Component({
  selector: 'climate-crop-analysis',
  templateUrl: './crop-analysis.html',
  styleUrls: ['./crop-analysis.scss'],
})
export class CropAnalysisComponent implements OnInit {
  selectedCrops: { [variety: string]: ICropRequirement } = {};
  totalSelected = 0;
  cropGroups: any[];
  @Output() cropsSelected = new EventEmitter<ICropRequirement[]>();
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Removed CC 2024-06 hardcoded cropdata list
    this.cropGroups = this._generateCropGroups([]);
  }

  toggleCropVariety(crop: ICropRequirement) {
    if (this.selectedCrops.hasOwnProperty(crop.variety)) {
      delete this.selectedCrops[crop.variety];
    } else {
      this.selectedCrops[crop.variety] = crop;
    }
    this.totalSelected = Object.keys(this.selectedCrops).length;
  }
  goToAnalysis() {
    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: { crops: Object.keys(this.selectedCrops) },
    //   queryParamsHandling: 'merge'
    // });
    this.cropsSelected.emit(Object.values(this.selectedCrops));
  }

  // private setCrop(crop: ICropRequirement) {
  //   const cropValues = {
  //     rain: this._calculateMean(crop.waterMin, crop.waterMax),
  //     length: this._calculateMean(crop.daysMin, crop.daysMax),
  //   };
  //   console.log('crop values', cropValues);
  // }

  private _generateCropGroups(crops: ICropRequirement[]): ICropGroup[] {
    const groups = {};
    crops.forEach((c) => {
      if (!groups.hasOwnProperty(c.crop)) {
        groups[c.crop] = { crop: c.crop, image: c.image, varieties: [] };
      }
      groups[c.crop].varieties.push(c);
    });
    return Object.values(groups);
  }

  // sometimes either min or max is not defined, so in that case simply return
  // the min/max that is given. Otherwise simple mean average
  // private _calculateMean(min?: number, max?: number) {
  //   if (!min) {
  //     min = max as number;
  //   }
  //   if (!max) {
  //     max = min as number;
  //   }
  //   return (min + max) / 2;
  // }
}

interface ICropGroup {
  crop: string;
  image: string;
  varieties: ICropRequirement[];
}
