import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ClimateQcFailure, ClimateQcWarning, IStationData } from '@picsa/models';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { evaluateStationQualityGates, QC_FAILURE_LABELS } from '@picsa/utils';
import download from 'downloadjs';
import { unparse } from 'papaparse';
import { filter, lastValueFrom, map, switchMap } from 'rxjs';

import { ClimateService } from '../../climate.service';
import { extractStationGenerationMetadata, hackConvertStationDataForDisplay } from '../../climate.utils';
import { IStationDiffSummary, StationDiffStatus } from '../../climate-diff.types';
import { CLIMATE_PRODUCTS, compareStationDatasets } from '../../climate-diff.utils';
import { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';
import { StationDetailsDialogComponent } from './components/station-details-dialog/station-details-dialog.component';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

function exportCsv(filename: string, data: any[]) {
  if (!data || data.length === 0) return;
  const columns = Object.keys(data[0]);
  const csv = unparse(data, { columns });
  download(csv, filename, 'text/csv');
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
  generation_timestamp?: string;
  generation_id?: string;
  rainfall_data?: IAnnualRainfallSummariesData[];
  rainfall_year_range?: string;
  rainfall_start_year?: number;
  rainfall_end_year?: number;
  rainfall_total_years?: number;
  rainfall_last_ten_years?: number;
  rainfall_last_thirty_years?: number;
  season_discrepancies?: number;
  season_discrepancies_details?: string;
  qc_score?: number;
  qc_passed?: boolean;
  qc_failures?: ClimateQcFailure[];
  qc_warnings?: ClimateQcWarning[];
  qc_warning_reasons?: string[];
  qc_season_warning?: string;
  qc_reasons?: string[];
  products: IProductSummary[];
  monthly_data?: {
    has_temp: boolean;
    has_rain: boolean;
  };
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
  qc_score?: number;
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

export interface IStationDiffRow {
  name: string;
  station: IStationRow;
  diff_status: StationDiffStatus;
  diff: IStationDiffSummary;
  app_years_count: number;
  db_years_count: number;
  updated_at?: string;
  generation_timestamp?: string;
  generation_id?: string;
  season_diff_percent: number;
  season_diff: number;
  season_summary: IGroupDiffSummary;
  temp_diff_percent: number;
  temp_diff: number;
  temp_summary: IGroupDiffSummary;
}

interface IStatusUpdate {
  started: boolean;
  statuses?: { id: string; status: string }[];
}

const SEASON_PRODUCT_IDS = ['rainfall', 'start', 'end', 'length'];
const TEMP_PRODUCT_IDS = ['temp_min', 'temp_max'];

const DB_DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = [
  'name',
  'qc_score',
  'rainfall_year_range',
  'rainfall_total_years',
  'rainfall_last_thirty_years',
  'rainfall_last_ten_years',
  'qc_warnings',
  'products',
  'monthly_data',
  'generation_timestamp',
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
  'updated_at',
  'app_years_count',
  'db_years_count',
  'season_diff_percent',
  'season_diff',
  'temp_diff_percent',
  'temp_diff',
  'actions',
];

@Component({
  selector: 'dashboard-climate-admin-page',
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatCheckboxModule,
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
      switchMap((stations) => {
        const countryCode = this.service.apiCountryCode || (stations[0]?.country_code as any);
        return this.service.getAllStationData(countryCode);
      }),
      map(({ data }) => data || []),
    ),
    { initialValue: [] },
  );
  private allStationDataHashmap = computed(() => {
    const list = this.allStationData();
    const stations = this.service.stations();
    const stationIdToSlug = new Map<string, string>();
    for (const s of stations) {
      if (s.id && s.station_id) {
        stationIdToSlug.set(s.id, s.station_id);
      }
    }
    const map: Record<string, IClimateStationData['Row']> = {};
    for (const row of list) {
      if (row.station_id) {
        map[row.station_id] = row;
        const slug = stationIdToSlug.get(row.station_id);
        if (slug) {
          map[slug] = row;
        }
      }
    }
    return map;
  });

  /** Bundled CSV app data loaded on deployment/country change */
  private allStationAppData = toSignal(
    toObservable(this.service.stations).pipe(
      filter((stations) => stations.length > 0),
      switchMap((stations) => {
        const countryCode = this.service.apiCountryCode || (stations[0]?.country_code as any);
        return this.service.getAllStationsAppData(countryCode, stations);
      }),
    ),
    { initialValue: {} as Record<string, IStationData[]> },
  );

  /** Keep reference to generated row update signals to prevent recreation on data load */
  private rowUpdateSignals = new Map<string, WritableSignal<IStatusUpdate>>();

  // 1. Database Table Data & Options (Consolidated with QC Status & Details)
  public dbQcFilter = signal<'all' | 'passed' | 'failed'>('all');

  public allDbTableData = computed(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    return this.generateDbSummaryData(stations, allStationDataHashmap);
  });

  public dbStats = computed(() => {
    const rows = this.allDbTableData();
    let passed = 0;
    let failed = 0;
    for (const r of rows) {
      if (r.qc_passed) passed++;
      else failed++;
    }
    return {
      total: rows.length,
      passed,
      failed,
    };
  });

  public dbTableData = computed(() => {
    const rows = this.allDbTableData();
    const filterMode = this.dbQcFilter();
    if (filterMode === 'passed') return rows.filter((r) => r.qc_passed);
    if (filterMode === 'failed') return rows.filter((r) => !r.qc_passed);
    return rows;
  });

  public setDbQcFilter(mode: 'all' | 'passed' | 'failed'): void {
    if (this.dbQcFilter() === mode) {
      this.dbQcFilter.set('all');
    } else {
      this.dbQcFilter.set(mode);
    }
  }

  public openStationDetailsDialog(station: IStationRow): void {
    const allStationDataHashmap = this.allStationDataHashmap();
    const stationData =
      (station.id ? allStationDataHashmap[station.id] : undefined) ||
      (station.station_id ? allStationDataHashmap[station.station_id] : undefined) ||
      null;

    this.dialog.open(StationDetailsDialogComponent, {
      data: { station, stationData },
      width: '92vw',
      maxWidth: '1280px',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'no-padding',
    });
  }

  public dbTableOptions: IDataTableOptions = {
    displayColumns: DB_DISPLAY_COLUMNS,
    sort: { id: 'qc_score', start: 'asc' },
    handleRowClick: ({ station }: IStationAdminSummary) => this.openStationDetailsDialog(station),
    formatHeader: (v) => {
      if (v === 'name') return 'Station';
      if (v === 'qc_score' || v === 'qc_passed') return 'QC Status';
      if (v === 'rainfall_year_range') return 'Years Range';
      if (v === 'rainfall_total_years') return 'Total Years';
      if (v === 'rainfall_last_thirty_years') return 'Past 30 Years';
      if (v === 'rainfall_last_ten_years') return 'Past 10 Years';
      if (v === 'qc_warnings') return 'Warnings';
      if (v === 'products') return 'Products 🌧  🌡  🌾';
      if (v === 'monthly_data') return 'Monthly 🌧  🌡';
      if (v === 'generation_timestamp' || v === 'updated_at') return 'Data Generated';
      return formatHeaderDefault(v);
    },
  };

  // 2. App Bundled Table Data & Options
  public appTableData = computed<IStationAppSummary[]>(() => {
    const stations = this.service.stations();
    const allStationAppData = this.allStationAppData();
    return this.generateAppSummaryData(stations, allStationAppData);
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
    return this.generateDiffSummaryData(stations, allStationDataHashmap, allStationAppData);
  });

  public diffStats = computed(() => {
    const rows = this.allDiffRows();
    let inSync = 0;
    let diff = 0;
    let dbOnly = 0;
    let appOnly = 0;
    let noData = 0;
    for (const r of rows) {
      if (r.diff_status === 'in_sync') inSync++;
      else if (r.diff_status === 'diff') diff++;
      else if (r.diff_status === 'db_only') dbOnly++;
      else if (r.diff_status === 'app_only') appOnly++;
      else noData++;
    }
    return {
      total: rows.length,
      inSync,
      diff,
      dbOnly,
      appOnly,
      noData,
    };
  });

  public diffFilter = signal<'all' | 'in_sync' | 'diff' | 'db_only' | 'app_only'>('all');

  public setDiffFilter(mode: 'all' | 'in_sync' | 'diff' | 'db_only' | 'app_only'): void {
    const next = this.diffFilter() === mode ? 'all' : mode;
    this.diffFilter.set(next);
    this.showOnlyDiffs.set(next === 'diff');
  }

  public diffTableData = computed<IStationDiffRow[]>(() => {
    const rows = this.allDiffRows();
    const filterMode = this.diffFilter();
    if (filterMode === 'all') {
      if (this.showOnlyDiffs()) {
        return rows.filter((r) => r.diff_status === 'diff');
      }
      return rows;
    }
    return rows.filter((r) => r.diff_status === filterMode);
  });

  public diffTableOptions: IDataTableOptions = {
    displayColumns: DIFF_DISPLAY_COLUMNS,
    handleRowClick: (row: IStationDiffRow) => this.openStationDiffDialog(row.station),
    formatHeader: (v) => {
      if (v === 'name') return 'Station';
      if (v === 'diff_status') return 'Status';
      if (v === 'updated_at') return 'Data System Generated';
      if (v === 'app_years_count') return 'App Years';
      if (v === 'db_years_count') return 'Data System Years';
      if (v === 'season_diff_percent') return 'Season Change %';
      if (v === 'season_diff') return 'Season Change';
      if (v === 'temp_diff_percent') return 'Temp Change %';
      if (v === 'temp_diff') return 'Temp Change';
      if (v === 'actions') return 'Action';
      return formatHeaderDefault(v);
    },
  };

  public getQcScoreColorClass(rowOrScore?: IStationAdminSummary | number): string {
    const score = typeof rowOrScore === 'number' ? rowOrScore : rowOrScore?.qc_score;
    // Failures (< 0) - ordered by failure severity with lighter/paler shades
    if (score === undefined || score <= -3) return 'text-rose-700';
    if (score === -2) return 'text-rose-500';
    if (score === -1) return 'text-amber-500';

    // Passes (>= 30) - strictly tiered by score so rows remain cleanly grouped without alternating
    if (score < 40) return 'text-teal-500';
    if (score < 60) return 'text-emerald-500';
    return 'text-emerald-600';
  }

  public getQcStatusTooltip(row: IStationAdminSummary): string {
    const score = row.qc_score ?? (row.qc_passed ? 30 : -3);
    if (score < 0) {
      const count = Math.abs(score);
      const failWord = count === 1 ? 'check' : 'checks';
      const reasons =
        row.qc_reasons && row.qc_reasons.length > 0 ? row.qc_reasons : ['Quality control criteria not met'];
      return [`Quality Control: Failed (${count} ${failWord} failed)`, ...reasons.map((r) => `✕ ${r}`)].join('\n');
    }
    const lines = [
      `Quality Control: Passed (${score} years recorded)`,
      '✓ Total rainfall record ≥ 30 years',
      '✓ Past 30 years record ≥ 10 years',
      '✓ Recent data in past 10 years present',
    ];
    if (row.qc_warning_reasons && row.qc_warning_reasons.length > 0) {
      lines.push('Warnings:');
      lines.push(...row.qc_warning_reasons.map((w) => `⚠ ${w}`));
    }
    return lines.join('\n');
  }

  public getWarningLines(row: IStationAdminSummary): string[] {
    if (row.qc_warning_reasons && row.qc_warning_reasons.length > 0) {
      return row.qc_warning_reasons;
    }
    if (row.qc_season_warning) {
      return row.qc_season_warning.split(', ').filter(Boolean);
    }
    return [];
  }

  public getQcFailureLabel(failure: ClimateQcFailure): string {
    return QC_FAILURE_LABELS[failure] || failure;
  }

  public getProductTooltip(product: IProductSummary): string {
    if (!product.available) {
      return `${product.id} (No data / Error - click to refresh)`;
    }
    let tip = product.id;
    if (product.generation_timestamp) {
      const formattedDate = new Date(product.generation_timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      tip += ` (Generated: ${formattedDate}`;
      if (product.generation_id) {
        tip += ` • ID: ${product.generation_id}`;
      }
      tip += ')';
    } else if (product.generation_id) {
      tip += ` (ID: ${product.generation_id})`;
    }
    return tip;
  }

  public getMonthlyTooltip(monthly?: { has_temp: boolean; has_rain: boolean }): string {
    return [
      `Monthly Rainfall: ${monthly?.has_rain ? 'Available' : 'Missing'}`,
      `Monthly Temperature: ${monthly?.has_temp ? 'Available' : 'Missing'}`,
    ].join('\n');
  }

  public getGenerationTooltip(timestamp?: string, id?: string, syncedAt?: string): string {
    const lines: string[] = [];
    if (timestamp) {
      const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      lines.push(`Generated: ${formattedDate}`);
    }
    if (id) {
      lines.push(`Generation ID: ${id}`);
    }
    if (syncedAt) {
      const syncedDate = new Date(syncedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      lines.push(`Last Synced: ${syncedDate}`);
    }
    return lines.join('\n');
  }

  public getDiffTooltip(diff?: IStationDiffSummary): string {
    if (!diff) return 'Checking app data differences...';
    if (diff.status === 'in_sync') {
      return 'Station data is identical to bundled app CSV across all climate products. Click to preview charts.';
    }
    if (diff.status === 'db_only') {
      return `Data system records exist (${diff.totalYearsAddedCount} years), but no bundled app CSV was found. Click to preview.`;
    }
    if (diff.status === 'app_only') {
      return `Bundled app CSV exists (${diff.totalYearsRemovedCount} years), but no data system station records exist. Click to preview.`;
    }
    if (diff.status === 'no_data') {
      return 'No data in either DB or bundled app CSV.';
    }

    const parts: string[] = [];
    for (const product of CLIMATE_PRODUCTS) {
      const p = diff.products[product.id];
      if (p && !p.isInSync && p.hasData) {
        const details: string[] = [];
        if (p.yearsAdded.length > 0) details.push(`+${p.yearsAdded.length} yrs`);
        if (p.yearsRemoved.length > 0) details.push(`-${p.yearsRemoved.length} yrs`);
        if (p.changedCount > 0) details.push(`~${p.changedCount} changed`);
        parts.push(`${product.label}: ${details.join(', ')}`);
      }
    }

    return (
      `Differences detected (+${diff.totalYearsAddedCount} added, -${diff.totalYearsRemovedCount} removed, ~${diff.totalChangedValuesCount} changed):\n` +
      parts.join('\n') +
      '\nClick to inspect & preview overlaid charts.'
    );
  }

  public handleSummaryClick(e: Event, row: IStationAdminSummary, updateStatus: any): void {
    e.stopImmediatePropagation();
    if (updateStatus.status === 'rejected') {
      void this.refreshStation(row);
    }
  }

  public openStationDiffDialog(station: IStationRow, event?: MouseEvent | Event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    const stationId = station.station_id;
    const allStationDataHashmap = this.allStationDataHashmap();
    const allStationAppData = this.allStationAppData();

    const stationData =
      (station.id ? allStationDataHashmap[station.id] : undefined) ||
      (station.station_id ? allStationDataHashmap[station.station_id] : undefined);
    const dbData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
    const appData = allStationAppData[stationId] || [];
    const diffSummary = compareStationDatasets(stationId, appData, dbData);

    this.dialog.open(StationDiffDialogComponent, {
      data: {
        station,
        diffSummary,
        appData,
        dbData,
        stationData,
      },
      panelClass: 'no-padding',
      autoFocus: false,
      width: '950px',
      maxWidth: '95vw',
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
      summary.monthly_data = this.generateMonthlySummary(data);
      summary.updated_at = data.updated_at || undefined;
      const { generation_timestamp, generation_id } = extractStationGenerationMetadata(data);
      summary.generation_timestamp = generation_timestamp;
      summary.generation_id = generation_id;
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

  private calculateGroupDiffSummary(diff: IStationDiffSummary, productIds: string[]): IGroupDiffSummary {
    const productLines: IProductDiffLine[] = [];
    let hasData = false;
    let anyOutOfSync = false;
    let hasAppDataInGroup = false;
    let hasDbDataInGroup = false;
    let groupDiffValuesCount = 0;
    let groupTotalValuesCount = 0;

    for (const pid of productIds) {
      const prodSummary = diff.products[pid];
      if (!prodSummary || !prodSummary.hasData) {
        continue;
      }
      hasData = true;
      if (prodSummary.appYearSpan !== null) {
        hasAppDataInGroup = true;
      }
      if (prodSummary.dbYearSpan !== null) {
        hasDbDataInGroup = true;
      }

      const totalProdValues =
        prodSummary.totalValuesCount ??
        prodSummary.yearsAdded.length + prodSummary.yearsRemoved.length + prodSummary.changedCount;
      groupTotalValuesCount += totalProdValues;

      const prodDiffCount =
        prodSummary.changes?.length ??
        prodSummary.yearsAdded.length + prodSummary.yearsRemoved.length + prodSummary.changedCount;
      groupDiffValuesCount += prodDiffCount;

      if (!prodSummary.isInSync) {
        anyOutOfSync = true;
        const parts: string[] = [];
        if (prodSummary.yearsAdded.length > 0) parts.push(`+${prodSummary.yearsAdded.length}`);
        if (prodSummary.yearsRemoved.length > 0) parts.push(`-${prodSummary.yearsRemoved.length}`);
        if (prodSummary.changedCount > 0) parts.push(`~${prodSummary.changedCount}`);

        productLines.push({
          label: prodSummary.label,
          summary: parts.join(', '),
        });
      }
    }

    if (groupTotalValuesCount === 0 && groupDiffValuesCount > 0) {
      groupTotalValuesCount = groupDiffValuesCount;
    }

    const isAppOnly = (hasAppDataInGroup && !hasDbDataInGroup) || diff.status === 'app_only';
    const isDbOnly = (!hasAppDataInGroup && hasDbDataInGroup) || diff.status === 'db_only';

    // For app-only, we do not propose any changes to the app, so suppress breakdowns
    const finalProductLines = isAppOnly ? [] : productLines;

    const isInSync = hasData && !anyOutOfSync;

    // Suppress 100% headline calculation for db_only and app_only
    let headlinePercent = 0;
    let headlinePercentFormatted = '';

    if (!isAppOnly && !isDbOnly && groupTotalValuesCount > 0) {
      headlinePercent = (groupDiffValuesCount / groupTotalValuesCount) * 100;
      headlinePercentFormatted = this.formatHeadlinePercent(headlinePercent, groupDiffValuesCount);
    }

    return {
      headlinePercent,
      headlinePercentFormatted,
      diffValuesCount: groupDiffValuesCount,
      totalValuesCount: groupTotalValuesCount,
      hasData,
      isInSync,
      isAppOnly,
      isDbOnly,
      productLines: finalProductLines,
    };
  }

  private formatHeadlinePercent(percent: number, diffCount: number): string {
    if (diffCount === 0 || percent === 0) {
      return '0%';
    }
    const rounded = Number(percent.toFixed(1));
    if (rounded === 0) {
      return '<0.1%';
    }
    return `${rounded}%`;
  }

  private generateDiffSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
    allStationAppData: Record<string, IStationData[]>,
  ): IStationDiffRow[] {
    return stations.map((station) => {
      const stationId = station.station_id;
      const appData = allStationAppData[stationId] || [];
      const stationData =
        (station.id ? allStationDataHashmap[station.id] : undefined) ||
        (station.station_id ? allStationDataHashmap[station.station_id] : undefined);
      const dbDisplayData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
      const diff = compareStationDatasets(stationId, appData, dbDisplayData);

      const season_summary = this.calculateGroupDiffSummary(diff, SEASON_PRODUCT_IDS);
      const temp_summary = this.calculateGroupDiffSummary(diff, TEMP_PRODUCT_IDS);

      const appYears = appData.map((d) => d.Year).filter((y): y is number => typeof y === 'number' && !Number.isNaN(y));
      const dbYears = dbDisplayData
        .map((d) => d.Year)
        .filter((y): y is number => typeof y === 'number' && !Number.isNaN(y));

      const { generation_timestamp: genTimestamp, generation_id: genId } =
        extractStationGenerationMetadata(stationData);

      return {
        name: station.station_name as string,
        station,
        diff_status: diff.status,
        diff,
        app_years_count: appYears.length,
        db_years_count: dbYears.length,
        updated_at: stationData?.updated_at,
        generation_timestamp: genTimestamp,
        generation_id: genId,
        season_diff_percent: season_summary.headlinePercent,
        season_diff: season_summary.diffValuesCount,
        season_summary,
        temp_diff_percent: temp_summary.headlinePercent,
        temp_diff: temp_summary.diffValuesCount,
        temp_summary,
      };
    });
  }

  private generateDbSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
  ): IStationAdminSummary[] {
    return stations.map((station) => {
      const stationData =
        (station.id ? allStationDataHashmap[station.id] : undefined) ||
        (station.station_id ? allStationDataHashmap[station.station_id] : undefined);
      const rainfallSummary = this.generateRainfallSummary(stationData);
      const updateSignal = this.getOrCreateRowUpdateSignal(station);
      const { generation_timestamp, generation_id } = extractStationGenerationMetadata(stationData);
      return {
        name: station.station_name as string,
        station,
        updated_at: stationData?.updated_at || undefined,
        generation_timestamp,
        generation_id,
        products: this.generateProductSummary(stationData),
        monthly_data: this.generateMonthlySummary(stationData),
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
      this.createProductSummary(
        'Annual Rainfall',
        stationData.annual_rainfall_data,
        stationData.annual_rainfall_metadata,
      ),
      this.createProductSummary(
        'Annual Temperature',
        stationData.annual_temperature_data,
        stationData.annual_temperature_metadata,
      ),
      this.createProductSummary(
        'Crop Probabilities',
        stationData.crop_probability_data,
        stationData.crop_probability_metadata,
      ),
    ];
  }

  private defaultProductSummaries(): IProductSummary[] {
    return [
      { id: 'Annual Rainfall', available: false },
      { id: 'Annual Temperature', available: false },
      { id: 'Crop Probabilities', available: false },
    ];
  }

  private generateMonthlySummary(stationData: IClimateStationData['Row'] | undefined): {
    has_temp: boolean;
    has_rain: boolean;
  } {
    return {
      has_temp: this.hasProductData(stationData?.monthly_temperature_data),
      has_rain: this.hasProductData(stationData?.monthly_rainfall_data),
    };
  }

  private createProductSummary(id: string, data: unknown, metadata?: unknown): IProductSummary {
    const available = this.hasProductData(data);
    const meta = metadata as { generation_timestamp?: string; generation_id?: string } | null | undefined;
    const generation_timestamp = meta?.generation_timestamp;
    const generation_id = meta?.generation_id;

    return {
      id,
      available,
      generation_timestamp,
      generation_id,
    };
  }

  private detectAppProducts(appData: IStationData[]): string[] {
    const products: string[] = [];
    if (appData.some((row) => row.Rainfall !== undefined && row.Rainfall !== null)) {
      products.push('Rainfall');
    }
    if (
      appData.some(
        (row) =>
          (row.mean_tmin !== undefined && row.mean_tmin !== null) ||
          (row.mean_tmax !== undefined && row.mean_tmax !== null),
      )
    ) {
      products.push('Temperature');
    }
    if (
      appData.some(
        (row) =>
          (row.Start !== undefined && row.Start !== null) ||
          (row.End !== undefined && row.End !== null) ||
          (row.Length !== undefined && row.Length !== null),
      )
    ) {
      products.push('Crop');
    }
    return products;
  }

  private generateAppSummaryData(
    stations: IStationRow[],
    allStationAppData: Record<string, IStationData[]>,
  ): IStationAppSummary[] {
    return stations.map((station) => {
      const appData = allStationAppData[station.station_id] || [];
      const has_bundled_data = appData.length > 0;
      const years = appData.map((d) => d.Year).filter((y): y is number => typeof y === 'number' && !isNaN(y));
      const year_range = years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : '';
      const total_years = years.length;
      const products = this.detectAppProducts(appData);

      return {
        name: station.station_name as string,
        station,
        has_bundled_data,
        year_range,
        total_years,
        products,
        app_data: appData,
      };
    });
  }

  private generateRainfallSummary(stationData: IClimateStationData['Row'] | undefined): Partial<IStationAdminSummary> {
    if (!stationData) {
      const qc = evaluateStationQualityGates([]);
      return {
        rainfall_data: [],
        rainfall_year_range: '—',
        rainfall_total_years: 0,
        rainfall_last_ten_years: 0,
        rainfall_last_thirty_years: 0,
        season_discrepancies: 0,
        qc_score: qc.qc_score,
        qc_passed: qc.passed,
        qc_failures: qc.failures,
        qc_reasons: qc.reasons,
      };
    }
    const { annual_rainfall_data } = stationData;
    if (annual_rainfall_data) {
      const rainfall_data = annual_rainfall_data as IAnnualRainfallSummariesData[];
      const rainfall_export_data = hackConvertStationDataForDisplay(stationData).sort((a, b) => a.Year - b.Year);
      const qc = evaluateStationQualityGates(rainfall_export_data);
      const rainfall_start_year = qc.rainfallStartYear;
      const rainfall_end_year = qc.rainfallEndYear;
      const rainfall_year_range =
        rainfall_start_year && rainfall_end_year ? `${rainfall_start_year} – ${rainfall_end_year}` : '—';

      return {
        rainfall_data,
        rainfall_year_range,
        rainfall_start_year,
        rainfall_end_year,
        rainfall_total_years: qc.totalRainfallYears,
        rainfall_last_ten_years: qc.recentTenYearsCount,
        rainfall_last_thirty_years: qc.recentThirtyYearsCount,
        season_discrepancies: qc.seasonDiscrepanciesCount,
        season_discrepancies_details: qc.seasonDiscrepancySummary,
        qc_score: qc.qc_score,
        qc_passed: qc.passed,
        qc_failures: qc.failures,
        qc_warnings: qc.warnings,
        qc_warning_reasons: qc.warningReasons,
        qc_season_warning: qc.seasonDiscrepancySummary,
        qc_reasons: qc.reasons,
        rainfall_export_data,
      };
    }
    const qc = evaluateStationQualityGates([]);
    return {
      rainfall_data: [],
      rainfall_year_range: '—',
      rainfall_total_years: 0,
      rainfall_last_ten_years: 0,
      rainfall_last_thirty_years: 0,
      season_discrepancies: 0,
      qc_score: qc.qc_score,
      qc_passed: qc.passed,
      qc_failures: qc.failures,
      qc_reasons: qc.reasons,
    };
  }

  private getOrCreateRowUpdateSignal(station: IStationRow): WritableSignal<IStatusUpdate> {
    const existing = this.rowUpdateSignals.get(station.station_id);
    if (existing) return existing;
    const initialSignal = signal<IStatusUpdate>({ started: false });
    this.rowUpdateSignals.set(station.station_id, initialSignal);
    return initialSignal;
  }

  private hasProductData(data: unknown): boolean {
    if (!data) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    return true;
  }
}
