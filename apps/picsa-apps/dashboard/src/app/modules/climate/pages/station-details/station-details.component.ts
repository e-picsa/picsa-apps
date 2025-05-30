import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ClimateService } from '../../climate.service';
import { RainfallSummaryComponent } from './components/rainfall-summary/rainfall-summary';

@Component({
  selector: 'dashboard-station-details',
  imports: [MatProgressBarModule, RainfallSummaryComponent],
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationDetailsPageComponent {
  public station = this.service.activeStation;

  stationSummary = computed(() => {
    const station = this.service.activeStation();
    const entries = Object.entries(station || {}).filter(([key]) => !['id', 'country_code'].includes(key));
    return {
      keys: entries.map(([key]) => key),
      values: entries.map(([, value]) => value),
    };
  });

  constructor(private service: ClimateService) {}
}
