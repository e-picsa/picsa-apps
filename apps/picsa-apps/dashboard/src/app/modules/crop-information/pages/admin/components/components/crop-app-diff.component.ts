import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
// eslint-disable-next-line @nx/enforce-module-boundaries
import MW_CROP_DATA from '@picsa/crop-probability/src/app/data/mw/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import ZM_CROP_DATA from '@picsa/crop-probability/src/app/data/zm/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import ZW_CROP_DATA from '@picsa/crop-probability/src/app/data/zw/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IProbabilityTable, IStationCropData } from '@picsa/crop-probability/src/app/models';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';

import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../../../../climate/types';
import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import {
  CropInformationService,
  ICropData,
  ICropDataDownscaled,
  ICropDataDownscaledWaterRequirements,
  IStationDataWithMeta,
} from '../../../../services';
import { computeExpectedProbabilityTable } from '../../../../utils/probability.utils';
import {
  deepEqualJson,
  findDifferingCrops,
  locationIdFromAppId,
  summarizeProbabilityTable,
} from './crop-app-diff.utils';

export interface IAppDbDiffRow {
  location_id: string;
  location_label: string;
  app_station_label: string;
  db_station: string;
  app_varieties: number;
  db_varieties: number;
  status: string;
  detail: string;
}

const STATUS_SEVERITY: Record<string, number> = {
  Differs: 0,
  'Missing in App': 1,
  'Orphaned in App': 2,
  'No Source Data': 3,
  'In Sync': 4,
};

const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  'In Sync': { icon: 'check_circle', color: 'text-green-600' },
  Differs: { icon: 'error', color: 'text-red-600' },
  'Missing in App': { icon: 'sync', color: 'text-orange-600' },
  'Orphaned in App': { icon: 'link_off', color: 'text-purple-600' },
  'No Source Data': { icon: 'cloud_off', color: 'text-gray-600' },
};

/**
 * Statically imported country indexes (dynamic import cannot resolve through
 * the tsconfig path alias at runtime). Location JSONs stay lazy-loaded via
 * each entry's `data()` loader. Add new countries here when app data exists.
 */
const APP_INDEX_BY_COUNTRY: Record<string, IProbabilityTable[]> = {
  mw: MW_CROP_DATA,
  zm: ZM_CROP_DATA,
  zw: ZW_CROP_DATA,
};

