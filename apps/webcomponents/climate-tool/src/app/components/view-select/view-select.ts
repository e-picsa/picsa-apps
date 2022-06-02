import { Component, Output, EventEmitter } from '@angular/core';
import * as DATA from '@picsa/climate/src/app/data';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss']
})
export class ViewSelectComponent {
  @Output() onViewSelected = new EventEmitter<string>();
  availableCharts = DATA.CHART_TYPES;
  availableReports = DATA.REPORT_TYPES;
  constructor() {}

  setView(viewID: string) {
    this.onViewSelected.emit(viewID);
  }
}
