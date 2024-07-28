import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ClimateService } from '../../climate.service';
import { RainfallSummaryComponent } from './components/rainfall-summary/rainfall-summary';

@Component({
  selector: 'dashboard-station-details',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, RainfallSummaryComponent],
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss'],
})
export class StationDetailsPageComponent implements OnInit {
  public get station() {
    return this.service.activeStation;
  }

  public get stationSummary() {
    const entries = Object.entries(this.station || {}).filter(([key]) => !['id', 'country_code'].includes(key));
    return {
      keys: entries.map(([key]) => key),
      values: entries.map(([, value]) => value),
    };
  }

  constructor(private service: ClimateService) {}

  async ngOnInit() {
    await this.service.ready();
  }
}
