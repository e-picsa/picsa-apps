import { JsonPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from '../../../../climate.service';
import { ClimateApiService } from '../../../../climate-api.service';

interface IRainfallSummary {
  data: any[];
  metadata: any;
}

@Component({
  selector: 'dashboard-climate-rainfall-summary',
  templateUrl: './rainfall-summary.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTabsModule, PicsaDataTableComponent, JsonPipe],
  styleUrl: './rainfall-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RainfallSummaryComponent implements AfterViewInit {
  public summary: IRainfallSummary = { data: [], metadata: {} };
  constructor(
    public api: ClimateApiService,
    private service: ClimateService,
    private cdr: ChangeDetectorRef,
    private supabase: SupabaseService
  ) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  public get res() {
    return this.api.meta.rainfallSummary || {};
  }

  private get db() {
    return this.supabase.db.table('climate_products');
  }

  async ngAfterViewInit() {
    const { station_id } = this.service.activeStation;
    // Load data stored in supabase db if available. Otherwise load from api
    const { data } = await this.db.select('*').eq('station_id', station_id).eq('type', 'rainfallSummary').single();
    if (data) {
      this.loadData(data?.data || { data: [], metadata: {} });
    } else {
      await this.refreshData();
    }
  }

  public async refreshData() {
    const { station_id, country_code } = this.service.activeStation;
    const { data, error } = await this.api.useMeta('rainfallSummary').POST('/v1/annual_rainfall_summaries/', {
      body: {
        country: `${country_code}` as any,
        station_id: `${station_id}`,
        summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
      },
    });
    this.cdr.markForCheck();
    if (error) throw error;
    this.loadData(data as any);
    // TODO - generalise way to persist db updates from api queries
    const dbRes = await this.supabase.db.table('climate_products').upsert({
      data,
      station_id,
      type: 'rainfallSummary',
    });
    console.log('climate data persist', dbRes);
  }

  private loadData(summary: IRainfallSummary) {
    this.tableOptions.exportFilename = `${this.service.activeStation.station_name}_rainfallSummary.csv`;
    this.summary = summary;
    this.cdr.markForCheck();
  }
}
