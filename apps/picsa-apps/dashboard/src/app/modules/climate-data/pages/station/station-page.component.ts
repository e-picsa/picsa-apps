import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';

import { ClimateDataDashboardService } from '../../climate-data.service';
import { RainfallSummaryComponent } from './components/rainfall-summary/rainfall-summary';

@Component({
  selector: 'dashboard-station-page',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, RainfallSummaryComponent, PicsaLoadingComponent],
  templateUrl: './station-page.component.html',
  styleUrls: ['./station-page.component.scss'],
})
export class StationPageComponent implements OnInit {
  public get station() {
    return this.service.activeStation;
  }

  public get stationSummary() {
    return {
      keys: Object.keys(this.station || {}),
      values: Object.values(this.station || {}),
    };
  }

  constructor(private service: ClimateDataDashboardService) {}

  async ngOnInit() {
    await this.service.ready();
  }
}
