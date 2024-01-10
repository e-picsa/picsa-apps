import { JsonPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';

import { ClimateDataDashboardService } from '../../../../climate-data.service';
import { ClimateDataApiService } from '../../../../climate-data-api.service';
import { RAINFALL_SUMMARY_MOCK } from './rainfall-summary.spec';

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
    public api: ClimateDataApiService,
    private service: ClimateDataDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50],
  };

  ngAfterViewInit() {
    // TODO - retrieve from server
    this.loadData(RAINFALL_SUMMARY_MOCK);
  }

  public async refreshData() {
    const { station_id, country_code } = this.service.activeStation;
    const { response, data, error } = await this.api
      .useCallback('rainfallSummary')
      .POST('/v1/annual_rainfall_summaries/', {
        body: {
          country: `${country_code}` as any,
          station_id: `${station_id}`,
          summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
        },
      });
    console.log({ response, data, error });
    this.loadData(data as any);
  }

  private loadData(summary: IRainfallSummary) {
    this.summary = summary;
    this.cdr.markForCheck();
  }
}
