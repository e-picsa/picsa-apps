import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateService } from '../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../components/api-status/api-status';
import { IStationRow } from '../../types';

@Component({
  selector: 'dashboard-climate-station-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardClimateApiStatusComponent,
    MatTableModule,
    RouterModule,
    PicsaMapComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss'],
})
export class ClimateStationPageComponent implements OnInit {
  public displayedColumns: (keyof IStationRow)[] = ['station_id', 'station_name'];

  public mapMarkers: IMapMarker[];

  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.service.loadFromAPI.station() },
    showStatusCode: false,
  };

  constructor(public service: ClimateService) {}

  async ngOnInit() {
    await this.service.ready();
    this.mapMarkers = this.service.stations.map((m) => ({
      latlng: [m.latitude as number, m.longitude as number],
      number: parseInt(m.station_id),
    }));
  }
}
