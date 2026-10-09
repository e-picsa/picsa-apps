import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmapArray } from '@picsa/utils';

import { CropInformationService, ICropDataDownscaledWaterRequirements } from '../../../../services';

interface IStationCropStatus {
  station_id: string;
  station_name: string;
  district: string;
  probability_count: number;
  locations_with_water_requirements: number;
  locations: string;
  status: string;
}

const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  OK: { icon: 'check_circle', color: 'text-green-600' },
  'Missing Downscaled Record': { icon: 'cancel', color: 'text-red-600' },
  'Empty Water Requirements': { icon: 'warning', color: 'text-orange-600' },
};

@Component({
  selector: 'dashboard-crop-missing-station-info',
  imports: [MatIconModule, MatTooltipModule, PicsaDataTableComponent],
  templateUrl: './missing-station-info.component.html',
  styleUrl: './missing-station-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Lists climate stations that have crop probability data in climate_station_data
 * but lack corresponding water requirement definitions in crop_data_downscaled.
 *
 * A station is linked to downscaled rows via station_id (which references
 * climate_stations.id). As one station can serve multiple locations, all
 * downscaled rows sharing the station_id are aggregated: a station counts as
 * covered when at least one linked row defines non-empty water_requirements.
 */
export class CropMissingStationInfoComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate') private statusTemplate!: TemplateRef<{ $implicit: unknown; row: IStationCropStatus }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: IStationCropStatus }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = { status: this.statusTemplate };
    this.cdr.markForCheck();
  }

  public statusDisplay = STATUS_DISPLAY;

  /** Stations with crop probability data in climate_station_data */
  private stationsWithProbability = computed(() =>
    this.service
      .stationData()
      .filter(
        (s) => s.crop_probability_data && Array.isArray(s.crop_probability_data) && s.crop_probability_data.length > 0,
      ),
  );

  /** Downscaled rows grouped by station_id (one station can serve multiple locations) */
  private downscaledByStation = computed(() => arrayToHashmapArray(this.service.downscaledData(), 'station_id'));

  /** Combined status for each station with probability data */
  public stationStatuses = computed<IStationCropStatus[]>(() => {
    const stations = this.stationsWithProbability();
    const downscaledGroups = this.downscaledByStation();

    return stations
      .map((station) => {
        const stationId = station.station_id;
        const rows = downscaledGroups[stationId] ?? [];
        const rowsWithRequirements = rows.filter(
          (row) => Object.keys((row.water_requirements as ICropDataDownscaledWaterRequirements) ?? {}).length > 0,
        );
        const locations = [...new Set(rowsWithRequirements.map((row) => row.location_id))].sort((a, b) =>
          a.localeCompare(b),
        );

        return {
          station_id: stationId,
          station_name: station.station?.station_name || stationId,
          district: station.station?.district || 'Unknown',
          probability_count: station.crop_probability_data?.length ?? 0,
          locations_with_water_requirements: locations.length,
          locations: locations.join(', '),
          status:
            rows.length === 0
              ? 'Missing Downscaled Record'
              : locations.length === 0
                ? 'Empty Water Requirements'
                : 'OK',
        };
      })
      .sort((a, b) => a.station_name.localeCompare(b.station_name));
  });

  /** Stations needing attention (no downscaled record or only empty water requirements) */
  public problemStations = computed(() => this.stationStatuses().filter((s) => s.status !== 'OK'));

  /** Summary stats */
  public stats = computed(() => {
    const all = this.stationStatuses();
    return {
      total: all.length,
      ok: all.filter((s) => s.status === 'OK').length,
      missing: all.filter((s) => s.status === 'Missing Downscaled Record').length,
      empty: all.filter((s) => s.status === 'Empty Water Requirements').length,
      problems: all.filter((s) => s.status !== 'OK').length,
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: [
      'station_name',
      'district',
      'probability_count',
      'status',
      'locations_with_water_requirements',
      'locations',
      'station_id',
    ],
    paginatorSizes: [10, 25, 50, 100],
    search: true,
    sort: { id: 'status', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        station_id: 'Station ID',
        station_name: 'Station Name',
        district: 'District',
        probability_count: 'Probability Records',
        locations_with_water_requirements: 'Locations Covered',
        locations: 'Covered Location IDs',
        status: 'Status',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'stations-missing-crop-info.csv',
  };
}
