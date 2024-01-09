import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClimateDataDashboardService } from '../../../climate-data.service';
import { ClimateDataApiService } from '../../../climate-data-api.service';

@Component({
  selector: 'dashboard-climate-rainfall-summary',
  templateUrl: './rainfall-summary.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  styleUrl: './rainfall-summary.scss',
})
export class RainfallSummaryComponent {
  constructor(public api: ClimateDataApiService, private service: ClimateDataDashboardService) {}

  public async refreshData() {
    const { response, data, error } = await this.api
      .useCallback('rainfallSummary')
      .POST('/v1/annual_rainfall_summaries/', {
        body: {
          country: 'zm',
          station_id: '1',
          summaries: ['annual_rain', 'start_rains', 'end_rains', 'end_season', 'seasonal_rain', 'seasonal_length'],
        },
      });
    console.log({ response, data, error });
  }
}
