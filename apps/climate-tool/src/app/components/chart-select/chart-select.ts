import { Component, OnInit } from '@angular/core';
import { CHART_TYPES } from 'src/app/data';

@Component({
  selector: 'climate-chart-select',
  templateUrl: './chart-select.html',
  styleUrls: ['./chart-select.scss']
})
export class ChartSelectComponent implements OnInit {
  availableCharts = CHART_TYPES;
  constructor() {}

  ngOnInit(): void {}
}
