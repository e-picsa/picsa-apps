import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';

import { ClimateService } from '../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../components/api-status/api-status';
import { IStationRow } from '../../types';

const displayColumns: (keyof IStationRow)[] = ['district', 'station_name'];

@Component({
  selector: 'dashboard-climate-station-page',
  imports: [
    DashboardClimateApiStatusComponent,
    RouterModule,
    PicsaDataTableComponent,
    PicsaMapComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateStationPageComponent {
  public tableOptions: IDataTableOptions = {
    displayColumns: ['map', ...displayColumns],
    sort: { id: 'district', start: 'desc' },
    handleRowClick: (station: IStationRow) => this.goToStation(station),
  };
  public tableData = computed(() => {
    const stations = this.service.stations();
    return stations.map((station, index) => {
      return { ...station, map: index + 1 };
    });
  });

  public mapMarkers = computed<IMapMarker[]>(() => {
    const stations = this.service.stations();
    return this.calcMapMarkers(stations);
  });

  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: async () => this.service.loadFromAPI.station(this.service.apiCountryCode) },
    showStatusCode: false,
  };

  constructor(
    public service: ClimateService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public handleMarkerClick(marker: IMapMarker) {
    const { _index } = marker;
    const station = this.service.stations()[_index];
    this.goToStation(station);
  }

  private goToStation(station: IStationRow) {
    this.router.navigate(['./', station.station_id], { relativeTo: this.route });
  }

  private calcMapMarkers(stations: IStationRow[]): IMapMarker[] {
    return stations
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((s, _index) => ({
        _index,
        latlng: [s.latitude as number, s.longitude as number],
        number: _index + 1,
      }));
  }
}
