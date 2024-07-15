import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { ClimateService } from '../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../components/api-status/api-status';
import { IForecastRow } from '../../types';

const DISPLAY_COLUMNS: (keyof IForecastRow)[] = [
  'country_code',
  'district',
  'type',
  'language_code',
  'filename',
  'date_modified',
  'storage_file',
];

@Component({
  selector: 'dashboard-climate-forecast',
  standalone: true,
  imports: [
    CommonModule,
    DashboardClimateApiStatusComponent,
    RouterModule,
    PicsaDataTableComponent,
    DashboardMaterialModule,
  ],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateForecastPageComponent implements OnInit {
  public forecastData: IForecastRow[] = [];

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: (row: IForecastRow) => this.handleStorageClick(row),
  };
  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshData() },
    showStatusCode: false,
  };

  public activeDownloads: Record<string, 'pending' | 'complete'> = {};

  constructor(private service: ClimateService, private supabase: SupabaseService, private cdr: ChangeDetectorRef) {}

  private get db() {
    return this.supabase.db.table('climate_forecasts');
  }

  async ngOnInit() {
    await this.service.ready();
    // TODO - read from deployment
    const country_code = 'mw';
    // Load data stored in supabase db if available. Otherwise load from api
    const { data, error } = await this.db.select<'*', IForecastRow>('*').eq('country_code', country_code);
    if (error) throw error;
    if (data?.length > 0) {
      this.loadForecastData(data);
    } else {
      await this.refreshData();
    }
  }

  public async handleStorageClick(row: IForecastRow) {
    // handle download if storage file doesn't exist or hasn't been downloaded
    if (!row.storage_file && this.activeDownloads[row.filename] !== 'complete') {
      await this.downloadStorageFile(row);
    }
    // handle open
    const storagePath = `climate/forecasts/${row.filename}`;
    const publicLink = this.supabase.storage.getPublicLink('mw', storagePath);
    open(publicLink, '_blank');
  }

  private async downloadStorageFile(row: IForecastRow) {
    this.activeDownloads[row.filename] = 'pending';
    this.cdr.markForCheck();
    await this.service.loadFromAPI.forecast_file(row);
    this.activeDownloads[row.filename] = 'complete';
    this.cdr.markForCheck();
  }

  private loadForecastData(data: any[] = []) {
    this.forecastData = data;
    this.cdr.detectChanges();
  }

  public async refreshData() {
    const data = await this.service.loadFromAPI.forecasts('mw');
    this.loadForecastData(data);
  }
}
