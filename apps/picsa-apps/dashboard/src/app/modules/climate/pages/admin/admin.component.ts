import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ClimateQcFailure, ClimateQcWarning, IStationData } from '@picsa/models';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import {
  arrayToHashmap,
  evaluateStationQualityGates,
  hasValidRainfallObservation,
  QC_FAILURE_LABELS,
} from '@picsa/utils';
import download from 'downloadjs';
import { unparse } from 'papaparse';
import { filter, lastValueFrom, map, switchMap } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { hackConvertStationDataForDisplay } from '../../climate.utils';
import { IStationDiffSummary } from '../../climate-diff.types';
import { compareStationDatasets } from '../../climate-diff.utils';
import { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';
import { StationDetailsDialogComponent } from './components/station-details-dialog/station-details-dialog.component';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

export type StationDiffStatus = 'in_sync' | 'divergent' | 'app_only' | 'db_only' | 'no_data';

function exportCsv(filename: string, data: any[]) {
  if (!data || data.length === 0) return;
  const columns = Object.keys(data[0]);
  const csv = unparse(data, { columns });
  download(csv, filename, 'text/csv');
}

function determineDiffStatus(hasApp: boolean, hasDb: boolean, isDiff: boolean): StationDiffStatus {
  if (!hasApp && !hasDb) return 'no_data';
  if (!hasApp) return 'db_only';
  if (!hasDb) return 'app_only';
  return isDiff ? 'divergent' : 'in_sync';
}

export interface IProductSummary {
  id: string;
  available: boolean;
  generation_timestamp?: string;
  generation_id?: string;
}

export interface IStationAdminSummary {
  name: string;
  station: IStationRow;
  updated_at?: string;
  rainfall_data?: IAnnualRainfallSummariesData[];
  rainfall_start_year?: number;
  rainfall_end_year?: number;
  rainfall_total_years?: number;
  rainfall_last_ten_years?: number;
  rainfall_last_thirty_years?: number;
  season_discrepancies?: number;
  season_discrepancies_details?: string;
  qc_passed?: boolean;
  qc_failures?: ClimateQcFailure[];
  qc_warnings?: ClimateQcWarning[];
  qc_season_warning?: string;
  qc_reasons?: string[];
  products: IProductSummary[];
  updateSignal: WritableSignal<IStatusUpdate>;
  /** rainfall csv data for download */
  rainfall_export_data?: IStationData[];
}

export interface IStationAppSummary {
  name: string;
  station: IStationRow;
  has_bundled_data: boolean;
  year_range: string;
  total_years: number;
  products: string[];
  app_data: IStationData[];
  qc_passed?: boolean;
  qc_failures?: ClimateQcFailure[];
  qc_reasons?: string[];
}

export interface IProductDiffLine {
  label: string;
  summary: string;
}

export interface IGroupDiffSummary {
  headlinePercent: number;
  headlinePercentFormatted: string;
  diffValuesCount: number;
  totalValuesCount: number;
  hasData: boolean;
  isInSync: boolean;
  isAppOnly: boolean;
  isDbOnly: boolean;
  productLines: IProductDiffLine[];
}

const PRODUCT_LABELS: Record<string, string> = {
  start: 'Season Start',
  end: 'Season End',
  length: 'Season Length',
  rainfall: 'Rainfall',
};

function resolveProductLabel(key: string, pDiff: any): string {
  if (pDiff?.label) return pDiff.label;
  const lookupKey = pDiff?.productKey || key;
  return PRODUCT_LABELS[lookupKey] ?? key;
}

interface IProductDiffItem {
  line: IProductDiffLine | null;
  total: number;
  diffCount: number;
}

function summarizeProductDiff(key: string, pDiff: any): IProductDiffItem {
  const label = resolveProductLabel(key, pDiff);
  const changes: string[] = [];

  const prodTotal =
    pDiff.totalAppValues !== undefined && pDiff.totalDbValues !== undefined
      ? pDiff.totalAppValues + pDiff.totalDbValues
      : (pDiff.totalValuesCount ?? 0);

  const added = pDiff.addedInDb ?? pDiff.yearsAdded ?? [];
  const missing = pDiff.missingInDb ?? pDiff.yearsRemoved ?? [];
  const changed = pDiff.changedValues ?? pDiff.changes ?? [];
  const changedLen = Array.isArray(changed) ? changed.length : (pDiff.changedCount ?? 0);
  const diffCount = added.length + missing.length + changedLen;

  if (added.length > 0) changes.push(`+${added.length} new`);
  if (missing.length > 0) changes.push(`-${missing.length} missing`);
  if (changedLen > 0) changes.push(`${changedLen} modified`);

  const line: IProductDiffLine | null =
    changes.length > 0
      ? {
          label,
          summary: changes.join(', '),
        }
      : null;

  return { line, total: prodTotal, diffCount };
}

export interface IStationDiffRow {
  name: string;
  station: IStationRow;
  diff_status: StationDiffStatus;
  qc_passed?: boolean;
  qc_failures?: ClimateQcFailure[];
  qc_details?: string;
  diff: IStationDiffSummary;
  app_years_count: number;
  db_years_count: number;
  updated_at?: string;
}

interface IStatusUpdate {
  started: boolean;
  statuses?: { id: string; status: string }[];
}

const DB_DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = [
  'name',
  'qc_passed',
  'rainfall_total_years',
  'rainfall_last_thirty_years',
  'rainfall_last_ten_years',
  'qc_warnings',
  'products',
  'updated_at',
];

const APP_DISPLAY_COLUMNS: (keyof IStationAppSummary | 'actions')[] = [
  'name',
  'has_bundled_data',
  'year_range',
  'total_years',
  'products',
  'actions',
];

const DIFF_DISPLAY_COLUMNS: (keyof IStationDiffRow | 'actions')[] = [
  'name',
  'diff_status',
  'qc_passed',
  'app_years_count',
  'db_years_count',
  'updated_at',
  'diff',
  'actions',
];

@Component({
  selector: 'dashboard-climate-admin-page',
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    PicsaDataTableComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateAdminPageComponent {
  public service = inject(ClimateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  public refreshCount = signal(-1);
  public isRefreshingAll = computed(() => this.refreshCount() > -1);
  public showOnlyDiffs = signal(false);

  private allStationData = toSignal(
    toObservable(this.service.stations).pipe(
      filter((stations) => stations.length > 0),
      switchMap(() => this.service.getAllStationData(this.service.apiCountryCode)),
      map(({ data }) => data || []),
    ),
    { initialValue: [] },
  );
  private allStationDataHashmap = computed(() => {
    return arrayToHashmap(this.allStationData(), 'station_id');
  });

  /** Bundled CSV app data loaded on deployment/country change */
  private allStationAppData = toSignal(
    toObservable(this.service.stations).pipe(
      filter((stations) => stations.length > 0),
      switchMap((stations) => this.service.getAllStationsAppData(this.service.apiCountryCode, stations)),
    ),
    { initialValue: {} as Record<string, IStationData[]> },
  );

  /** Keep reference to generated row update signals to prevent recreation on data load */
  private rowUpdateSignals = new Map<string, WritableSignal<IStatusUpdate>>();

  // 1. Database Table Data & Options (Consolidated with QC Status & Details)
  public dbQcFilter = signal<'all' | 'passed' | 'failed' | 'warnings'>('all');

  public allDbTableData = computed(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    return this.generateDbSummaryData(stations, allStationDataHashmap);
  });

  public dbStats = computed(() => {
    const rows = this.allDbTableData();
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    for (const r of rows) {
      if (r.qc_passed) passed++;
      else failed++;
      if (r.qc_season_warning) warnings++;
    }
    return {
      total: rows.length,
      passed,
      failed,
      warnings,
    };
  });

  public dbTableData = computed(() => {
    const rows = this.allDbTableData();
    const filterMode = this.dbQcFilter();
    if (filterMode === 'passed') return rows.filter((r) => r.qc_passed);
    if (filterMode === 'failed') return rows.filter((r) => !r.qc_passed);
    if (filterMode === 'warnings') return rows.filter((r) => Boolean(r.qc_season_warning));
    return rows;
  });

  public setDbQcFilter(mode: 'all' | 'passed' | 'failed' | 'warnings'): void {
    if (this.dbQcFilter() === mode) {
      this.dbQcFilter.set('all');
    } else {
      this.dbQcFilter.set(mode);
    }
  }

  public openStationDetailsDialog(station: IStationRow): void {
    this.dialog.open(StationDetailsDialogComponent, {
      data: { station },
      width: '92vw',
      maxWidth: '1280px',
      maxHeight: '90vh',
    });
  }

  public dbTableOptions: IDataTableOptions = {
    displayColumns: DB_DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationAdminSummary) => this.openStationDetailsDialog(station),
    formatHeader: (v) => {
      if (v === 'name' || v === 'station') return 'Station';
      if (v === 'qc_passed') return 'QC Status';
      if (v === 'rainfall_total_years') return 'Total Years';
      if (v === 'rainfall_last_thirty_years') return 'Past 30 Years';
      if (v === 'rainfall_last_ten_years') return 'Past 10 Years';
      if (v === 'qc_warnings') return 'Warnings';
      if (v === 'products') return 'Available Products';
      if (v === 'updated_at') return 'Last Sync';
      return formatHeaderDefault(v);
    },
  };

  // 2. App Bundled Table Data & Options
  public appTableData = computed(() => {
    const stations = this.service.stations();
    const allStationAppData = this.allStationAppData();
    return stations.map((station) => {
      const appData = allStationAppData[station.station_id] || [];
      const years = appData.map((d) => d.Year).filter((y) => typeof y === 'number' && !Number.isNaN(y));
      const startYear = years.length > 0 ? Math.min(...years) : '-';
      const endYear = years.length > 0 ? Math.max(...years) : '-';
      const year_range = years.length > 0 ? `${startYear} - ${endYear}` : '-';
      const total_years = years.length;
      const products = this.detectAppProducts(appData);
      const qc = appData.length > 0 ? evaluateStationQualityGates(appData) : evaluateStationQualityGates([]);

      return {
        name: station.station_name as string,
        station,
        has_bundled_data: appData.length > 0,
        year_range,
        total_years,
        products,
        app_data: appData,
        qc_passed: qc.passed,
        qc_failures: qc.failures,
        qc_reasons: qc.reasons,
      };
    });
  });

  public appTableOptions: IDataTableOptions = {
    displayColumns: APP_DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationAppSummary) => this.openStationDetailsDialog(station),
    formatHeader: (v) => {
      if (v === 'name') return 'Station';
      if (v === 'has_bundled_data') return 'Bundled Status';
      if (v === 'year_range') return 'Year Range';
      if (v === 'total_years') return 'Total Years';
      if (v === 'products') return 'Available Products';
      if (v === 'actions') return 'Action';
      return formatHeaderDefault(v);
    },
  };

  // 3. Data Comparison (Diff) Table Data & Options
  private allDiffRows = computed<IStationDiffRow[]>(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    const allStationAppData = this.allStationAppData();

    return stations.map((station) => {
      const stationData = allStationDataHashmap[station.id as string];
      const dbData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
      const appData = allStationAppData[station.station_id] || [];
      const qc = evaluateStationQualityGates(dbData);

      const diff = compareStationDatasets(station.station_id, appData, dbData);
      const diff_status = determineDiffStatus(appData.length > 0, dbData.length > 0, diff.status === 'diff');

      // Count only rainfall chart years
      const appRainfallYears = appData.filter(hasValidRainfallObservation).length;
      const dbRainfallYears = dbData.filter(hasValidRainfallObservation).length;

      return {
        name: station.station_name as string,
        station,
        diff_status,
        qc_passed: qc.passed,
        qc_failures: qc.failures,
        qc_details: qc.reasons.join('\n'),
        diff,
        app_years_count: appRainfallYears,
        db_years_count: dbRainfallYears,
        updated_at: stationData?.updated_at || undefined,
      };
    });
  });

  public diffStats = computed(() => {
    const rows = this.allDiffRows();
    let inSync = 0;
    let divergent = 0;
    let dbOnly = 0;
    let appOnly = 0;

    for (const row of rows) {
      switch (row.diff_status) {
        case 'in_sync':
          inSync++;
          break;
        case 'divergent':
          divergent++;
          break;
        case 'db_only':
          dbOnly++;
          break;
        case 'app_only':
          appOnly++;
          break;
      }
    }
    return {
      total: rows.length,
      inSync,
      divergent,
      dbOnly,
      appOnly,
    };
  });

  public diffTableData = computed<IStationDiffRow[]>(() => {
    const rows = this.allDiffRows();
    if (this.showOnlyDiffs()) {
      return rows.filter((r) => r.diff_status === 'divergent');
    }
    return rows;
  });

  public diffTableOptions: IDataTableOptions = {
    displayColumns: DIFF_DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationDiffRow) =>
      this.router.navigate(['../', 'station', station.station_id], { relativeTo: this.route }),
    formatHeader: (v) => {
      if (v === 'name') return 'Station';
      if (v === 'diff_status') return 'Status';
      if (v === 'qc_passed') return 'QC Status';
      if (v === 'app_years_count') return 'App Rainfall Years';
      if (v === 'db_rainfall_count' || v === 'db_years_count') return 'DB Rainfall Years';
      if (v === 'updated_at') return 'Last Sync';
      if (v === 'diff') return 'Product Differences';
      if (v === 'actions') return 'Action';
      return formatHeaderDefault(v);
    },
  };

  public getGroupDiffSummary(diff: any, diffStatus: StationDiffStatus): IGroupDiffSummary {
    if (diffStatus === 'app_only') {
      return {
        headlinePercent: 0,
        headlinePercentFormatted: '',
        diffValuesCount: 0,
        totalValuesCount: 0,
        hasData: false,
        isInSync: false,
        isAppOnly: true,
        isDbOnly: false,
        productLines: [],
      };
    }

    const lines: IProductDiffLine[] = [];
    let totalValuesCount = 0;
    let diffValuesCount = 0;

    for (const [key, pDiff] of Object.entries<any>(diff?.products || {})) {
      if (!pDiff) continue;
      const { line, total, diffCount } = summarizeProductDiff(key, pDiff);
      totalValuesCount += total;
      diffValuesCount += diffCount;
      if (line) lines.push(line);
    }

    const isDbOnly = diffStatus === 'db_only';
    const percent = isDbOnly || totalValuesCount === 0 ? 0 : Math.round((diffValuesCount / totalValuesCount) * 100);

    return {
      headlinePercent: percent,
      headlinePercentFormatted: isDbOnly ? '' : `~${percent}% diff`,
      diffValuesCount,
      totalValuesCount,
      hasData: totalValuesCount > 0 || isDbOnly,
      isInSync: diffValuesCount === 0 && !isDbOnly,
      isAppOnly: false,
      isDbOnly,
      productLines: lines,
    };
  }

  public getQcStatusTooltip(row: IStationAdminSummary): string {
    if (row.qc_passed) {
      return [
        'Quality Control: Passed',
        '✓ Total rainfall record ≥ 30 years',
        '✓ Past 30 years record ≥ 10 years',
        '✓ Recent data in past 10 years present',
      ].join('\n');
    }
    const reasons = row.qc_reasons && row.qc_reasons.length > 0 ? row.qc_reasons : ['Quality control criteria not met'];
    return ['Quality Control: Failed', ...reasons.map((r) => `✕ ${r}`)].join('\n');
  }

  public getWarningLines(row: IStationAdminSummary): string[] {
    const lines: string[] = [];
    if (row.qc_season_warning) {
      lines.push(row.qc_season_warning);
    }
    return lines;
  }

  public getQcFailureLabel(failure: ClimateQcFailure): string {
    return QC_FAILURE_LABELS[failure] || failure;
  }

  public getProductTooltip(product: IProductSummary): string {
    const parts = [product.id, product.available ? 'Available' : 'Unavailable'];
    if (product.generation_timestamp) {
      parts.push(`Generated: ${product.generation_timestamp}`);
    }
    if (product.generation_id) {
      parts.push(`ID: ${product.generation_id}`);
    }
    return parts.join('\n');
  }

  public getDiffTooltip(status: StationDiffStatus): string {
    switch (status) {
      case 'in_sync':
        return 'Bundled app data matches database perfectly';
      case 'divergent':
        return 'Database values differ from bundled app data';
      case 'db_only':
        return 'Station exists in database but has no bundled app data';
      case 'app_only':
        return 'Station exists in app assets but is not present in database';
      case 'no_data':
      default:
        return 'No data available in either database or app';
    }
  }

  public handleSummaryClick(e: Event, row: IStationAdminSummary, updateStatus: any): void {
    e.stopImmediatePropagation();
    if (updateStatus.status === 'rejected') {
      void this.refreshStation(row);
    }
  }

  public openStationDiffDialog(station: IStationRow, event?: MouseEvent) {
    if (event) event.stopPropagation();

    const allStationDataHashmap = this.allStationDataHashmap();
    const allStationAppData = this.allStationAppData();

    const stationData = allStationDataHashmap[station.id as string];
    const dbData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
    const appData = allStationAppData[station.station_id] || [];
    const diffSummary = compareStationDatasets(station.station_id, appData, dbData);

    this.dialog.open(StationDiffDialogComponent, {
      data: {
        station,
        diffSummary,
        appData,
        dbData,
        stationData,
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
  }

  public async refreshStation(summary: IStationAdminSummary, event?: MouseEvent) {
    if (event) event.stopPropagation();
    summary.updateSignal.update((signal) => ({ ...signal, started: true }));
    for (const product of summary.products) {
      product.available = false;
    }
    await lastValueFrom(this.service.updateStationDataFromApi(summary.station));
    const { data } = await this.service.getStationData(summary.station.id as string);
    if (data) {
      const rainfallSummary = this.generateRainfallSummary(data);
      Object.assign(summary, rainfallSummary);
      summary.products = this.generateProductSummary(data);
    }
    summary.updateSignal.update((signal) => ({ ...signal, started: false }));
  }

  public async refreshAllStations() {
    this.refreshCount.set(0);
    const stations = this.service.stations();
    await stations.reduce(async (prevPromise, station) => {
      await prevPromise;
      await lastValueFrom(this.service.updateStationDataFromApi(station));
      this.refreshCount.update((count) => count + 1);
    }, Promise.resolve());
    this.refreshCount.set(-1);
  }

  public downloadStationCSV(row: IStationAdminSummary | IStationAppSummary, event?: MouseEvent) {
    if (event) event.stopPropagation();
    let data;
    if ('rainfall_export_data' in row) {
      data = row.rainfall_export_data;
    } else if ('app_data' in row) {
      data = row.app_data;
    }

    if (!data || data.length === 0) return;
    const filename = `${row.station.station_id}.csv`;
    exportCsv(filename, data);
  }

  public downloadAllAppStationsCSV() {
    const allStationAppData = this.allStationAppData();
    for (const station of this.service.stations()) {
      const data = allStationAppData[station.station_id];
      if (data && data.length > 0) {
        exportCsv(`${station.station_id}.csv`, data);
      }
    }
  }

  private generateDbSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
  ): IStationAdminSummary[] {
    return stations.map((station) => {
      const stationData = allStationDataHashmap[station.id as string];
      const rainfallSummary = this.generateRainfallSummary(stationData);
      const updateSignal = this.getOrCreateRowUpdateSignal(station);
      return {
        name: station.station_name as string,
        station,
        updated_at: stationData?.updated_at || undefined,
        products: this.generateProductSummary(stationData),
        updateSignal,
        ...rainfallSummary,
      };
    });
  }

  private generateProductSummary(stationData: IClimateStationData['Row'] | undefined): IProductSummary[] {
    if (!stationData) {
      return this.defaultProductSummaries();
    }
    return [
      this.createProductSummary('Annual Rainfall', stationData.annual_rainfall_data),
      this.createProductSummary('Crop Probabilities', stationData.crop_probability_data),
      this.createProductSummary('Annual Temperature', stationData.annual_temperature_data),
      this.createProductSummary('Monthly Temperature', stationData.monthly_temperature_data),
    ];
  }

  private defaultProductSummaries(): IProductSummary[] {
    return [
      { id: 'Annual Rainfall', available: false },
      { id: 'Crop Probabilities', available: false },
      { id: 'Annual Temperature', available: false },
      { id: 'Monthly Temperature', available: false },
    ];
  }

  private createProductSummary(id: string, data: unknown): IProductSummary {
    const available = this.hasProductData(data);
    let generation_timestamp: string | undefined;
    let generation_id: string | undefined;

    if (available && Array.isArray(data) && data.length > 0) {
      const first = data[0] as Record<string, any>;
      generation_timestamp = first?._metadata?.generation_timestamp || first?.generation_timestamp;
      generation_id = first?._metadata?.generation_id || first?.generation_id;
    }

    return {
      id,
      available,
      generation_timestamp,
      generation_id,
    };
  }

  private detectAppProducts(appData: IStationData[]): string[] {
    if (!appData || appData.length === 0) return [];
    const products: string[] = [];
    const firstRow = appData[0];
    if ('Rainfall' in firstRow) products.push('Rainfall');
    if ('Start' in firstRow || 'End' in firstRow || 'Length' in firstRow) products.push('Season Bounds');
    if ('mean_tmin' in firstRow || 'mean_tmax' in firstRow) products.push('Temperature');
    return products;
  }

  /** Generate summaries of rainfall-related products */
  private generateRainfallSummary(stationData: IClimateStationData['Row'] | undefined): Partial<IStationAdminSummary> {
    if (!stationData) {
      return {};
    }
    const { annual_rainfall_data } = stationData;
    if (annual_rainfall_data) {
      const rainfall_data = annual_rainfall_data as IAnnualRainfallSummariesData[];
      const rainfall_export_data = hackConvertStationDataForDisplay(stationData).sort((a, b) => a.Year - b.Year);
      const qc = evaluateStationQualityGates(rainfall_export_data);

      return {
        rainfall_data,
        rainfall_start_year: qc.rainfallStartYear,
        rainfall_end_year: qc.rainfallEndYear,
        rainfall_total_years: qc.totalRainfallYears,
        rainfall_last_ten_years: qc.recentTenYearsCount,
        rainfall_last_thirty_years: qc.recentThirtyYearsCount,
        season_discrepancies: qc.seasonDiscrepanciesCount,
        season_discrepancies_details: qc.seasonDiscrepancySummary,
        qc_passed: qc.passed,
        qc_failures: qc.failures,
        qc_warnings: qc.warnings,
        qc_season_warning: qc.seasonDiscrepancySummary,
        qc_reasons: qc.reasons,
        rainfall_export_data,
      };
    }
    return {};
  }

  private hasProductData(data: unknown): boolean {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    return true;
  }

  private getOrCreateRowUpdateSignal(station: IStationRow): WritableSignal<IStatusUpdate> {
    const key = (station.id || station.station_id) as string;
    if (!this.rowUpdateSignals.has(key)) {
      this.rowUpdateSignals.set(key, signal<IStatusUpdate>({ started: false }));
    }
    return this.rowUpdateSignals.get(key)!;
  }
}
