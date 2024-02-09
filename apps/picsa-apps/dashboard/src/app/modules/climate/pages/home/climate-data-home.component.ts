import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateDataDashboardService, IStationRow } from '../../climate-data.service';
import { ClimateDataApiService } from '../../climate-data-api.service';

@Component({
  selector: 'dashboard-climate-data-home',
  standalone: true,
  imports: [CommonModule, MatTableModule, RouterModule, PicsaMapComponent, MatProgressSpinnerModule],
  templateUrl: './climate-data-home.component.html',
  styleUrls: ['./climate-data-home.component.scss'],
})
export class ClimateDataHomeComponent implements OnInit {
  public displayedColumns: (keyof IStationRow)[] = ['station_id', 'station_name'];

  public mapMarkers: IMapMarker[];

  constructor(public service: ClimateDataDashboardService, public api: ClimateDataApiService) {}

  async ngOnInit() {
    await this.service.ready();
    this.mapMarkers = this.service.stations.map((m) => ({
      latlng: [m.latitude as number, m.longitude as number],
      number: m.station_id,
    }));
  }
}