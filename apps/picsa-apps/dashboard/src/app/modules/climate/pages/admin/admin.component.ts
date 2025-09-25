import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { IStationData } from '@picsa/models/src';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import { allSettledInBatches } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService, IDataRefreshStatus } from '../../climate.service';
import { hackConvertStationDataForDisplay } from '../../climate.utils';
import type { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';

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

interface IStationAdminSummary {
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

const REFRESH_BATCH_SIZE = 1; // TODO - increase batch size when api more consistent

const DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = [
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

/**
 * TODOs - See #333 (possibly outdated after #404)
 */

@Component({
  selector: 'dashboard-climate-admin-page',
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, PicsaDataTableComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateAdminPageComponent {
  public tableData = computed(() => {
    const stations = this.service.stations();
    const allStationDataHashmap = this.allStationDataHashmap();
    const tableData = this.generateTableSummaryData(stations, allStationDataHashmap);
    return tableData;
  });
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: ({ station }: IStationAdminSummary) =>
      this.router.navigate(['../', 'station', station.station_id], { relativeTo: this.route }),
    formatHeader: (v) => {
      if (v === 'station') return '';
      return formatHeaderDefault(v);
    },
  };
  public refreshCount = signal(-1);

  private allStationData = signal<IClimateStationData['Row'][]>([]);
  private allStationDataHashmap = computed(() => arrayToHashmap(this.allStationData(), 'station_id'));

  /** Keep reference to generated row update signals to prevent recreation on data load */
  private rowUpdateSignals = new Map<string, WritableSignal<IStatusUpdate>>();

  constructor(
    private service: ClimateService,
    private deploymentService: DeploymentDashboardService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    effect(async () => {
      const country_code = this.deploymentService.activeDeployment()?.country_code;
      if (country_code) {
        const allStationData = await this.loadAllStationsData(country_code);
        this.allStationData.set(allStationData || []);
      }
    });
  }

  public async downloadAllStationsCSV() {
    const zip = new JSZip();
    for (const entry of this.tableData()) {
      const { rainfall_export_data } = entry;
      if (rainfall_export_data && rainfall_export_data.length > 0) {
        const columns = Object.keys(rainfall_export_data[0]);
        const csv = unparse(rainfall_export_data, { columns });
        zip.file(`${entry.station.id}.csv`, csv);
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
      download(csv, station_id, 'text/csv');
    }
  }

  /** Trigger station refresh and subscribe to changes, updating individual station signal to track in UI */
  public refreshStation(summary: IStationAdminSummary, e?: Event) {
    // prevent default row click
    if (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    // create signal to track data changes and observer to track in refreshAll
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
            await this.loadAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
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
    // Create promises as executable functions as otherwise they will start to execute on creation
    for (const summary of this.tableData()) {
      // mark all as started even though batches
      summary.updateSignal.update((v) => ({ ...v, started: true }));
      // add update to queue
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
    await this.loadAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
    this.refreshCount.set(-1);
  }

  public handleSummaryClick(e: Event, row: IStationAdminSummary, updateStatus: IDataRefreshStatus) {
    e.stopImmediatePropagation();
    console.log(`[${row.name}] ${updateStatus.id}`, updateStatus.status, { row, updateStatus });
    // Try to refresh rejected
    if (updateStatus.status === 'rejected') {
      return this.refreshStation(row);
    }
    return;
  }

  private generateTableSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
  ) {
    return stations.map((station) => {
      let summary: IStationAdminSummary = {
        station,
        name: station.station_name as string,
        updateSignal: this.getRowUpdateSignal(station),
        products: [],
      };
      const stationData = allStationDataHashmap[station.id as string];
      if (stationData) {
        summary.updated_at = stationData.updated_at;
        summary.products = this.generateProductSummary(stationData);
        summary = { ...summary, ...this.generateRainfallSummary(stationData) };
      }
      return summary;
    });
  }

  /** Generate summaries of rainfall-related products */
  private generateRainfallSummary(stationData: IClimateStationData['Row']): Partial<IStationAdminSummary> {
    const { annual_rainfall_data } = stationData;
    if (annual_rainfall_data) {
      const rainfall_data = annual_rainfall_data as IAnnualRainfallSummariesData[];
      // Convert api data to format exported for use in charts
      // HACK - some data includes additional entry at end with first year (out of order)
      const rainfall_export_data = hackConvertStationDataForDisplay(stationData).sort((a, b) => a.Year - b.Year);
      const completeEntries = rainfall_export_data.filter((v) => v.Start && v.End && v.Length && v.Rainfall);
      const recentYear = new Date().getFullYear() - QC_RECENT_YEARS_THRESHOLD;
      const rainfall_total_years = completeEntries.length;
      const rainfall_last_ten_years = completeEntries.filter((v) => v.Year >= recentYear).length;

      // qc check
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
    // TODO - combine with data from climate service
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

  private async loadAllStationsData(country_code: string): Promise<IClimateStationData['Row'][]> {
    const { data, error } = await this.service.getAllStationData(country_code);

    if (error) {
      throw error;
    }
    return data;
  }
}
