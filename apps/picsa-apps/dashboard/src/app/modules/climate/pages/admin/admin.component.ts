/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { _wait, arrayToHashmap } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import type { IAnnualRainfallSummariesData, IClimateStationData, IStationRow } from '../../types';
import { hackConvertAPIDataToLegacyFormat } from '../station-details/components/data-summary/data-summary.utils';

interface IStationAdminSummary {
  station_id: string;
  row: IStationRow;
  updated_at?: string;
  rainfall_data?: IAnnualRainfallSummariesData[];
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
    const allStationData = this.allStationData();
    return this.generateTableSummaryData(stations, allStationData);
  });
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: ({ station_id }: IStationAdminSummary) =>
      this.router.navigate(['../', 'station', station_id], { relativeTo: this.route }),
  };
  public refreshCount = signal(-1);

  private allStationData = signal<IClimateStationData['Row'][]>([]);

  constructor(
    private service: ClimateService,
    private deploymentService: DeploymentDashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: PicsaNotificationService,
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
    // TODO - use climate service method
    return;
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
    await this.loadAllStationsData(this.deploymentService.activeDeployment()?.country_code as string);
  }

  private generateStationCSVDownload(summary: IStationAdminSummary) {
    const { rainfall_data } = summary;
    if (rainfall_data) {
      const csvData = hackConvertAPIDataToLegacyFormat(rainfall_data);
      const columns = Object.keys(csvData[0]);
      const csv = unparse(csvData, { columns });
      return csv;
    }
    return undefined;
  }

  private generateTableSummaryData(stations: IStationRow[], allStationData: IClimateStationData['Row'][]) {
    // NOTE - only single entry for rainfallSummary (not hashmapArray)
    const rainfallSummariesHashmap = arrayToHashmap(allStationData, 'station_id');
    return stations.map((row) => {
      const { station_id, id } = row;
      const summary: IStationAdminSummary = { station_id, row };
      const stationData = rainfallSummariesHashmap[station_id];
      if (stationData) {
        const { annual_rainfall_data = [], updated_at } = stationData;
        summary.updated_at = updated_at;
        const rainfall_data = annual_rainfall_data as IAnnualRainfallSummariesData[];
        summary.rainfall_data = rainfall_data;
        // HACK - some data includes additional entry at end with first year (out of order)
        const entries = rainfall_data.sort((a, b) => a.year - b.year);
        summary.start_year = entries[0]?.year;
        summary.end_year = entries[entries.length - 1]?.year;
      }
      return summary;
    });
  }

  private async loadAllStationsData(country_code: string) {
    const { data, error } = await this.service.getAllStationData(country_code);

    if (error) {
      throw error;
    }
    this.allStationData.set(
      data.map((el) => {
        // HACK - to keep parent ref id includes full country prefix, remove for lookup
        el.station_id = el.station_id.replace(`${country_code}/`, '');
        return el;
      }),
    );
  }
}
