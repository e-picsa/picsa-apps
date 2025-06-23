import { ChangeDetectionStrategy, Component, computed, effect } from '@angular/core';

import { DashboardMaterialModule } from '../../../../material.module';
import { ClimateService } from '../../climate.service';
import { ChartSummaryComponent } from './components/chart-summary/chart-summary.component';
import { CropProbabilitiesComponent } from './components/crop-probabilities/crop-probabilities.component';
import { RainfallSummaryComponent } from './components/rainfall-summary/rainfall-summary';

@Component({
  selector: 'dashboard-station-details',
  imports: [DashboardMaterialModule, RainfallSummaryComponent, ChartSummaryComponent, CropProbabilitiesComponent],
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationDetailsPageComponent {
  stationSummary = computed(() => {
    const station = this.service.activeStation();
    const entries = Object.entries(station || {}).filter(([key]) => !['id', 'country_code'].includes(key));
    return {
      keys: entries.map(([key]) => key),
      values: entries.map(([, value]) => value),
    };
  });

  constructor(public service: ClimateService) {}
}