@Component({
  selector: 'dashboard-crop-app-diff',
  imports: [MatIconModule, MatTooltipModule, PicsaDataTableComponent],
  templateUrl: './crop-app-diff.component.html',
  styleUrl: './crop-app-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Compares committed app probability tables against tables regenerated from
 * live data-system records, answering: what is in the app, and is it up to date?
 *
 * App tables ship with the crop tool release, so this view loads the checked-in
 * data index plus each location JSON and diffs them against the shared
 * generation pipeline fed by current database rows.
 */
export class CropAppDiffComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate') private statusTemplate!: TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = { status: this.statusTemplate };
    this.cdr.markForCheck();
  }

  public statusDisplay = STATUS_DISPLAY;

  public loading = signal(true);
  public loadError = signal<string | null>(null);

  /** App data index entries for the active country */
  private appIndex = signal<IProbabilityTable[]>([]);
  /** Loaded app table JSON keyed by app entry id */
  private appTables = signal<Record<string, IStationCropData[] | null>>({});

  constructor() {
    effect(() => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) this.loadAppTables(countryCode);
    });
  }

  private loadRun = 0;

  private async loadAppTables(countryCode: string) {
    const run = ++this.loadRun;
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const tables = APP_INDEX_BY_COUNTRY[countryCode.toLowerCase()] ?? [];
      if (run !== this.loadRun) return;
      if (tables.length === 0) {
        this.appIndex.set([]);
        this.appTables.set({});
        this.loadError.set(`No app probability tables found for country ${countryCode}`);
        return;
      }
      this.appIndex.set(tables);
      const loaded = await Promise.all(
        tables.map(async (entry) => {
          try {
            return [entry.id, await entry.data()] as const;
          } catch {
            return [entry.id, null] as const;
          }
        }),
      );
      if (run !== this.loadRun) return;
      const tablesById: Record<string, IStationCropData[] | null> = {};
      for (const [id, table] of loaded) tablesById[id] = table;
      this.appTables.set(tablesById);
    } catch {
      if (run !== this.loadRun) return;
      this.appIndex.set([]);
      this.appTables.set({});
      this.loadError.set(`No app probability tables found for country ${countryCode}`);
    } finally {
      if (run === this.loadRun) this.loading.set(false);
    }
  }

  public diffRows = computed<IAppDbDiffRow[]>(() => {
    const cropDataHashmap = arrayToHashmap(this.service.cropData(), 'id', (v) => `${v.crop}/${v.variety}`);
    const stationHashmap = arrayToHashmap(this.service.stationData(), 'station_id');
    const downscaledByLocation = arrayToHashmap(this.service.downscaledData(), 'location_id');
    const tables = this.appIndex();
    const loadedTables = this.appTables();
    const labels = this.locationLabels();
    const rows: IAppDbDiffRow[] = [];
    const seen = new Set<string>();

    // App entries: in sync / differs / orphaned in app
    for (const entry of tables) {
      const locationId = locationIdFromAppId(entry.id);
      seen.add(locationId);
      const appTable = loadedTables[entry.id] ?? null;
      const appSummary = summarizeProbabilityTable(appTable);
      const expected = this.expectedTableForLocation(locationId, downscaledByLocation, stationHashmap, cropDataHashmap);

      if (!expected) {
        const dbRow = downscaledByLocation[locationId];
        rows.push({
          location_id: locationId,
          location_label: entry.label,
          app_station_label: entry.station_label,
          db_station: dbRow?.station_id ? this.stationDisplayName(dbRow.station_id, stationHashmap) : '',
          app_varieties: appSummary.varieties,
          db_varieties: 0,
          status: 'Orphaned in App',
          detail: this.describeMissingSource(dbRow ?? null, stationHashmap),
        });
        continue;
      }
      const dbSummary = summarizeProbabilityTable(expected.table);
      const dbStation = this.stationDisplayName(expected.station.station_id, stationHashmap);
      if (!appTable) {
        rows.push({
          location_id: locationId,
          location_label: entry.label,
          app_station_label: entry.station_label,
          db_station: dbStation,
          app_varieties: 0,
          db_varieties: dbSummary.varieties,
          status: 'Differs',
          detail: 'App table failed to load, cannot compare',
        });
        continue;
      }
      if (deepEqualJson(appTable, expected.table)) {
        rows.push({
          location_id: locationId,
          location_label: entry.label,
          app_station_label: entry.station_label,
          db_station: dbStation,
          app_varieties: appSummary.varieties,
          db_varieties: dbSummary.varieties,
          status: 'In Sync',
          detail: '',
        });
      } else {
        const differing = findDifferingCrops(appTable, expected.table);
        rows.push({
          location_id: locationId,
          location_label: entry.label,
          app_station_label: entry.station_label,
          db_station: dbStation,
          app_varieties: appSummary.varieties,
          db_varieties: dbSummary.varieties,
          status: 'Differs',
          detail: `Crops differ: ${differing.join(', ')}`,
        });
      }
    }

    // Db rows with no app entry: missing in app, or no usable source data
    for (const row of this.service.downscaledData()) {
      if (seen.has(row.location_id)) continue;
      seen.add(row.location_id);
      const waterRequirements = row.water_requirements as ICropDataDownscaledWaterRequirements;
      if (Object.keys(waterRequirements ?? {}).length === 0) continue;
      const expected = this.expectedTableForLocation(
        row.location_id,
        downscaledByLocation,
        stationHashmap,
        cropDataHashmap,
      );
      if (expected) {
        rows.push({
          location_id: row.location_id,
          location_label: labels[row.location_id] ?? row.location_id,
          app_station_label: '',
          db_station: this.stationDisplayName(expected.station.station_id, stationHashmap),
          app_varieties: 0,
          db_varieties: summarizeProbabilityTable(expected.table).varieties,
          status: 'Missing in App',
          detail: `Usable data-system record has no app table (station ${expected.station.station_id})`,
        });
      } else {
        rows.push({
          location_id: row.location_id,
          location_label: labels[row.location_id] ?? row.location_id,
          app_station_label: '',
          db_station: row.station_id ?? '',
          app_varieties: 0,
          db_varieties: 0,
          status: 'No Source Data',
          detail: this.describeMissingSource(row, stationHashmap),
        });
      }
    }

    return rows.sort((a, b) => (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99));
  });

  public stats = computed(() => {
    const rows = this.diffRows();
    const count = (status: string) => rows.filter((row) => row.status === status).length;
    return {
      total: rows.length,
      inSync: count('In Sync'),
      differs: count('Differs'),
      missing: count('Missing in App'),
      orphaned: count('Orphaned in App'),
      noSource: count('No Source Data'),
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: [
      'location_label',
      'location_id',
      'status',
      'app_varieties',
      'db_varieties',
      'app_station_label',
      'db_station',
      'detail',
    ],
    paginatorSizes: [10, 25, 50, 100],
    search: true,
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        location_label: 'Location',
        location_id: 'Location ID',
        status: 'App vs DB Status',
        app_varieties: 'App Varieties',
        db_varieties: 'DB Varieties',
        app_station_label: 'App Station',
        db_station: 'DB Station',
        detail: 'Detail',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'crop-app-vs-db.csv',
  };

  /**
   * Regenerate the app table a location should currently have, or null when
   * the data-system records are insufficient (mirrors the export pipeline).
   */
  private expectedTableForLocation(
    locationId: string,
    downscaledByLocation: Record<string, ICropDataDownscaled['Row']>,
    stationHashmap: Record<string, IStationDataWithMeta>,
    cropDataHashmap: Record<string, ICropData['Row']>,
  ): { table: IStationCropData[]; station: IStationDataWithMeta } | null {
    const row = downscaledByLocation[locationId];
    if (!row?.station_id) return null;
    const waterRequirements = row.water_requirements as ICropDataDownscaledWaterRequirements;
    if (Object.keys(waterRequirements ?? {}).length === 0) return null;
    const station = stationHashmap[row.station_id];
    if (!station) return null;
    const result = computeExpectedProbabilityTable({
      cropDataHashmap,
      waterRequirements,
      rainfallData: station.annual_rainfall_data as unknown as IAnnualRainfallSummariesData[],
      cropProbabilityData: station.crop_probability_data as unknown as ICropSuccessEntry[],
    });
    if (!result) return null;
    return { table: result.table, station };
  }

  private locationLabels = computed(() => {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    const locations = locationData.admin_5?.locations ?? locationData.admin_4?.locations ?? [];
    const labels: Record<string, string> = {};
    for (const location of locations) labels[location.id] = location.label;
    return labels;
  });

  private stationDisplayName(stationId: string, stationHashmap: Record<string, IStationDataWithMeta>): string {
    const station = stationHashmap[stationId];
    return station?.station?.station_name || stationId;
  }

  /** Explain why a location has no usable data-system row */
  private describeMissingSource(
    row: ICropDataDownscaled['Row'] | null,
    stationHashmap: Record<string, IStationDataWithMeta>,
  ): string {
    if (!row) return 'No data-system record for this location';
    if (!row.station_id) return 'Data-system record has no linked station';
    if (Object.keys((row.water_requirements as ICropDataDownscaledWaterRequirements) ?? {}).length === 0) {
      return 'Data-system record has empty water requirements';
    }
    const station = stationHashmap[row.station_id];
    if (!station) return `No station climate data for ${row.station_id}`;
    return `Station ${row.station_id} lacks rainfall or crop probability data`;
  }
}
