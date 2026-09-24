import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { IStationData } from '@picsa/models';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { allSettledInBatches, arrayToHashmap } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService, IDataRefreshStatus } from '../../climate.service';
import { hackConvertStationDataForDisplay } from '../../climate.utils';
import { IStationDiffSummary, StationDiffStatus } from '../../climate-diff.types';
import { CLIMATE_PRODUCTS, compareStationDatasets } from '../../climate-diff.utils';
import type { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';
import { StationDiffDialogComponent } from './components/station-diff-dialog/station-diff-dialog.component';

// variables used in quality-control checking data
const QC_RECENT_YEARS_THRESHOLD = 10;
const QC_MIN_TOTAL_YEARS_DATA = 30;
const QC_MIN_RECENT_YEARS_DATA = 7;

interface IStatusUpdate {
  statuses: IDataRefreshStatus[];
  started: boolean;
  completed: boolean;
}

type IProductSummary = { id: string; available: boolean };

export interface IStationAdminSummary {
  name: string;
  station: IStationRow;
  updated_at?: string;
  rainfall_data?: IAnnualRainfallSummariesData[];
  rainfall_start_year?: number;
  rainfall_end_year?: number;
  rainfall_total_years?: number;
  rainfall_last_ten_years?: number;
  products: IProductSummary[];
  updateSignal: WritableSignal<IStatusUpdate>;
  /** rainfall csv data for download */
  rainfall_export_data?: IStationData[];
  rainfall_issues?: number;
  rainfall_issues_details?: string[];
}

export interface IStationAppSummary {
  name: string;
  station: IStationRow;
  has_bundled_data: boolean;
  year_range: string;
  total_years: number;
  products: string[];
  app_data: IStationData[];
}

export interface IStationDiffRow {
  name: string;
  station: IStationRow;
  diff_status: StationDiffStatus;
  diff: IStationDiffSummary;
  app_years_count: number;
  db_years_count: number;
  years_added: number;
  years_removed: number;
  values_changed: number;
  affected_products_summary: string;
}

const REFRESH_BATCH_SIZE = 1; // TODO - increase batch size when api more consistent

const DB_DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = [
  'name',
  'updated_at',
  'rainfall_start_year',
  'rainfall_end_year',
  'rainfall_total_years',
  'rainfall_last_ten_years',
  'rainfall_issues',
  'products',
  'rainfall_export_data',
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
  'app_years_count',
  'db_years_count',
  'years_added',
  'years_removed',
  'values_changed',
  'affected_products_summary',
  'actions',
];

@Component({
  selector: 'dashboard-climate-admin-page',
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatCheckboxModule,
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
  private service = inject(ClimateService);
  private deploymentService = inject(DeploymentDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

  public showOnlyDiffs = signal(false);
  public refreshCount = signal(-1);

  private allStationData = signal<IClimateStationData['Row'][]>([]);
  private allStationDataHashmap = computed(() => arrayToHashmap(this.allStationData(), 'station_id'));
  private allStationAppData = signal<Record<string, IStationData[]>>({});

  /** Keep reference to generated row update signals to prevent recreation on data load */
  private rowUpdateSignals = new Map<string, WritableSignal<IStatusUpdate>>();

  // 1. Database Table Data & Options
  public dbTableData = computed(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    return this.generateDbSummaryData(stations, allStationDataHashmap);
  });

  public dbTableOptions: IDataTableOptions = {
    displayColumns: DB_DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationAdminSummary) =>
      this.router.navigate(['../', 'station', station.station_id], { relativeTo: this.route }),
    formatHeader: (v) => {
      if (v === 'station') return '';
      return formatHeaderDefault(v);
    },
  };

  // 2. App Bundled Table Data & Options
  public appTableData = computed(() => {
    const stations = this.service.stations();
    const allStationAppData = this.allStationAppData();
    return this.generateAppSummaryData(stations, allStationAppData);
  });

  public appTableOptions: IDataTableOptions = {
    displayColumns: APP_DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationAppSummary) =>
      this.router.navigate(['../', 'station', station.station_id], { relativeTo: this.route }),
    formatHeader: (v) => {
      if (v === 'has_bundled_data') return 'Bundled CSV';
      if (v === 'year_range') return 'Year Range';
      if (v === 'total_years') return 'Total Years';
      if (v === 'products') return 'Available Products';
      if (v === 'actions') return 'Action';
      return formatHeaderDefault(v);
    },
  };

  // 3. Diff Table Data & Options
  private allDiffRows = computed(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    const allStationAppData = this.allStationAppData();
    return this.generateDiffSummaryData(stations, allStationDataHashmap, allStationAppData);
  });

  public diffTableData = computed(() => {
    const rows = this.allDiffRows();
    if (this.showOnlyDiffs()) {
      return rows.filter((r) => r.diff_status === 'diff');
    }
    return rows;
  });

  public diffTableOptions: IDataTableOptions = {
    displayColumns: DIFF_DISPLAY_COLUMNS,
    handleRowClick: (row: IStationDiffRow) => this.openStationDiffDialog(row.station),
    formatHeader: (v) => {
      if (v === 'diff_status') return 'Status';
      if (v === 'app_years_count') return 'App Years';
      if (v === 'db_years_count') return 'Data System Years';
      if (v === 'years_added') return 'Data System Added (+Y)';
      if (v === 'years_removed') return 'Data System Missing (-Y)';
      if (v === 'values_changed') return 'Value Diffs (~Z)';
      if (v === 'affected_products_summary') return 'Divergent Products';
      if (v === 'actions') return 'Action';
      return formatHeaderDefault(v);
    },
  };

  // Diff KPI Stats
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

  constructor() {
    effect(async () => {
      const country_code = this.deploymentService.activeDeployment()?.country_code;
      const stations = this.service.stations();
      if (country_code) {
        await this.updateAllStationsData(country_code, stations);
      }
    });
  }

  // --- Actions ---

  public async downloadAllStationsCSV() {
    const zip = new JSZip();
    for (const entry of this.dbTableData()) {
      const { rainfall_export_data } = entry;
      if (rainfall_export_data && rainfall_export_data.length > 0) {
        const columns = Object.keys(rainfall_export_data[0]);
        const csv = unparse(rainfall_export_data, { columns });
        zip.file(`${entry.station.station_id}.csv`, csv);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    download(blob, `${country_code}_rainfall_summaries.zip`);
  }

  public downloadStationCSV(summary: IStationAdminSummary, e: Event) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const rainfall_export_data = summary.rainfall_export_data;
    if (rainfall_export_data && rainfall_export_data.length > 0) {
      const station_id = summary.station.station_id;
      const columns = Object.keys(rainfall_export_data[0]);
      const csv = unparse(rainfall_export_data, { columns });
      download(csv, `${station_id}.csv`, 'text/csv');
    }
  }

  public async downloadAllAppStationsCSV() {
    const zip = new JSZip();
    const appDataHashmap = this.allStationAppData();
    for (const station of this.service.stations()) {
      const data = appDataHashmap[station.station_id];
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        const csv = unparse(data, { columns });
        zip.file(`${station.station_id}.csv`, csv);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    download(blob, `${country_code}_bundled_app_summaries.zip`);
  }

  public downloadAppStationCSV(row: IStationAppSummary, e: Event) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (row.app_data && row.app_data.length > 0) {
      const columns = Object.keys(row.app_data[0]);
      const csv = unparse(row.app_data, { columns });
      download(csv, `${row.station.station_id}.csv`, 'text/csv');
    }
  }

  /** Trigger station refresh and subscribe to changes, updating individual station signal to track in UI */
  public refreshStation(summary: IStationAdminSummary, e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    const { station, updateSignal } = summary;
    updateSignal.update((v) => ({ ...v, started: true }));

    return new Promise<void>((resolve, reject) => {
      this.service.updateStationDataFromApi(station).subscribe({
        next: (status) => {
          updateSignal.update(({ statuses, ...rest }) => {
            statuses[status.index] = status;
            return { ...rest, statuses: [...statuses] };
          });
        },
        error: (err) => {
          console.error(err);
          reject(err);
        },
        complete: async () => {
          updateSignal.update((v) => ({ ...v, completed: true }));
          if (e) {
            await this.updateAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
          }
          resolve();
        },
      });
    });
  }

  /** Trigger data refresh for all stations */
  public async refreshAllStations() {
    this.refreshCount.set(0);

    const promises: (() => Promise<any>)[] = [];
    for (const summary of this.dbTableData()) {
      summary.updateSignal.update((v) => ({ ...v, started: true }));
      promises.push(async () => {
        try {
          await this.refreshStation(summary);
        } catch (error) {
          console.error(`[${summary.station.station_id}]`, (error as any).message);
        } finally {
          this.refreshCount.update((v) => v + 1);
        }
      });
    }
    await allSettledInBatches(promises, REFRESH_BATCH_SIZE);
    await this.updateAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
    this.refreshCount.set(-1);
  }

  public handleSummaryClick(e: Event, row: IStationAdminSummary, updateStatus: IDataRefreshStatus) {
    e.stopImmediatePropagation();
    if (updateStatus.status === 'rejected') {
      return this.refreshStation(row);
    }
    return;
  }

  /** Open Station Diff and Chart Comparison Preview Dialog */
  public openStationDiffDialog(station: IStationRow, e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    const stationId = station.station_id;
    const appData = this.allStationAppData()[stationId] || [];
    const stationData = this.allStationDataHashmap()[stationId];
    const dbData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
    const diffSummary = compareStationDatasets(stationId, appData, dbData);

    this.dialog.open(StationDiffDialogComponent, {
      data: {
        station,
        diffSummary,
        appData,
        dbData,
      },
      panelClass: 'no-padding',
      autoFocus: false,
      width: '950px',
      maxWidth: '95vw',
    });
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

  // --- Data Generator Helpers ---

  private generateDbSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
  ): IStationAdminSummary[] {
    return stations.map((station) => {
      let summary: IStationAdminSummary = {
        station,
        name: station.station_name as string,
        updateSignal: this.getRowUpdateSignal(station),
        products: [],
      };
      const stationData = allStationDataHashmap[station.station_id];
      if (stationData) {
        summary.updated_at = stationData.updated_at;
        summary.products = this.generateProductSummary(stationData);
        summary = { ...summary, ...this.generateRainfallSummary(stationData) };
      }
      return summary;
    });
  }

  private generateAppSummaryData(
    stations: IStationRow[],
    allStationAppData: Record<string, IStationData[]>,
  ): IStationAppSummary[] {
    return stations.map((station) => {
      const appData = allStationAppData[station.station_id] || [];
      const has_bundled_data = appData.length > 0;
      const years = appData
        .map((d) => d.Year)
        .filter((y): y is number => typeof y === 'number' && !Number.isNaN(y))
        .sort((a, b) => a - b);

      const year_range = years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : '-';
      const total_years = years.length;

      const productsFound: string[] = [];
      for (const p of CLIMATE_PRODUCTS) {
        const hasData = appData.some((row) =>
          p.keys.some((k) => {
            const val = row[k];
            return typeof val === 'number' && !Number.isNaN(val);
          }),
        );
        if (hasData) {
          productsFound.push(p.label);
        }
      }

      return {
        station,
        name: station.station_name as string,
        has_bundled_data,
        year_range,
        total_years,
        products: productsFound,
        app_data: appData,
      };
    });
  }

  private generateDiffSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
    allStationAppData: Record<string, IStationData[]>,
  ): IStationDiffRow[] {
    return stations.map((station) => {
      const stationId = station.station_id;
      const appData = allStationAppData[stationId] || [];
      const stationData = allStationDataHashmap[stationId];
      const dbDisplayData = stationData ? hackConvertStationDataForDisplay(stationData) : [];
      const diff = compareStationDatasets(stationId, appData, dbDisplayData);

      const affected: string[] = [];
      for (const p of CLIMATE_PRODUCTS) {
        const prodSummary = diff.products[p.id];
        if (prodSummary && !prodSummary.isInSync && prodSummary.hasData) {
          const parts: string[] = [];
          if (prodSummary.yearsAdded.length > 0) parts.push(`+${prodSummary.yearsAdded.length}`);
          if (prodSummary.yearsRemoved.length > 0) parts.push(`-${prodSummary.yearsRemoved.length}`);
          if (prodSummary.changedCount > 0) parts.push(`~${prodSummary.changedCount}`);
          affected.push(`${p.label} (${parts.join(', ')})`);
        }
      }

      const affected_products_summary = affected.length > 0 ? affected.join('; ') : '-';

      const appYears = appData.map((d) => d.Year).filter((y): y is number => typeof y === 'number' && !Number.isNaN(y));
      const dbYears = dbDisplayData
        .map((d) => d.Year)
        .filter((y): y is number => typeof y === 'number' && !Number.isNaN(y));

      return {
        name: station.station_name as string,
        station,
        diff_status: diff.status,
        diff,
        app_years_count: appYears.length,
        db_years_count: dbYears.length,
        years_added: diff.totalYearsAddedCount,
        years_removed: diff.totalYearsRemovedCount,
        values_changed: diff.totalChangedValuesCount,
        affected_products_summary,
      };
    });
  }

  /** Generate summaries of rainfall-related products */
  private generateRainfallSummary(stationData: IClimateStationData['Row']): Partial<IStationAdminSummary> {
    const { annual_rainfall_data } = stationData;
    if (annual_rainfall_data) {
      const rainfall_data = annual_rainfall_data as IAnnualRainfallSummariesData[];
      const rainfall_export_data = hackConvertStationDataForDisplay(stationData).sort((a, b) => a.Year - b.Year);
      const completeEntries = rainfall_export_data.filter((v) => v.Start && v.End && v.Length && v.Rainfall);
      const recentYear = new Date().getFullYear() - QC_RECENT_YEARS_THRESHOLD;
      const rainfall_total_years = completeEntries.length;
      const rainfall_last_ten_years = completeEntries.filter((v) => v.Year >= recentYear).length;

      const issues: string[] = [];
      if (rainfall_total_years < QC_MIN_TOTAL_YEARS_DATA) {
        if (rainfall_total_years === 0) {
          issues.push(`No Complete Data`);
        } else {
          issues.push(`Only ${rainfall_total_years} Years Complete Data`);
        }
      }
      if (rainfall_last_ten_years < QC_MIN_RECENT_YEARS_DATA) {
        if (rainfall_last_ten_years === 0) {
          issues.push(`No Recent Data`);
        } else {
          issues.push(`Only ${rainfall_last_ten_years} Years Recent Data`);
        }
      }

      return {
        rainfall_data,
        rainfall_start_year: rainfall_export_data[0]?.Year,
        rainfall_end_year: rainfall_export_data[rainfall_export_data.length - 1]?.Year,
        rainfall_total_years,
        rainfall_last_ten_years,
        rainfall_export_data,
        rainfall_issues_details: issues,
        rainfall_issues: issues.length,
      };
    }
    return {};
  }

  private generateProductSummary(stationData: IClimateStationData['Row']) {
    const { annual_rainfall_data, annual_temperature_data, crop_probability_data, monthly_temperature_data } =
      stationData;
    const productSummaries: IProductSummary[] = [
      { id: 'Annual Rainfall', available: annual_rainfall_data !== null },
      { id: 'Crop Probabilities', available: crop_probability_data !== null },
      { id: 'Annual Temperatures', available: annual_temperature_data !== null },
      { id: 'Monthly Temperatures', available: monthly_temperature_data !== null },
    ];
    return productSummaries;
  }

  /** create or reuse signal to provide live data refresh updates */
  private getRowUpdateSignal(station: IStationRow) {
    const { station_id } = station;
    const existingSignal = this.rowUpdateSignals.get(station_id);
    if (existingSignal) return existingSignal;
    else {
      const createdSignal = signal({ statuses: [], started: false, completed: false });
      this.rowUpdateSignals.set(station_id, createdSignal);
      return createdSignal;
    }
  }

  private async updateAllStationsData(countryCode: string, stations?: IStationRow[]) {
    const targetStations = stations || this.service.stations();
    const { data, error } = await this.service.getAllStationData(countryCode);
    if (error) {
      console.error(error);
    }
    if (data) {
      this.allStationData.set(data);
    }
    const appData = await this.service.getAllStationsAppData(countryCode, targetStations);
    this.allStationAppData.set(appData);
  }
}
