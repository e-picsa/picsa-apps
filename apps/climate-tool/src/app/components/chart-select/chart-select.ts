import { Component, Output, EventEmitter } from '@angular/core';
import * as DATA from 'src/app/data';
import { IChartMeta } from '@picsa/models';

@Component({
  selector: 'climate-chart-select',
  templateUrl: './chart-select.html',
  styleUrls: ['./chart-select.scss']
})
export class ChartSelectComponent {
  @Output() onChartSelected = new EventEmitter<IChartMeta>();
  availableCharts = DATA.CHART_TYPES;
  availableReports = DATA.REPORT_TYPES;
  constructor() {}

  setChart(chart: IChartMeta) {
    this.onChartSelected.emit(chart);
  }
}
