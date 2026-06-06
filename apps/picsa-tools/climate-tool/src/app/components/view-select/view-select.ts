import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

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
  public readonly chartService = inject(ClimateChartService);

  /** Ensure router link matches station id from parameters */
  public routerLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
    queryParams: 'exact',
  };

  /** DEPRECATED - to confirm if plan to bring back */
  readonly availableReports = computed<IReportMeta[]>(() => []);
}
