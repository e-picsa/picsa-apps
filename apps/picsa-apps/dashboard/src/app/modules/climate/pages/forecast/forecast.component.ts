import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from '../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../components/api-status/api-status';
import { IForecastRow } from '../../types';

@Component({
  selector: 'dashboard-climate-forecast',
  standalone: true,
  imports: [CommonModule, DashboardClimateApiStatusComponent, RouterModule, PicsaDataTableComponent],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateForecastPageComponent implements OnInit {
  public forecastData: IForecastRow[] = [];

  public tableOptions: IDataTableOptions = {
    displayColumns: ['country', 'district', 'type', 'language', 'date_modified'],
  };
  public apiStatusOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshData() },
    showStatusCode: false,
  };

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
  private loadForecastData(data: any[] = []) {
    this.forecastData = data;
    this.cdr.detectChanges();
  }

  public async refreshData() {
    const data = await this.service.loadFromAPI.forecasts('mw');
    this.loadForecastData(data);
  }
}
