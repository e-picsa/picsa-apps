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
    const { activeStation } = this.service;
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data, error } = await this.db
      .select<'*', IClimateProductRow>('*')
      .eq('station_id', activeStation().id)
      .eq('type', 'rainfallSummary')
      .single();
    if (data) {
      this.loadData((data.data as any) || { data: [], metadata: {} });
      this.cdr.markForCheck();
    } else {
      await this.refreshData();
      this.cdr.markForCheck();
    }
  }

  public async refreshData() {
    if (this.service.activeStation) {
      this.apiClientId = `rainfallSummary_${this.service.activeStation().id}`;
      const data = await this.service.loadFromAPI.rainfallSummaries(this.service.activeStation());
      const summary = data?.[0];
      if (summary) {
        this.loadData(summary.data as any);
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
    console.log('load data', summary);
    this.tableOptions.exportFilename = `${this.service.activeStation().station_name}_rainfallSummary.csv`;
    const { data, metadata } = summary;
    this.summaryData = this.convertAPIDataToLegacyFormat(data);
    this.summaryMetadata = metadata;
    const { country_code } = this.service.activeStation();
    const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
    this.chartDefintions = Object.values(definitions);
  }

  // TODO - refactor components to use modern format
  private convertAPIDataToLegacyFormat(apiData: AnnualRainfallSummariesdata[] = []) {
    const data: Partial<IStationData>[] = apiData.map((el) => ({
      Year: el.year,
      // HACK - use either end_rains or end_season depending on which has data populated
      // TODO - push for single value to be populated at api level
      End: el.end_rains_doy || el.end_season_doy,
      Extreme_events: null as any,
      Length: el.season_length,
      // HACK - replace 0mm with null value
      Rainfall: el.annual_rain || undefined,
      Start: el.start_rains_doy,
    }));
    return data;
  }
}
