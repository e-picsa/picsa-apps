import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { IChartMeta } from '@picsa/models';
import { PicsaChartComponent } from '@picsa/shared/features/charts/chart';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';

/******************************************************************
 * Component to display highly customised charts for climate data
 * Additionally renders line tool alongside (to prevent lots of
 * data passing up and down)
 *****************************************************************/
@Component({
  selector: 'climate-chart-layout',
  templateUrl: 'chart-layout.html',
  styleUrls: ['chart-layout.scss'],
  standalone: false,
})
export class ClimateChartLayoutComponent implements AfterViewInit {
  @Input() definition: IChartMeta;

  @ViewChild('picsaChart', { static: false }) picsaChart: PicsaChartComponent;

  constructor(
    public chartService: ClimateChartService,
    public toolService: ClimateToolService,
  ) {}

  ngAfterViewInit() {
    this.chartService.registerChartComponent(this.picsaChart);
  }
}

/*****************************************************************************
 *   Defaults and Interfaces
 ****************************************************************************/
