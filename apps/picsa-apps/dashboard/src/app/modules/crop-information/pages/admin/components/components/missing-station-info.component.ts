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
import { arrayToHashmap } from '@picsa/utils';

import { CropInformationService } from '../../../../services';

interface IStationProbabilityStatus {
  station_name: string;
  district: string;
  has_probabilities: boolean;
  probabilities_detail: string;
  data_updated: string;
}

@Component({
  selector: 'dashboard-crop-missing-station-info',
  imports: [MatIconModule, MatTooltipModule, PicsaDataTableComponent],
  templateUrl: './missing-station-info.component.html',
  styleUrl: './missing-station-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Tracks which deployment stations have crop probability data available.
 * A station is in good order when its climate_station_data record holds
 * probability data; linkage to locations is covered by the Locations tab.
 */
export class CropMissingStationInfoComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('probabilitiesTemplate')
  private probabilitiesTemplate!: TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = { has_probabilities: this.probabilitiesTemplate };
    this.cdr.markForCheck();
  }

  /** One row per deployment station with probability data availability */
  public stationStatuses = computed<IStationProbabilityStatus[]>(() => {
    const stationDataHashmap = arrayToHashmap(this.service.stationData(), 'station_id');

    return this.service
      .stations()
      .map((station) => {
        const stationId = station.id || station.station_id;
        const stationData = stationId ? stationDataHashmap[stationId] : undefined;
        const probabilities =
          stationData?.crop_probability_data && Array.isArray(stationData.crop_probability_data)
            ? stationData.crop_probability_data
            : [];
        const has_probabilities = probabilities.length > 0;
        const updated = (stationData?.updated_at || '').slice(0, 10);

        return {
          station_name: station.station_name || station.station_id,
          district: station.district || 'Unknown',
          has_probabilities,
          probabilities_detail: has_probabilities
            ? `Crop probability data available (updated ${updated || 'unknown date'})`
            : stationData
              ? 'Station record exists but holds no probability data'
              : 'No station data record available',
          data_updated: has_probabilities ? updated : '',
        };
      })
      .sort((a, b) => a.station_name.localeCompare(b.station_name));
  });

  /** Summary stats */
  public stats = computed(() => {
    const all = this.stationStatuses();
    return {
      total: all.length,
      withData: all.filter((s) => s.has_probabilities).length,
      withoutData: all.filter((s) => !s.has_probabilities).length,
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['station_name', 'district', 'has_probabilities', 'data_updated'],
    paginatorSizes: [50, 100],
    search: true,
    sort: { id: 'station_name', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        station_name: 'Station Name',
        district: 'District',
        has_probabilities: 'Probabilities',
        data_updated: 'Data Updated',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'stations-crop-probability-data.csv',
  };
}
