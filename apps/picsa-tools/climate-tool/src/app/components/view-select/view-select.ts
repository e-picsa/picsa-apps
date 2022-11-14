import { Component, Output, EventEmitter } from '@angular/core';
import * as DATA from '../../data';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss'],
})
export class ViewSelectComponent {
  @Output() viewSelected = new EventEmitter<string>();
  availableCharts = DATA.CHART_TYPES;
  availableReports = DATA.REPORT_TYPES;

  setView(viewID: string) {
    this.viewSelected.emit(viewID);
  }
}
