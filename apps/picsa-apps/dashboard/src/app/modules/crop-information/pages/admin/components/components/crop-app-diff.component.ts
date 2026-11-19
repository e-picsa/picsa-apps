import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { CropProbabilityTableComponent as CropProbabilityTableFrontend } from '@picsa/crop-probability/src/app/components/crop-probability-table/crop-probability-table.component';
// eslint-disable-next-line @nx/enforce-module-boundaries
import MW_CROP_DATA from '@picsa/crop-probability/src/app/data/mw/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import ZM_CROP_DATA from '@picsa/crop-probability/src/app/data/zm/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import ZW_CROP_DATA from '@picsa/crop-probability/src/app/data/zw/index';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type {
  IProbabilityTable,
  IProbabilityTableMeta,
  IStationCropData,
} from '@picsa/crop-probability/src/app/models';
import { getDeepestLocations } from '@picsa/data/geoLocation';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../../../material.module';
import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../../../../climate/types';
import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import {
  CropInformationService,
  ICropData,
  ICropDataDownscaled,
  ICropDataDownscaledWaterRequirements,
  IStationDataWithMeta,
} from '../../../../services';
import {
  ENFORCE_LOOKUP_BOUNDS,
  type ICropVarietyQcResult,
  type ILocationCropQcSummary,
} from '../../../../utils/crop-qc.utils';
import {
  computeExpectedProbabilityTable,
  type ISeasonStartProbability,
  roundToNearest,
} from '../../../../utils/probability.utils';
import {
  buildCombinedDiffTable,
  calcProbabilityChangePct,
  deepEqualJson,
  findDifferingCrops,
  locationIdFromAppId,
  summarizeProbabilityTable,
} from './crop-app-diff.utils';

export type AppDbDiffStatus =
  | 'New Exclusions'
  | 'Differs'
  | 'Missing in App'
  | 'Orphaned in App'
  | 'No Source Data'
  | 'In Sync';

export type AppDiffFilter = 'all' | AppDbDiffStatus;

export interface IAppDbDiffDialogData {
  diffTable: IStationCropData[];
  diffTableMeta: IProbabilityTableMeta;
  cellDiffs: Record<string, Partial<Record<string, string>>>;
  qc: ILocationCropQcSummary | null;
  qcIssues: ICropVarietyQcResult[];
}

export interface IAppDbDiffRow {
  location_id: string;
  location_label: string;
  station: string;
  station_changed: boolean;
  app_varieties: number;
  db_varieties: number;
  excluded_count: number;
  prob_change_pct: number | null;
  status: AppDbDiffStatus;
  detail: string;
  _dialogData?: IAppDbDiffDialogData;
}

const STATUS_SEVERITY: Record<string, number> = {
  Differs: 0,
  'New Exclusions': 1,
  'Missing in App': 2,
  'Orphaned in App': 3,
  'No Source Data': 4,
  'In Sync': 5,
};

/** Lookup maps shared by the diff row builders */
interface IDiffRowContext {
  cropDataHashmap: Record<string, ICropData['Row']>;
  stationHashmap: Record<string, IStationDataWithMeta>;
  downscaledByLocation: Record<string, ICropDataDownscaled['Row']>;
  loadedTables: Record<string, IStationCropData[] | null>;
  labels: Record<string, string>;
  applyBounds: boolean;
}

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
  imports: [CropProbabilityTableFrontend, DashboardMaterialModule, MatSlideToggleModule, PicsaDataTableComponent],
  templateUrl: './crop-app-diff.component.html',
  styleUrl: './crop-app-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Compares committed app probability tables against tables regenerated from
 * live data-system records, with status chip filters, bounds toggle, and a
 * row-click combined probability diff dialog.
 */
export class CropAppDiffComponent {
  private readonly service = inject(CropInformationService);
  private readonly deploymentService = inject(DeploymentDashboardService);
  private readonly dialog = inject(MatDialog);

  private readonly excludedTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>>('excludedTemplate');
  private readonly probChangeTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>>('probChangeTemplate');
  private readonly stationTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>>('stationTemplate');
  private readonly diffDialogTemplate = viewChild.required<TemplateRef<unknown>>('diffDialogTemplate');

