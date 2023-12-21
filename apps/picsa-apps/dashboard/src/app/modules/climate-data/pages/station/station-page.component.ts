import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { ClimateDataDashboardService, IStationRow } from '../../climate-data.service';

@Component({
  selector: 'dashboard-station-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './station-page.component.html',
  styleUrls: ['./station-page.component.scss'],
})
export class StationPageComponent implements OnInit {
  public station: IStationRow | undefined;

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
    this.station = this.service.stations.find((station) => station.station_id === parseInt(stationId));
    if (!this.station) {
      this.notificationService.showUserNotification({ matIcon: 'error', message: `Station data not found` });
    }
  }
}
