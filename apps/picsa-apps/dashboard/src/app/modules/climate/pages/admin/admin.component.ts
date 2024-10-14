import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { _wait, arrayToHashmapArray } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import type { IAnnualRainfallSummariesData, IClimateProductRow, IStationRow } from '../../types';
import { hackConvertAPIDataToLegacyFormat } from '../station-details/components/rainfall-summary/rainfall-summary.utils';

interface IStationAdminSummary {
  station_id: string;
  row: IStationRow;
  updated_at: string;
  rainfall_summary?: IClimateProductRow;
  start_year?: number;
  end_year?: number;
}

const DISPLAY_COLUMNS: (keyof IStationAdminSummary)[] = ['station_id', 'updated_at', 'start_year', 'end_year'];

/**
 * TODOs - See #333
 */

@Component({
  selector: 'dashboard-climate-admin-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaDataTableComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class ClimateAdminPageComponent {
  public tableData = computed(() => {
    const stations = this.service.stations();
    const products = this.climateProducts();
    return this.generateTableSummaryData(stations, products);
  });
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
  };
  public refreshCount = signal(-1);

  private climateProducts = signal<IClimateProductRow[]>([]);

  constructor(
    private service: ClimateService,
    private deploymentService: DeploymentDashboardService,
    private supabase: SupabaseService
  ) {
    effect(
      () => {
        const country_code = this.deploymentService.activeDeployment()?.country_code;
        if (country_code) {
          this.loadRainfallSummaries(country_code);
        }
      },
      { allowSignalWrites: true }
    );
  }
  private get db() {
    return this.supabase.db.table('climate_products');
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
      await this.service.loadFromAPI.rainfallSummaries(station.row);
      this.refreshCount.update((v) => v + 1);
    });
    await Promise.all(promises);
    await this.loadRainfallSummaries(this.deploymentService.activeDeployment()?.country_code as string);
  }

  private generateStationCSVDownload(summary: IStationAdminSummary) {
    const { rainfall_summary } = summary;
    if (rainfall_summary && rainfall_summary.data) {
      const data = rainfall_summary.data['data'] as any[];
      const csvData = hackConvertAPIDataToLegacyFormat(data);
      const columns = Object.keys(csvData[0]);
      const csv = unparse(csvData, { columns });
      return csv;
    }
    return undefined;
  }

  private generateTableSummaryData(stations: IStationRow[], products: IClimateProductRow[]) {
    // NOTE - only single entry for rainfallSummary (not hashmapArray)
    const productsHashmap = arrayToHashmapArray(products, 'station_id');
    return stations.map((row) => {
      const { station_id } = row;
      const summary: IStationAdminSummary = { station_id, row, updated_at: '' };
      const rainfallSummary = productsHashmap[station_id]?.find((p) => p.type === 'rainfallSummary');
      if (rainfallSummary) {
        summary.rainfall_summary = rainfallSummary;
        const { data } = rainfallSummary;
        const entries: IAnnualRainfallSummariesData[] = data?.['data'] || [];
        summary.start_year = entries[0]?.year;
        summary.end_year = entries[entries.length - 1]?.year;
      }
      return summary;
    });
  }

  private async loadRainfallSummaries(country_code: string) {
    const { data, error } = await this.db.select<'*', IClimateProductRow>('*');

    if (error) {
      throw error;
    }
    const filtered = data
      .filter((el) => el.type === 'rainfallSummary' && el.station_id.startsWith(`${country_code}/`))
      .map((station) => {
        station.station_id = station.station_id.replace(`${country_code}/`, '');
        return station;
      });
    this.climateProducts.set(filtered);
  }
}
