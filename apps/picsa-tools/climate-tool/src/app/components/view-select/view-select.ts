import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IChartMeta } from '@picsa/models';
import { isEqual } from '@picsa/utils/object.utils';

import { IReportMeta } from '../../models';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss'],
  imports: [MatCardModule, RouterLink, RouterLinkActive, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSelectComponent {
  private chartService = inject(ClimateChartService);

  /** Ensure router link matches station id from parameters */
  public routerLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
    queryParams: 'exact',
  };

  readonly availableCharts = computed<IChartMeta[]>(
    () => {
      const station = this.chartService.station();
      if (!station) return [];
      const definitions = station.definitions;
      if (!definitions) return [];
      return Object.values(definitions).filter((v) => v && !v.disabled);
    },
    { equal: isEqual },
  );

  /** DEPRECATED - to confirm if plan to bring back */
  readonly availableReports = computed<IReportMeta[]>(() => []);
}
