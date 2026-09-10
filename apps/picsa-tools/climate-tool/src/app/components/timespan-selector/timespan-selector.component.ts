import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MONTH_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { ClimateTimespanMode, IThreeMonthPeriod } from '@picsa/models';

import { ClimateChartService } from '../../services/climate-chart.service';
import { PicsaClimateMaterialModule } from '../material.module';

@Component({
  selector: 'climate-timespan-selector',
  templateUrl: './timespan-selector.component.html',
  styleUrls: ['./timespan-selector.component.scss'],
  imports: [PicsaClimateMaterialModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimespanSelectorComponent {
  chartService = inject(ClimateChartService);
  months = MONTH_DATA;

  onModeChange(mode: ClimateTimespanMode) {
    this.chartService.setTimespanMode(mode);
  }

  onMonthSelect(month: number) {
    this.chartService.setSelectedMonth(month);
  }

  onPeriodSelect(period: IThreeMonthPeriod) {
    this.chartService.setSelectedPeriod(period);
  }
}
