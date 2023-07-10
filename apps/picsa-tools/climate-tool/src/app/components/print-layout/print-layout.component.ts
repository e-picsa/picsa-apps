import { Component, Input } from '@angular/core';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-print-layout',
  templateUrl: './print-layout.component.html',
  styleUrls: ['./print-layout.component.scss'],
})
export class ClimatePrintLayoutComponent {
  public stationName: string;
  public chartName: string;
  public chartDefinition: string;

  public chartPng?: string;

  constructor(private chartService: ClimateChartService) {}

  ngOnInit(): void {
    const { chartPng, station } = this.chartService;
    if (station) {
      this.stationName = station.name;
      this.chartPng = chartPng;
      this.chartDefinition = this.chartService.chartDefinition?.definition || '';
      this.chartName = this.chartService.chartDefinition?.name || '';
    }
  }
}
