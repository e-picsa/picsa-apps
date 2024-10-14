import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
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
import {
  IAnnualRainfallSummariesData,
  IAnnualRainfallSummariesMetadata,
  IClimateSummaryRainfallRow,
  IStationRow,
} from '../../../../types';
import { hackConvertAPIDataToLegacyFormat } from './rainfall-summary.utils';

interface IRainfallSummary {
  data: IAnnualRainfallSummariesData[];
  metadata: IAnnualRainfallSummariesMetadata;
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
export class RainfallSummaryComponent {
  public summaryMetadata: IRainfallSummary['metadata'] = {};
  public summaryData: IStationData[] = [];
  public apiClientId: string;
  public chartDefintions: IChartMeta[] = [];
  public activeChartConfig: Partial<ChartConfiguration>;
  constructor(private service: ClimateService, private cdr: ChangeDetectorRef, private supabase: SupabaseService) {
    effect(() => {
      const activeStation = this.service.activeStation();
      if (activeStation) {
        this.loadActiveStation(activeStation);
      }
    });
  }

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshData() },
    showStatusCode: true,
  };

  private get activeStation() {
    return this.service.activeStation();
  }

  private get db() {
    return this.supabase.db.table('climate_summary_rainfall');
  }

  private async loadActiveStation(station: IStationRow) {
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data, error } = await this.db
      .select<'*', IClimateSummaryRainfallRow>('*')
      .eq('station_id', station.id)
      .single();
    if (data) {
      this.loadData(data);
      this.cdr.markForCheck();
    } else {
      await this.refreshData();
      this.cdr.markForCheck();
    }
  }

  public async refreshData() {
    if (this.activeStation) {
      this.apiClientId = `rainfallSummary_${this.activeStation.id}`;
      const data = await this.service.loadFromAPI.rainfallSummaries(this.activeStation);
      const summary = data?.[0];
      if (summary) {
        this.loadData(summary);
      }
    }
  }

  public async setActiveChart(definition: IChartMeta) {
    if (this.summaryData.length > 0) {
      const config = await generateChartConfig(this.summaryData, definition);
      this.activeChartConfig = config;
    }
  }

  private loadData(summary: IClimateSummaryRainfallRow) {
    console.log('load data', summary);
    this.tableOptions.exportFilename = `${this.activeStation.id}.csv`;
    const { data, metadata } = summary;
    this.summaryData = hackConvertAPIDataToLegacyFormat(data);
    // this.summaryData = data;
    this.summaryMetadata = metadata;
    const { country_code } = this.activeStation;
    const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
    this.chartDefintions = Object.values(definitions);
  }
}
