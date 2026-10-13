import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { IMapMarker, PicsaMapComponent } from '@picsa/shared/features/map/map';
import { evaluateStationQualityGates } from '@picsa/utils';

import { ClimateService } from '../../climate.service';
import { ApiRequest } from '../../climate-api.mapping';
import { ApiStatusComponent } from '../../components/api-status/api-status.component';
import { IStationRow } from '../../types';

export interface IStationTableRow extends IStationRow {
  map: number;
  qc_passed: boolean;
  qc_reasons: string[];
}

const displayColumns: (keyof IStationRow)[] = ['district', 'station_name'];

@Component({
  selector: 'dashboard-climate-station-page',
  imports: [
    ApiStatusComponent,
    RouterModule,
    PicsaDataTableComponent,
    PicsaMapComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateStationPageComponent {
  service = inject(ClimateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public get updateRequest(): ApiRequest<'station'> {
    return {
      endpoint: 'station',
      params: this.service.apiCountryCode,
    };
  }

  public tableOptions: IDataTableOptions = {
    displayColumns: ['map', ...displayColumns, 'qc_status'],
    formatHeader: (v) => {
      if (v === 'map') return 'Map';
      if (v === 'district') return 'District';
      if (v === 'station_name') return 'Station';
      if (v === 'qc_status') return 'QC';
      return formatHeaderDefault(v);
    },
    sort: { id: 'district', start: 'desc' },
    handleRowClick: (station: IStationRow) => this.goToStation(station),
  };

  public tableData = computed<IStationTableRow[]>(() => {
    const stations = this.service.stations();
    const qcMap = this.service.stationQcMap();
    return stations.map((station, index) => {
      const stationKey = (station.id || station.station_id) as string;
      const qc = qcMap[stationKey] || qcMap[station.station_id] || evaluateStationQualityGates([]);
      return {
        ...station,
        map: index + 1,
        qc_passed: qc.passed,
        qc_reasons: qc.reasons,
      };
    });
  });

  public mapMarkers = computed<IMapMarker[]>(() => {
    const stations = this.service.stations();
    return this.calcMapMarkers(stations);
  });

  public handleMarkerClick(marker: IMapMarker) {
    const { _index } = marker;
    const station = this.service.stations()[_index];
    this.goToStation(station);
  }

  public goToStation(station: IStationRow) {
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
