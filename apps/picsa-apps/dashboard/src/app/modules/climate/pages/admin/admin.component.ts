import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { _wait, arrayToHashmap } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import type { IAnnualRainfallSummariesData, IClimateSummaryRainfallRow, IStationRow } from '../../types';
import { hackConvertAPIDataToLegacyFormat } from '../station-details/components/data-summary/rainfall-summary.utils';

interface IStationAdminSummary {
  station_id: string;
  row: IStationRow;
  updated_at?: string;
  rainfall_summary?: IClimateSummaryRainfallRow;
  start_year?: number;
  end_year?: number;
}

const DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = ['station_id', 'updated_at', 'start_year', 'end_year'];

/**
 * TODOs - See #333
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
    const rainfallSummaries = this.rainfallSummaries();
    return this.generateTableSummaryData(stations, rainfallSummaries);
  });
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: ({ station_id }: IStationAdminSummary) =>
      this.router.navigate(['../', 'station', station_id], { relativeTo: this.route }),
  };
  public refreshCount = signal(-1);

  private rainfallSummaries = signal<IClimateSummaryRainfallRow[]>([]);

  constructor(
    private service: ClimateService,
    private deploymentService: DeploymentDashboardService,
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService,
  ) {
    effect(() => {
      const country_code = this.deploymentService.activeDeployment()?.country_code;
      if (country_code) {
        this.loadRainfallSummaries(country_code);
      }
    });
  }
  private get db() {
    return this.supabase.db.table('climate_summary_rainfall');
  }

  public async downloadAllStationsCSV() {
    const zip = new JSZip();
    for (const summary of this.tableData()) {
      const csvData = this.generateStationCSVDownload(summary);
      if (csvData) {
        zip.file(`${summary.row.station_id}.csv`, csvData);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    download(blob, `${country_code}_rainfall_summaries.zip`);
  }

  public downloadStationCSV(station: IStationAdminSummary) {
    const csv = this.generateStationCSVDownload(station);
    if (csv) {
      download(csv, station.row.station_id, 'text/csv');
    }
  }

  public async refreshAllStations() {
    this.refreshCount.set(0);
    const promises = this.tableData().map(async (station, i) => {
      // hack - instead of queueing apply small offset between requests to reduce blocking
      await _wait(200 * i);
      try {
        await this.service.loadFromAPI.rainfallSummaries(station.row);
        // TODO - find tidier way to also fetch probabilities
        // await this.service.loadFromAPI.cropProbabilities(station.row);
      } catch (error) {
        this.notificationService.showErrorNotification(`Could not update station: ${station.station_id}`);
        console.error(error);
      } finally {
        this.refreshCount.update((v) => v + 1);
      }
    });
    await Promise.allSettled(promises);
    await this.loadRainfallSummaries(this.deploymentService.activeDeployment()?.country_code as string);
  }

  private generateStationCSVDownload(summary: IStationAdminSummary) {
    const { rainfall_summary } = summary;
    if (rainfall_summary && rainfall_summary.data) {
      const data = rainfall_summary.data as any[];
      const csvData = hackConvertAPIDataToLegacyFormat(data);
      const columns = Object.keys(csvData[0]);
      const csv = unparse(csvData, { columns });
      return csv;
    }
    return undefined;
  }

  private generateTableSummaryData(stations: IStationRow[], rainfallSummaries: IClimateSummaryRainfallRow[]) {
    // NOTE - only single entry for rainfallSummary (not hashmapArray)
    const rainfallSummariesHashmap = arrayToHashmap(rainfallSummaries, 'station_id');
    return stations.map((row) => {
      const { station_id, id } = row;
      const summary: IStationAdminSummary = { station_id, row };
      const rainfallSummary = rainfallSummariesHashmap[station_id];
      if (rainfallSummary) {
        const { data, updated_at } = rainfallSummary;
        summary.updated_at = updated_at;
        summary.rainfall_summary = rainfallSummary;
        // HACK - some data includes additional entry at end with first year (out of order)
        const entries = (data as IAnnualRainfallSummariesData[]).sort((a, b) => a.year - b.year);
        summary.start_year = entries[0]?.year;
        summary.end_year = entries[entries.length - 1]?.year;
      }
      return summary;
    });
  }

  private async loadRainfallSummaries(country_code: string) {
    const { data, error } = await this.db.select<'*', IClimateSummaryRainfallRow>('*').eq('country_code', country_code);
    if (error) {
      throw error;
    }
    this.rainfallSummaries.set(
      data.map((el) => {
        // HACK - to keep parent ref id includes full country prefix, remove for lookup
        el.station_id = el.station_id.replace(`${country_code}/`, '');
        return el;
      }),
    );
  }
}