  public valueTemplates = computed(() => {
    const excluded = this.excludedTemplate();
    const probChange = this.probChangeTemplate();
    const station = this.stationTemplate();
    const map: Record<string, TemplateRef<{ $implicit: unknown; row: IAppDbDiffRow }>> = {};
    if (excluded) map['excluded_count'] = excluded;
    if (probChange) map['prob_change_pct'] = probChange;
    if (station) map['station'] = station;
    return map;
  });

  public loading = signal(true);
  public loadError = signal<string | null>(null);
  public applyBounds = signal(ENFORCE_LOOKUP_BOUNDS);
  public tableFilter = signal<AppDiffFilter>('all');
  public selectedDiffRow = signal<IAppDbDiffRow | null>(null);

  /** App data index entries for the active country */
  private appIndex = signal<IProbabilityTable[]>([]);
  /** Loaded app table JSON keyed by app entry id */
  private appTables = signal<Record<string, IStationCropData[] | null>>({});

  constructor() {
    effect(() => {
      const countryCode = this.deploymentService.activeDeploymentCountry();
      if (countryCode) void this.loadAppTables(countryCode);
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
    const ctx: IDiffRowContext = {
      cropDataHashmap: arrayToHashmap(this.service.cropData(), 'id', (v) => `${v.crop}/${v.variety}`),
      stationHashmap: arrayToHashmap(this.service.stationData(), 'station_id'),
      downscaledByLocation: arrayToHashmap(this.service.downscaledData(), 'location_id'),
      loadedTables: this.appTables(),
      labels: this.locationLabels(),
      applyBounds: this.applyBounds(),
    };
    const rows: IAppDbDiffRow[] = [];
    const seen = new Set<string>();

    for (const entry of this.appIndex()) {
      seen.add(locationIdFromAppId(entry.id));
      rows.push(this.buildAppEntryRow(entry, ctx));
    }

    for (const row of this.service.downscaledData()) {
      if (seen.has(row.location_id)) continue;
      seen.add(row.location_id);
      const dbRow = this.buildDbOnlyRow(row, ctx);
      if (dbRow) rows.push(dbRow);
    }

    return rows.sort((a, b) => (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99));
  });

  public openDiffDialog(row: IAppDbDiffRow) {
    this.selectedDiffRow.set(row);
    this.dialog.open(this.diffDialogTemplate(), {
      width: '1050px',
      maxWidth: '95vw',
    });
  }

  /** Diff row for a single committed app table entry */
  private buildAppEntryRow(entry: IProbabilityTable, ctx: IDiffRowContext): IAppDbDiffRow {
    const locationId = locationIdFromAppId(entry.id);
    const appTable = ctx.loadedTables[entry.id] ?? null;
    const appSummary = summarizeProbabilityTable(appTable);
    const expected = this.expectedTableForLocation(locationId, ctx, ctx.applyBounds);

    if (!expected) {
      const dbRow = ctx.downscaledByLocation[locationId];
      const dbStation = dbRow?.station_id ? this.stationDisplayName(dbRow.station_id, ctx.stationHashmap) : '';
      const detail = this.describeMissingSource(dbRow ?? null, ctx.stationHashmap);
      const combined = buildCombinedDiffTable({ app: appTable, expected: [] });
      return {
        location_id: locationId,
        location_label: entry.label,
        station: this.formatStationComparison(entry.station_label, dbStation),
        station_changed: this.isStationChanged(entry.station_label, dbStation),
        app_varieties: appSummary.varieties,
        db_varieties: 0,
        excluded_count: 0,
        prob_change_pct: null,
        status: 'Orphaned in App',
        detail,
        _dialogData: {
          diffTable: combined.stationData,
          diffTableMeta: {
            id: entry.id,
            label: entry.label,
            station_label: entry.station_label,
            dateHeadings: entry.dateHeadings,
            seasonProbabilities: entry.seasonProbabilities,
          },
          cellDiffs: combined.cellDiffs,
          qc: null,
          qcIssues: [],
        },
      };
    }

    const dbSummary = summarizeProbabilityTable(expected.table);
    const dbStation = this.stationDisplayName(expected.station.station_id, ctx.stationHashmap);
    const station = this.formatStationComparison(entry.station_label, dbStation);
    const station_changed = this.isStationChanged(entry.station_label, dbStation);
    const excludedCount = expected.qc.excludedCount;
    const qcIssues = expected.qc.results.filter((r) => r.failures.length > 0 || r.warnings.length > 0);
    const dbSeasonProbabilities = expected.startProbabilities.map((s) => roundToNearest(s.probability, 0.1));
    const diffTableMeta: IProbabilityTableMeta = {
      id: entry.id,
      label: entry.label,
      station_label: dbStation,
      dateHeadings: expected.startProbabilities.map((s) => s.label),
      seasonProbabilities: dbSeasonProbabilities,
    };

    if (!appTable) {
      const detail = 'App table failed to load, cannot compare';
      const combined = buildCombinedDiffTable({ app: [], expected: expected.table });
      return {
        location_id: locationId,
        location_label: entry.label,
        station,
        station_changed,
        app_varieties: appSummary.varieties,
        db_varieties: dbSummary.varieties,
        excluded_count: excludedCount,
        prob_change_pct: null,
        status: 'Differs',
        detail,
        _dialogData: {
          diffTable: combined.stationData,
          diffTableMeta,
          cellDiffs: combined.cellDiffs,
          qc: expected.qc,
          qcIssues,
        },
      };
    }

    if (deepEqualJson(appTable, expected.table)) {
      return {
        location_id: locationId,
        location_label: entry.label,
        station,
        station_changed,
        app_varieties: appSummary.varieties,
        db_varieties: dbSummary.varieties,
        excluded_count: excludedCount,
        prob_change_pct: 0,
        status: 'In Sync',
        detail: '',
      };
    }

    const differing = findDifferingCrops(appTable, expected.table);
    const combined = buildCombinedDiffTable({
      app: appTable,
      expected: expected.table,
      appSeasonProbabilities: entry.seasonProbabilities,
      dbSeasonProbabilities,
    });
    const probChangePct = calcProbabilityChangePct(appTable, expected.table);
    let isNewExclusions = false;
    if (ctx.applyBounds) {
      const ungated = this.expectedTableForLocation(locationId, ctx, false);
      if (ungated && deepEqualJson(appTable, ungated.table)) {
        isNewExclusions = true;
      }
    }

    const status: AppDbDiffStatus = isNewExclusions ? 'New Exclusions' : 'Differs';
    const detail = isNewExclusions
      ? `Differs solely due to QC bounds gating (${excludedCount} excluded): ${differing.join(', ')}`
      : `Crops differ: ${differing.join(', ')}`;

    return {
      location_id: locationId,
      location_label: entry.label,
      station,
      station_changed,
      app_varieties: appSummary.varieties,
      db_varieties: dbSummary.varieties,
      excluded_count: excludedCount,
      prob_change_pct: probChangePct,
      status,
      detail,
      _dialogData: {
        diffTable: combined.stationData,
        diffTableMeta,
        cellDiffs: combined.cellDiffs,
        qc: expected.qc,
        qcIssues,
      },
    };
  }

  /** Diff row for a data-system record with no app entry (null when nothing to compare) */
  private buildDbOnlyRow(row: ICropDataDownscaled['Row'], ctx: IDiffRowContext): IAppDbDiffRow | null {
    const waterRequirements = row.water_requirements as ICropDataDownscaledWaterRequirements;
    if (Object.keys(waterRequirements ?? {}).length === 0) return null;
    const label = ctx.labels[row.location_id] ?? row.location_id;
    const base = {
      location_id: row.location_id,
      location_label: label,
      app_varieties: 0,
      prob_change_pct: null,
    };
    const expected = this.expectedTableForLocation(row.location_id, ctx, ctx.applyBounds);
    if (expected) {
      const station = this.stationDisplayName(expected.station.station_id, ctx.stationHashmap);
      const qcIssues = expected.qc.results.filter((r) => r.failures.length > 0 || r.warnings.length > 0);
      const detail = `Usable data-system record has no app table (station ${expected.station.station_id})`;
      const combined = buildCombinedDiffTable({ app: [], expected: expected.table });
      return {
        ...base,
        station,
        station_changed: false,
        db_varieties: summarizeProbabilityTable(expected.table).varieties,
        excluded_count: expected.qc.excludedCount,
        status: 'Missing in App',
        detail,
        _dialogData: {
          diffTable: combined.stationData,
          diffTableMeta: {
            id: row.location_id,
            label,
            station_label: station,
            dateHeadings: expected.startProbabilities.map((s) => s.label),
            seasonProbabilities: expected.startProbabilities.map((s) => roundToNearest(s.probability, 0.1)),
          },
          cellDiffs: combined.cellDiffs,
          qc: expected.qc,
          qcIssues,
        },
      };
    }
    const detail = this.describeMissingSource(row, ctx.stationHashmap);
    return {
      ...base,
      station: row.station_id ?? '—',
      station_changed: false,
      db_varieties: 0,
      excluded_count: 0,
      status: 'No Source Data',
      detail,
    };
  }

  public displayedRows = computed(() => {
    const rows = this.diffRows();
    const filter = this.tableFilter();
    if (filter === 'all') return rows;
    return rows.filter((row) => row.status === filter);
  });

  public stats = computed(() => {
    const rows = this.diffRows();
    const count = (status: AppDbDiffStatus) => rows.filter((row) => row.status === status).length;
    return {
      total: rows.length,
      inSync: count('In Sync'),
      newExclusions: count('New Exclusions'),
      differs: count('Differs'),
      missing: count('Missing in App'),
      orphaned: count('Orphaned in App'),
      noSource: count('No Source Data'),
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['location_label', 'station', 'app_varieties', 'db_varieties', 'excluded_count', 'prob_change_pct'],
    paginatorSizes: [50, 100],
    search: true,
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        location_label: 'Location',
        station: 'Station',
        app_varieties: 'App Varieties',
        db_varieties: 'DB Varieties',
        excluded_count: 'Excluded',
        prob_change_pct: 'Δ Probabilities',
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
    ctx: IDiffRowContext,
    applyBounds: boolean,
  ): {
    table: IStationCropData[];
    startProbabilities: ISeasonStartProbability[];
    station: IStationDataWithMeta;
    qc: ILocationCropQcSummary;
  } | null {
    const row = ctx.downscaledByLocation[locationId];
    if (!row?.station_id) return null;
    const waterRequirements = row.water_requirements as ICropDataDownscaledWaterRequirements;
    if (Object.keys(waterRequirements ?? {}).length === 0) return null;
    const station = ctx.stationHashmap[row.station_id];
    if (!station) return null;
    const result = computeExpectedProbabilityTable({
      cropDataHashmap: ctx.cropDataHashmap,
      waterRequirements,
      rainfallData: station.annual_rainfall_data as unknown as IAnnualRainfallSummariesData[],
      cropProbabilityData: station.crop_probability_data as unknown as ICropSuccessEntry[],
      applyBounds,
      locationId,
      stationId: row.station_id,
    });
    if (!result) return null;
    return {
      table: result.table,
      startProbabilities: result.startProbabilities,
      station,
      qc: result.qc,
    };
  }

  private locationLabels = computed(() => {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    const labels: Record<string, string> = {};
    for (const location of getDeepestLocations(locationData)) labels[location.id] = location.label;
    return labels;
  });

  private stationDisplayName(stationId: string, stationHashmap: Record<string, IStationDataWithMeta>): string {
    const station = stationHashmap[stationId];
    return station?.station?.station_name || stationId;
  }

  private formatStationComparison(appStation: string, dbStation: string): string {
    if (!appStation) return dbStation || '—';
    if (!dbStation || appStation === dbStation) return appStation;
    return `${appStation} → ${dbStation}`;
  }

  private isStationChanged(appStation: string, dbStation: string): boolean {
    return !!appStation && !!dbStation && appStation !== dbStation;
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
