import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CHART_TYPES } from 'src/app/data';
import { IChartMeta } from '@picsa/models';

@Component({
  selector: 'climate-chart-select',
  templateUrl: './chart-select.html',
  styleUrls: ['./chart-select.scss']
})
export class ChartSelectComponent implements OnInit {
  @Output() onChartSet = new EventEmitter<IChartMeta>();
  availableCharts = CHART_TYPES;
  constructor() {}

  ngOnInit(): void {
    console.log('available charts', CHART_TYPES);
  }

  setChart(chart: IChartMeta) {
    console.log('chart set', chart);
    this.onChartSet.emit(chart);
  }
}
