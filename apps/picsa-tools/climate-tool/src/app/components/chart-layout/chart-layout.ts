import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, viewChild } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n/src';
import { IChartMeta } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';
import { LineToolComponent } from '../chart-tools/line-tool/line-tool.component';
import { ProbabilityToolComponent } from '../chart-tools/probability-tool/probability-tool';
import { TercilesToolComponent } from '../chart-tools/terciles-tool/terciles-tool.component';

/******************************************************************
 * Component to display highly customised charts for climate data
 * Additionally renders line tool alongside (to prevent lots of
 * data passing up and down)
 *****************************************************************/
@Component({
  selector: 'climate-chart-layout',
  templateUrl: 'chart-layout.html',
  styleUrls: ['chart-layout.scss'],
  imports: [
    PicsaTranslateModule,
    PicsaChartComponent,
    LineToolComponent,
    ProbabilityToolComponent,
    TercilesToolComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.has-line-tool]': 'toolService.enabled().line',
  },
})
export class ClimateChartLayoutComponent implements AfterViewInit {
  chartService = inject(ClimateChartService);
  toolService = inject(ClimateToolService);

  readonly definition = input.required<IChartMeta>();

  readonly picsaChart = viewChild<PicsaChartComponent>('picsaChart');

  ngAfterViewInit() {
    const chart = this.picsaChart();
    if (chart) {
      this.chartService.registerChartComponent(chart);
    }
  }
}

/*****************************************************************************
 *   Defaults and Interfaces
 ****************************************************************************/
