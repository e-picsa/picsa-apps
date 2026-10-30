import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getDeepestLocations } from '@picsa/data/geoLocation';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaledWaterRequirements } from '../../../../services';
import { buildLocationCoverageRows, ICoverageRow } from './location-coverage.utils';
import { CropSetStationDialogComponent } from './set-station-dialog.component';
import { IPairingRow } from './station-pairing.utils';

const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  'No Requirements': { icon: 'error', color: 'text-red-600' },
  Paired: { icon: 'group', color: 'text-blue-600' },
  Unique: { icon: 'check_circle', color: 'text-green-600' },
};

const PROBABILITY_DISPLAY: Record<string, { icon: string; color: string; label: string }> = {
  Available: { icon: 'check_circle', color: 'text-green-600', label: 'Probabilities available' },
  'No Probabilities': { icon: 'warning', color: 'text-amber-500', label: 'No probabilities available' },
  'No Station': { icon: 'link_off', color: 'text-gray-400', label: 'No linked station' },
};

@Component({
  selector: 'dashboard-crop-location-coverage',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, PicsaDataTableComponent],
  templateUrl: './location-coverage.component.html',
  styleUrl: './location-coverage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Per-district coverage of downscaled water requirements: districts without
 * records, records without requirements, and records sharing byte-identical
 * definitions with other locations. Tracks whether linked climate stations have
 * crop probability data available in the data system.
 */
export class CropLocationCoverageComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private notificationService = inject(PicsaNotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate') private statusTemplate!: TemplateRef<{ $implicit: unknown; row: ICoverageRow }>;
  @ViewChild('stationTemplate') private stationTemplate!: TemplateRef<{ $implicit: unknown; row: ICoverageRow }>;
  @ViewChild('probabilitiesTemplate') private probabilitiesTemplate!: TemplateRef<{
    $implicit: unknown;
    row: ICoverageRow;
  }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: ICoverageRow }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = {
      status: this.statusTemplate,
      station: this.stationTemplate,
      probabilities: this.probabilitiesTemplate,
    };
    this.cdr.markForCheck();
  }

  public statusDisplay = STATUS_DISPLAY;
  public probabilityDisplay = PROBABILITY_DISPLAY;
  public creatingRecord = signal(false);

  public rows = computed<ICoverageRow[]>(() => {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    const geoLocations = getDeepestLocations(locationData).map(({ id, label, parentLabel }) => ({
      id,
      label,
      parent: parentLabel,
    }));
    const stationDataHashmap = arrayToHashmap(this.service.stationData(), 'station_id');
    const stationsHashmap = arrayToHashmap(this.service.stations(), 'id');

    const dbRows: IPairingRow[] = this.service.downscaledData().map((row) => {
      const stationRecord = row.station_id ? stationDataHashmap[row.station_id] : null;
      const stationMeta = row.station_id ? stationRecord?.station || stationsHashmap[row.station_id] : null;
      const station_name = row.station_id ? stationMeta?.station_name || row.station_id : 'No linked station';
      const probData = stationRecord?.crop_probability_data;
      const probability_count = Array.isArray(probData) ? probData.length : 0;
      const has_probabilities = probability_count > 0;

      return {
        location_id: row.location_id,
        station_id: row.station_id,
        station_name,
        has_probabilities,
        probability_count,
        water_requirements: (row.water_requirements as ICropDataDownscaledWaterRequirements) ?? {},
      };
    });
    return buildLocationCoverageRows({ geoLocations, dbRows });
  });

  public stats = computed(() => {
    const rows = this.rows();
    const count = (status: ICoverageRow['status']) => rows.filter((row) => row.status === status).length;
    const probCount = (p: ICoverageRow['probabilities']) => rows.filter((row) => row.probabilities === p).length;
    return {
      total: rows.length,
      noRequirements: count('No Requirements'),
      paired: count('Paired'),
      unique: count('Unique'),
      probAvailable: probCount('Available'),
      probMissing: probCount('No Probabilities'),
      probNoStation: probCount('No Station'),
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['location_label', 'parent_location', 'status', 'paired_with', 'station', 'probabilities', 'crops'],
    paginatorSizes: [50, 100],
    search: true,
    sort: { id: 'location_label', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        location_label: 'Location',
        parent_location: 'Parent',
        status: 'Status',
        paired_with: 'Paired With',
        station: 'Linked Station',
        probabilities: 'Probabilities',
        crops: 'Crops Covered',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'crop-location-coverage.csv',
  };

  /**
   * Open the station picker for a location, creating an empty record first
   * when none exists so a station can be linked straight away.
   */
  public async openSetStationDialog(row: ICoverageRow) {
    if (this.creatingRecord()) return;
    this.creatingRecord.set(true);
    try {
      let downscaledRow = arrayToHashmap(this.service.downscaledData(), 'location_id')[row.location_id];
      if (!downscaledRow) {
        await this.service.addPlaceholderLocations([row.location_id]);
        downscaledRow = arrayToHashmap(this.service.downscaledData(), 'location_id')[row.location_id];
        if (!downscaledRow) {
          this.notificationService.showErrorNotification('Failed to create record for this location');
          return;
        }
      }
      this.dialog.open(CropSetStationDialogComponent, {
        data: { locationId: row.location_id, downscaledRow },
        width: '1100px',
        maxWidth: '95vw',
      });
    } finally {
      this.creatingRecord.set(false);
    }
  }
}
