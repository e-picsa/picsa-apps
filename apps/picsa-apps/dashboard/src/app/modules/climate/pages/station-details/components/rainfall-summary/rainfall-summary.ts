import { JsonPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { generateChartConfig } from '@picsa/climate/src/app/utils';
import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import { IChartMeta, IStationData } from '@picsa/models/src';
import { PicsaChartComponent } from '@picsa/shared/features';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { ChartConfiguration } from 'c3';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../../../components/api-status/api-status';
import { APITypes, IClimateProductRow } from '../../../../types';

type AnnualRainfallSummariesdata = APITypes.components['schemas']['AnnualRainfallSummariesdata'];

interface IRainfallSummary {
  // TODO - improve typings
  data: any[];
  metadata: any;
}

@Component({
  selector: 'dashboard-climate-rainfall-summary',
  templateUrl: './rainfall-summary.html',
  standalone: true,
  imports: [
    DashboardClimateApiStatusComponent,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PicsaDataTableComponent,
    PicsaChartComponent,
    JsonPipe,
  ],
  styleUrl: './rainfall-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RainfallSummaryComponent implements AfterViewInit {
  public summaryMetadata: IRainfallSummary['metadata'] = {};
  public summaryData: IRainfallSummary['data'] = [];
  public apiClientId: string;
  public chartDefintions: IChartMeta[] = [];
  public activeChartConfig: Partial<ChartConfiguration>;
  constructor(private service: ClimateService, private cdr: ChangeDetectorRef, private supabase: SupabaseService) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshData() },
    showStatusCode: true,
  };

  private get db() {
    return this.supabase.db.table('climate_products');
  }

  async ngAfterViewInit() {
    const { id } = this.service.activeStation;
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data } = await this.db
      .select<'*', IClimateProductRow>('*')
      .eq('station_id', id)
      .eq('type', 'rainfallSummary')
      .single();
    if (data) {
      this.loadData((data?.data as any) || { data: [], metadata: {} });
    } else {
      await this.refreshData();
    }
  }

  public async refreshData() {
    const { apiCountryCode, activeStation } = this.service;
    const { station_id } = activeStation;

    if (station_id && apiCountryCode) {
      this.apiClientId = `rainfallSummary_${apiCountryCode}_${station_id}`;
      this.cdr.markForCheck();
      const data = await this.service.loadFromAPI.rainfallSummaries(apiCountryCode, station_id);
      const summary = data?.[0];
      if (summary) {
        this.loadData(summary.data as any);
        this.cdr.markForCheck();
      }
    }
  }

  public async setActiveChart(definition: IChartMeta) {
    if (this.summaryData.length > 0) {
      const config = await generateChartConfig(this.summaryData, definition);
      this.activeChartConfig = config;
    }
  }

  private loadData(summary: IRainfallSummary) {
    this.tableOptions.exportFilename = `${this.service.activeStation.station_name}_rainfallSummary.csv`;
    const { data, metadata } = summary;
    this.summaryData = this.convertAPIDataToLegacyFormat(data);
    this.summaryMetadata = metadata;
    const { country_code } = this.service.activeStation;
    const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
    this.chartDefintions = Object.values(definitions);
    this.cdr.markForCheck();
  }

  // TODO - refactor components to use modern format
  private convertAPIDataToLegacyFormat(apiData: AnnualRainfallSummariesdata[] = []) {
    const data: Partial<IStationData>[] = apiData.map((el) => ({
      Year: el.year,
      End: el.end_rains_doy,
      Extreme_events: 0,
      Length: el.season_length,
      Rainfall: el.annual_rain,
      Start: el.start_rains_doy,
    }));
    return data;
  }
}
