import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { arrayToHashmapArray } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';
import { unparse } from 'papaparse';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ClimateService } from '../../climate.service';
import type { IAnnualRainfallSummariesData, IClimateProductRow, IStationRow } from '../../types';
import { hackConvertAPIDataToLegacyFormat } from '../station-details/components/rainfall-summary/rainfall-summary.utils';

/**
 * TODOs
 * - [ ] Improve types throughout
 * - [ ] Add auth and navlink route guards
 * - [ ] Add button to force api fetch
 * - [ ] Update table to include country_code for filtered query
 * - [ ] Update table to include updated_at
 * - [ ] Consider rename climate_products table to just be climate_rainfall_summary (separate data/metadata cols)
 * - [ ] Improve data conversion so raw data can be displayed in dashboard (and climate products use)
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
    displayColumns: ['station_id', 'type', 'updated_at', 'start_year', 'end_year', 'csv'],
  };

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
        zip.file(`${summary.station_id}.csv`, csvData);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const country_code = this.deploymentService.activeDeployment()?.country_code;
    download(blob, `${country_code}_rainfall_summaries.zip`);
  }

  public downloadStationCSV(summary) {
    const csv = this.generateStationCSVDownload(summary);
    if (csv) {
      download(csv, summary.station_id, 'text/csv');
    }
  }
  private generateStationCSVDownload(summary) {
    if (summary.data && summary.data.length > 0) {
      const csvData = hackConvertAPIDataToLegacyFormat(summary.data);
      const columns = Object.keys(csvData[0]);
      const csv = unparse(csvData, { columns });
      return csv;
    }
    return undefined;
  }

  private generateTableSummaryData(stations: IStationRow[], products: IClimateProductRow[]) {
    if (stations.length > 0 && products.length > 0) {
      // NOTE - only single entry for rainfallSummary (not hashmapArray)
      const productsHashmap = arrayToHashmapArray(products, 'station_id');
      const summary = stations.map((station) => {
        const { station_id } = station;
        const rainfallSummary = productsHashmap[station_id]?.find((p) => p.type === 'rainfallSummary');
        if (rainfallSummary) {
          const { data, station_id, type } = rainfallSummary;
          const entries: IAnnualRainfallSummariesData[] = data?.['data'] || [];
          const start_year = entries[0]?.year;
          const end_year = entries[entries.length - 1]?.year;
          return { station_id, type, updated_at: '', start_year, end_year, csv: '', data: data?.['data'] };
        } else {
          return { station_id };
        }
      });
      console.log(summary);
      return summary;
    }
    return [];
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
