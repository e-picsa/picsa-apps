import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IStationRow } from '../../../../../types';

@Component({
  selector: 'dashboard-climate-location-summary',
  imports: [CommonModule],
  templateUrl: './location-summary.component.html',
  styleUrl: './location-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationSummaryComponent {
  public station = input.required<IStationRow>();
  stationSummary = computed(() => {
    const station = this.station();
    const entries = Object.entries(station || {}).filter(([key]) => !['id', 'country_code'].includes(key));
    return {
      keys: entries.map(([key]) => key),
      values: entries.map(([, value]) => value),
    };
  });
}
