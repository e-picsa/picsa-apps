import { AfterViewInit, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { ClimateDataDashboardService } from '../../../../climate-data.service';
import { ClimateDataApiService } from '../../../../climate-data-api.service';
import { RAINFALL_SUMMARY_MOCK } from './rainfall-summary.spec';

@Component({
  selector: 'dashboard-climate-rainfall-summary',
  templateUrl: './rainfall-summary.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTabsModule],
  styleUrl: './rainfall-summary.scss',
})
export class RainfallSummaryComponent implements AfterViewInit {
  constructor(public api: ClimateDataApiService, private service: ClimateDataDashboardService) {}

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
    this.loadData(data);
  }

  private loadData(summaryData) {
    console.log('loading data', summaryData);
    const { data, metadata } = summaryData;
  }
}
