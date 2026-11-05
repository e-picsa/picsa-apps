import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardMaterialModule } from '../../../../../material.module';
import { IForecastRow } from '../../../types';
import { buildForecastOverview } from './forecast-overview.utils';

/**
 * Read-only monitoring summary for forecast pipeline health:
 * live vs pending daily/weekly counts for the current and previous month,
 * latest seasonal availability, downscaled location coverage and last sync.
 * Rows are supplied by the parent page (already scoped to its country).
 */
@Component({
  selector: 'dashboard-climate-forecast-overview',
  imports: [CommonModule, DashboardMaterialModule],
  templateUrl: './forecast-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardClimateForecastOverviewComponent {
  public rows = input<IForecastRow[]>([]);

  protected overview = computed(() => buildForecastOverview(this.rows()));
}
