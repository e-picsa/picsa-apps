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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getDeepestLocations } from '@picsa/data/geoLocation';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaledWaterRequirements } from '../../../../services';
import { buildLocationCoverageRows, ICoverageRow } from './location-coverage.utils';
import { IPairingRow } from './station-pairing.utils';

const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  Missing: { icon: 'error', color: 'text-red-600' },
  Empty: { icon: 'warning', color: 'text-orange-600' },
  Paired: { icon: 'group', color: 'text-blue-600' },
  Unique: { icon: 'check_circle', color: 'text-green-600' },
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
 * definitions with other locations.
 */
export class CropLocationCoverageComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate') private statusTemplate!: TemplateRef<{ $implicit: unknown; row: ICoverageRow }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: ICoverageRow }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = { status: this.statusTemplate };
    this.cdr.markForCheck();
  }

  public statusDisplay = STATUS_DISPLAY;
  public addingPlaceholders = signal(false);

  public rows = computed<ICoverageRow[]>(() => {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    const geoLocations = getDeepestLocations(locationData).map(({ id, label }) => ({ id, label }));
    const stationHashmap = arrayToHashmap(this.service.stationData(), 'station_id');
    const dbRows: IPairingRow[] = this.service.downscaledData().map((row) => ({
      location_id: row.location_id,
      station_name: row.station_id
        ? stationHashmap[row.station_id]?.station?.station_name || row.station_id
        : 'No linked station',
      water_requirements: (row.water_requirements as ICropDataDownscaledWaterRequirements) ?? {},
    }));
    return buildLocationCoverageRows({ geoLocations, dbRows });
  });

  public missingIds = computed(() =>
    this.rows()
      .filter((row) => row.status === 'Missing')
      .map((row) => row.location_id),
  );

  public stats = computed(() => {
    const rows = this.rows();
    const count = (status: ICoverageRow['status']) => rows.filter((row) => row.status === status).length;
    return {
      total: rows.length,
      missing: count('Missing'),
      empty: count('Empty'),
      paired: count('Paired'),
      unique: count('Unique'),
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['location_label', 'location_id', 'status', 'paired_with', 'station', 'crops'],
    paginatorSizes: [10, 25, 50, 100],
    search: true,
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        location_label: 'Location',
        location_id: 'Location ID',
        status: 'Status',
        paired_with: 'Paired With',
        station: 'Linked Station',
        crops: 'Crops Covered',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'crop-location-coverage.csv',
  };

  public async addPlaceholderEntries() {
    const locationIds = this.missingIds();
    if (locationIds.length === 0) return;
    this.addingPlaceholders.set(true);
    try {
      await this.service.addPlaceholderLocations(locationIds);
    } finally {
      this.addingPlaceholders.set(false);
    }
  }
}
