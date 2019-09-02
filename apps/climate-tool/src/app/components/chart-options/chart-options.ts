import { Component, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef
} from '@angular/material/bottom-sheet';
import { IChartMeta } from '@picsa/models';

@Component({
  selector: 'climate-chart-options',
  templateUrl: 'chart-options.html',
  styleUrls: ['chart-options.scss']
})
export class ChartOptionsComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public chartMeta: IChartMeta,
    private sheetRef: MatBottomSheetRef<ChartOptionsComponent>
  ) {
    console.log('data', this.chartMeta);
  }
  dismiss(action: string) {
    this.sheetRef.dismiss({
      chartMeta: this.chartMeta,
      action: action
    });
  }
}
