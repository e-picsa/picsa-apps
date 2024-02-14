import { JsonPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent } from '../../../../components/api-status/api-status';
import { IClimateProductRow } from '../../../../types';

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
    JsonPipe,
  ],
  styleUrl: './rainfall-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RainfallSummaryComponent implements AfterViewInit {
  public summary: IRainfallSummary = { data: [], metadata: {} };
  public apiClientId: string;
  constructor(private service: ClimateService, private cdr: ChangeDetectorRef, private supabase: SupabaseService) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  private get db() {
    return this.supabase.db.table('climate_products');
  }

  async ngAfterViewInit() {
    const { station_id } = this.service.activeStation;
    // Load data stored in supabase db if available. Otherwise load from api
    // TODO - nicer if could include db lookups as part of mapping doc
    const { data } = await this.db
      .select<'*', IClimateProductRow>('*')
      .eq('station_id', station_id)
      .eq('type', 'rainfallSummary')
      .single();
    if (data) {
      this.loadData((data?.data as any) || { data: [], metadata: {} });
    } else {
      await this.refreshData();
    }
  }

  public async refreshData() {
    const { station_id, country_code } = this.service.activeStation;
    if (station_id && country_code) {
      this.apiClientId = `rainfallSummary_${country_code}_${station_id}`;
      this.cdr.markForCheck();
      const data = await this.service.loadFromAPI.rainfallSummaries(country_code, station_id);
      const summary = data?.[0];
      if (summary) {
        this.loadData(summary.data as any);
        this.cdr.markForCheck();
      }
    }
  }

  private loadData(summary: IRainfallSummary) {
    this.tableOptions.exportFilename = `${this.service.activeStation.station_name}_rainfallSummary.csv`;
    this.summary = summary;
    this.cdr.markForCheck();
  }
}
