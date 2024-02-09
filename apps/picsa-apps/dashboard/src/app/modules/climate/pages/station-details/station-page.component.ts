import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ClimateService } from '../../climate.service';
import { RainfallSummaryComponent } from './components/rainfall-summary/rainfall-summary';

@Component({
  selector: 'dashboard-station-page',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, RainfallSummaryComponent],
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

  constructor(private service: ClimateService) {}

  async ngOnInit() {
    await this.service.ready();
  }
}
