import { CommonModule } from '@angular/common';
import { Component, computed, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

  public mapMarkers = computed<IMapMarker[]>(() => {
    const stations = this.service.stations();
    return this.calcMapMarkers(stations);
  });

  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.service.loadFromAPI.station(this.service.apiCountryCode) },
    showStatusCode: false,
  };

  constructor(public service: ClimateService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit() {
    await this.service.ready();
  }

  public handleMarkerClick(marker: IMapMarker) {
    const { _index } = marker;
    const station = this.service.stations()[_index];
    this.router.navigate(['./', station.station_id], { relativeTo: this.route });
  }

  private calcMapMarkers(stations: IStationRow[]): IMapMarker[] {
    return stations.map((s, _index) => ({
      _index,
      latlng: [s.latitude as number, s.longitude as number],
      number: parseInt(s.station_id),
    }));
  }
}
