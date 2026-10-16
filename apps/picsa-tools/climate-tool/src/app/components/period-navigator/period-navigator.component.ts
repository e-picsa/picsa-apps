import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';
import { PicsaClimateMaterialModule } from '../material.module';

@Component({
  selector: 'climate-period-navigator',
  templateUrl: './period-navigator.component.html',
  styleUrls: ['./period-navigator.component.scss'],
  imports: [PicsaClimateMaterialModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodNavigatorComponent {
  chartService = inject(ClimateChartService);
}
