import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute } from '@angular/router';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

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

  constructor(
    private service: ClimateDataDashboardService,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { stationId } = this.route.snapshot.params;
    const station = this.service.stations.find((station) => station.station_id === parseInt(stationId));
    if (station) {
      this.service.setActiveStation(station);
    } else {
      this.notificationService.showUserNotification({ matIcon: 'error', message: `Station data not found` });
    }
  }
}
