/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import { allSettledInBatches } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';
import { lastValueFrom, Subject } from 'rxjs';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService, IDataRefreshStatus } from '../../climate.service';
import { hackConvertStationDataForDisplay } from '../../climate.utils';
import type { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';

interface IStatusUpdate {
  statuses: IDataRefreshStatus[];
  started: boolean;
  completed: boolean;
}

interface IStationAdminSummary {
  name: string;
  station: IStationRow;
  updated_at?: string;
  rainfall_data?: IAnnualRainfallSummariesData[];
  start_year?: number;
  end_year?: number;
  updateSignal: WritableSignal<IStatusUpdate>;
}

const REFRESH_BATCH_SIZE = 3;
const DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = ['name', 'updated_at', 'start_year', 'end_year', 'station'];

/**
 * TODOs - See #333 (possibly outdated after #404)
 */

@Component({
  selector: 'dashboard-climate-admin-page',
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, PicsaDataTableComponent],
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
    effect(() => {
      const country_code = this.deploymentService.activeDeployment()?.country_code;
      if (country_code) {
        this.loadAllStationsData(country_code);
      }
    });
  }

  public async downloadAllStationsCSV() {
    const zip = new JSZip();
    for (const entry of this.allStationData()) {
      const csvData = this.generateStationCSVDownload(entry);
      if (csvData) {
        zip.file(`${entry.station_id}.csv`, csvData);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    download(blob, `${country_code}_rainfall_summaries.zip`);
  }

  public downloadStationCSV(summary: IStationAdminSummary, e: Event) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const stationData = this.allStationDataHashmap()[summary.station.id as string];
    if (!stationData) {
      console.error('failed to get station data', summary, this.allStationDataHashmap());
      return;
    }
    const csv = this.generateStationCSVDownload(stationData);
    if (csv) {
      download(csv, summary.station.station_id, 'text/csv');
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
    const sub = new Subject();

    this.service.updateStationDataFromApi(station).subscribe({
      next: (v) => {
        updateSignal.update(({ completed, statuses, started }) => {
          statuses[v.index] = v;
          return { completed, started, statuses: [...statuses] };
        });
      },
      error: (e) => {
        console.error(e);
        sub.complete();
      },
      complete: async () => {
        updateSignal.update((v) => ({
          ...v,
          completed: true,
        }));
        sub.complete();
        // Refresh all data if triggered from single click event
        if (e) {
          await this.loadAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
        }
      },
    });
    return sub;
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
          const sub = this.refreshStation(summary);
          await lastValueFrom(sub);
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

  public showUpdateSummary(summary: IStationAdminSummary, e: Event) {
    // prevent default row click
    e.preventDefault();
    e.stopImmediatePropagation();
    // TODO - show summary dialog (refactor to common)
    // TODO - consider showing pending too....
  }

  private generateStationCSVDownload(stationData: IClimateStationData['Row']) {
    // Ignore entries where annual rainfall data not available (sometimes temp will still be)
    if (!stationData) return;
    if (!stationData.annual_rainfall_data) return;
    const csvData = hackConvertStationDataForDisplay(stationData);
    const columns = Object.keys(csvData[0]);
    const csv = unparse(csvData, { columns });
    return csv;

    return undefined;
  }

  private generateTableSummaryData(
    stations: IStationRow[],
    allStationDataHashmap: Record<string, IClimateStationData['Row']>,
  ) {
    return stations.map((station) => {
      const summary: IStationAdminSummary = {
        station,
        name: station.station_name as string,
        updateSignal: this.getRowUpdateSignal(station),
      };
      const stationData = allStationDataHashmap[station.id as string];
      if (stationData) {
        const { annual_rainfall_data, updated_at } = stationData;
        summary.updated_at = updated_at;
        const rainfall_data = (annual_rainfall_data || []) as IAnnualRainfallSummariesData[];
        summary.rainfall_data = rainfall_data;
        // HACK - some data includes additional entry at end with first year (out of order)
        const entries = rainfall_data.sort((a, b) => a.year - b.year);
        summary.start_year = entries[0]?.year;
        summary.end_year = entries[entries.length - 1]?.year;
      }
      return summary;
    });
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

  private async loadAllStationsData(country_code: string) {
    const { data, error } = await this.service.getAllStationData(country_code);

    if (error) {
      throw error;
    }
    this.allStationData.set(data);
  }
}
